import asyncio
import logging
import json
import hashlib
import uuid
from datetime import datetime, timedelta
from bson import ObjectId
from pymongo import ReturnDocument

from db import email_queue_col, email_delivery_logs_col
from services.email_service import send_notification_email

logger = logging.getLogger("email_queue_service")

# An event used to wake up the worker instantly when new items are enqueued
_wakeup_event = asyncio.Event()


def sanitize_html_body(body_html: str) -> str:
    """
    Hardens custom enqueued HTML by running it through a BeautifulSoup HTML sanitizer.
    Strips all script elements, event listeners, and javascript: links to protect against XSS.
    """
    if not body_html:
        return ""
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(body_html, "html.parser")
        
        # 1. Strip unsafe tags completely
        unsafe_tags = ["script", "iframe", "style", "link", "object", "embed", "applet", "meta", "form", "input", "button", "frame", "frameset"]
        for tag in soup(unsafe_tags):
            tag.decompose()
            
        # 2. Hardened attribute filtering
        for tag in soup.find_all(True):
            # Check href attributes on links
            if tag.name == "a" and "href" in tag.attrs:
                href = tag["href"].strip().lower()
                if any(href.startswith(prefix) for prefix in ["javascript:", "data:", "vbscript:", "onload:", "onclick:"]):
                    tag["href"] = "#"
                    
            # Clean all standard Javascript event triggers
            attrs = list(tag.attrs.keys())
            for attr in attrs:
                if attr.startswith("on") or attr in ["action", "formaction", "src"]:
                    # Allow src on safe media like images, but block data: and javascript: schemes
                    if attr == "src":
                        src = tag["src"].strip().lower()
                        if any(src.startswith(prefix) for prefix in ["javascript:", "data:", "vbscript:"]):
                            del tag["src"]
                    else:
                        del tag[attr]
                        
        return str(soup)
    except Exception as e:
        logger.warning(f"Sanitization error or bs4 missing: {e}. Running fallback simple cleaning.")
        # Basic fallback cleaning
        cleaned = body_html
        import re
        cleaned = re.sub(r'<(script|iframe|style|link|object|embed|form|input|button)[^>]*>.*?</\1>', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'on\w+\s*=\s*["\'][^"\']*["\']', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'href\s*=\s*["\']javascript:[^"\']*["\']', 'href="#"', cleaned, flags=re.IGNORECASE)
        return cleaned


async def enqueue_email(
    recipient: str,
    subject: str,
    body_html: str,
    metadata: dict = None,
    idempotency_key: str = None
) -> str:
    """
    Enqueues an email into the database-backed persistent queue.
    Performs idempotency/deduplication checks before insertion.
    Wakes up the background worker task instantly.
    """
    now = datetime.utcnow()
    recipient_clean = recipient.strip()
    
    # 1. Compute idempotency key if not explicitly provided
    if not idempotency_key:
        meta_str = json.dumps(metadata or {}, sort_keys=True)
        sig = f"{recipient_clean.lower()}:{subject}:{meta_str}"
        idempotency_key = hashlib.sha256(sig.encode("utf-8")).hexdigest()
        
    # 2. Check for existing active or recently enqueued duplicate
    existing = await email_queue_col.find_one({
        "idempotency_key": idempotency_key,
        "$or": [
            {"status": {"$in": ["pending", "processing", "retrying"]}},
            {"status": "sent", "updated_at": {"$gte": now - timedelta(minutes=5)}}
        ]
    })
    
    if existing:
        logger.info(f"Deduplicated email enqueue. Existing queue ID: {existing['_id']} for key: {idempotency_key}")
        return str(existing["_id"])
        
    # 3. Sanitize HTML body against XSS
    body_html_sanitized = sanitize_html_body(body_html)
    
    # 4. Insert new document into persistent queue
    doc = {
        "recipient": recipient_clean,
        "subject": subject,
        "body_html": body_html_sanitized,
        "status": "pending",
        "attempts": 0,
        "max_attempts": 3,
        "metadata": metadata or {},
        "idempotency_key": idempotency_key,
        "next_attempt_at": None,
        "locked_by": None,
        "locked_at": None,
        "created_at": now,
        "updated_at": now
    }
    
    result = await email_queue_col.insert_one(doc)
    doc_id = str(result.inserted_id)
    
    # Notify background worker to wake up and process
    _wakeup_event.set()
    logger.info(f"Enqueued email to {recipient_clean} with queue ID: {doc_id} (key: {idempotency_key})")
    return doc_id


async def start_email_queue_worker():
    """
    Persistent asynchronous background worker loop.
    Monitors pending queue items using atomic find_one_and_update leasing,
    dispatches them using SMTP, records outcomes to delivery logs,
    and manages exponential backoff retries.
    """
    worker_uuid = str(uuid.uuid4())
    logger.info(f"Initializing Enterprise Stage Email Dispatch Queue Worker (ID: {worker_uuid})...")
    
    while True:
        try:
            # Clear the event so we can block on it later
            _wakeup_event.clear()
            
            now = datetime.utcnow()
            # Stuck task lock timeout (5 minutes)
            lock_timeout = now - timedelta(minutes=5)
            
            # Atomic lease query
            item = await email_queue_col.find_one_and_update(
                {
                    "$or": [
                        # Normal pending or retryable tasks that are due
                        {
                            "status": {"$in": ["pending", "retrying"]},
                            "attempts": {"$lt": 3},
                            "$or": [
                                {"next_attempt_at": {"$exists": False}},
                                {"next_attempt_at": {"$lte": now}},
                                {"next_attempt_at": None}
                            ]
                        },
                        # Stuck tasks that have been in processing for too long (lock expired)
                        {
                            "status": "processing",
                            "locked_at": {"$lt": lock_timeout}
                        }
                    ]
                },
                {
                    "$set": {
                        "status": "processing",
                        "locked_by": worker_uuid,
                        "locked_at": now,
                        "updated_at": now
                    }
                },
                sort=[("created_at", 1)],
                return_document=ReturnDocument.AFTER
            )
            
            if not item:
                # No pending items, suspend execution until a new email is enqueued or a heartbeat timeout
                try:
                    await asyncio.wait_for(_wakeup_event.wait(), timeout=15.0)
                except asyncio.TimeoutError:
                    pass
                continue
            
            item_id = item["_id"]
            recipient = item["recipient"]
            subject = item["subject"]
            body_html = item["body_html"]
            attempts = item.get("attempts", 0)
            max_attempts = item.get("max_attempts", 3)
            meta = item.get("metadata", {})
            
            new_attempts = attempts + 1
            logger.info(f"Worker {worker_uuid} leased email to {recipient} (Attempt {new_attempts}/{max_attempts})...")
            
            success = False
            err_msg = ""
            try:
                success = await send_notification_email(recipient, subject, body_html)
                if not success:
                    err_msg = "SMTP send returned False"
            except Exception as e:
                err_msg = str(e)
                logger.error(f"Error during SMTP dispatch: {err_msg}")
            
            if success:
                # Update queue item to sent
                await email_queue_col.update_one(
                    {"_id": item_id},
                    {
                        "$set": {
                            "status": "sent",
                            "attempts": new_attempts,
                            "locked_by": None,
                            "locked_at": None,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                # Log successful delivery
                await email_delivery_logs_col.insert_one({
                    "recipient": recipient,
                    "subject": subject,
                    "status": "sent",
                    "attempts": new_attempts,
                    "provider": "SMTP",
                    "metadata": meta,
                    "created_at": datetime.utcnow()
                })
                logger.info(f"Successfully dispatched queue email {item_id} to {recipient}")
            else:
                # Increment attempts and log failure
                if new_attempts >= max_attempts:
                    # Permanent failure
                    await email_queue_col.update_one(
                        {"_id": item_id},
                        {
                            "$set": {
                                "status": "failed",
                                "attempts": new_attempts,
                                "failure_reason": err_msg,
                                "locked_by": None,
                                "locked_at": None,
                                "updated_at": datetime.utcnow()
                              }
                        }
                    )
                    
                    await email_delivery_logs_col.insert_one({
                        "recipient": recipient,
                        "subject": subject,
                        "status": "failed",
                        "attempts": new_attempts,
                        "provider": "SMTP",
                        "failure_reason": err_msg,
                        "metadata": meta,
                        "created_at": datetime.utcnow()
                    })
                    logger.error(f"Permanent dispatch failure for queue email {item_id} to {recipient}: {err_msg}")
                else:
                    # Exponential backoff scheduling
                    base_delay = 60  # Base delay of 60 seconds
                    delay_seconds = base_delay * (2 ** attempts)
                    next_attempt = datetime.utcnow() + timedelta(seconds=delay_seconds)
                    
                    await email_queue_col.update_one(
                        {"_id": item_id},
                        {
                            "$set": {
                                "status": "retrying",
                                "attempts": new_attempts,
                                "failure_reason": err_msg,
                                "next_attempt_at": next_attempt,
                                "locked_by": None,
                                "locked_at": None,
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                    logger.warning(
                        f"Temporary dispatch failure (will retry) for queue email {item_id} to {recipient} "
                        f"(Attempt {new_attempts}/{max_attempts}). Retrying at {next_attempt} (in {delay_seconds}s) due to: {err_msg}"
                    )
                    
        except Exception as global_ex:
            logger.error(f"Global exception in email queue background worker: {global_ex}")
            # Ensure the worker does not tight loop on continuous errors
            await asyncio.sleep(5)
