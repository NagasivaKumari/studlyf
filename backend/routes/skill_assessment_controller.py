import logging
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, status
from pymongo import DESCENDING

from db import skill_assessments_col
from models import (
    SaveAssessmentRequest,
    AssessmentResponse,
    QuestionResult,
    MistakeAnalysis,
)

logger = logging.getLogger("skill_assessment_controller")
router = APIRouter(prefix="/api/skill-assessment", tags=["Skill Assessment"])


def _serialize(doc: dict) -> dict:
    raw_id = doc.pop("_id", None)
    doc["assessmentId"] = str(doc.get("assessmentId") or raw_id or "unknown")
    doc.setdefault("questionResults", [])
    doc.setdefault("mistakeAnalysis", [])
    doc.setdefault("weakAreas", [])
    doc.setdefault("icon", None)
    doc.setdefault("createdAt", doc.get("completedAt"))
    return doc


@router.post("/save", status_code=status.HTTP_201_CREATED)
async def save_assessment(payload: SaveAssessmentRequest):
    try:
        assessment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        doc = {
            "_id":               assessment_id,
            "assessmentId":      assessment_id,
            "userId":            payload.userId,
            "skillId":           payload.skillId,
            "skillName":         payload.skillName,
            "score":             payload.score,
            "interviewReadiness": payload.interviewReadiness,
            "level":             payload.level,
            "strengths":         payload.strengths,
            "weaknesses":        payload.weaknesses,
            "weakAreas":         payload.weakAreas,
            "questionResults":   [qr.model_dump() for qr in payload.questionResults],
            "mistakeAnalysis":   [ma.model_dump() for ma in payload.mistakeAnalysis],
            "completedAt":       payload.completedAt.isoformat(),
            "createdAt":         now.isoformat(),
        }

        await skill_assessments_col.insert_one(doc)
        logger.info(
            f"Skill assessment saved: userId={payload.userId} "
            f"skill={payload.skillId} score={payload.score}"
        )

        return {
            "success":      True,
            "assessmentId": assessment_id,
            "message":      "Assessment saved successfully",
        }

    except Exception as e:
        logger.error(f"Failed to save skill assessment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save assessment: {str(e)}",
        )


@router.get("/history/{user_id}")
async def get_assessment_history(user_id: str):
    try:
        cursor = skill_assessments_col.find(
            {"userId": user_id},
            sort=[("completedAt", DESCENDING)],
        )
        docs = await cursor.to_list(length=200)
        serialized = [_serialize(doc) for doc in docs]

        return {
            "success":     True,
            "userId":      user_id,
            "count":       len(serialized),
            "assessments": serialized,
        }

    except Exception as e:
        logger.error(f"Failed to fetch history for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assessment history: {str(e)}",
        )


@router.get("/{assessment_id}")
async def get_assessment(assessment_id: str):
    try:
        doc = await skill_assessments_col.find_one({"_id": assessment_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assessment {assessment_id} not found",
            )
        return {"success": True, "assessment": _serialize(doc)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch assessment {assessment_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assessment: {str(e)}",
        )