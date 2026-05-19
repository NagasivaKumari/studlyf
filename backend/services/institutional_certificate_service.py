import os
import io
import base64
import qrcode
import uuid
import hashlib
from jinja2 import Environment, FileSystemLoader
try:
    from weasyprint import HTML
    HAS_WEASYPRINT = True
except Exception:
    HAS_WEASYPRINT = False
from datetime import datetime
from db import certificates_col, leaderboard_col, submissions_col, scores_col

class InstitutionalCertificateService:
    """
    Automated professional certificate generation and verification system.
    """
    def __init__(self):
        template_dir = os.path.join(os.path.dirname(__file__), '../templates')
        os.makedirs(template_dir, exist_ok=True)
        self.jinja_env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=True
        )

    def _generate_qr_blob(self, url: str):
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()

    async def issue_event_certificate(self, cert_data: dict):
        cert_id = str(uuid.uuid4())
        v_code = hashlib.sha256(f"{cert_id}".encode()).hexdigest()[:10].upper()
        v_url = f"https://studlyf.com/verify/{cert_id}"
        qr_blob = self._generate_qr_blob(v_url)

        # HTML Rendering logic...
        template_path = os.path.join(os.path.dirname(__file__), '../templates/professional_certificate.html')
        if not os.path.exists(template_path):
            self._create_template(template_path)

        template = self.jinja_env.get_template('professional_certificate.html')
        issue_date = datetime.utcnow().strftime('%B %d, %Y')
        html = template.render({**cert_data, "cert_id": cert_id, "v_code": v_code, "qr_blob": qr_blob, "issue_date": issue_date})
        
        if HAS_WEASYPRINT:
            output_path = f"artifacts/certs/certificate_{cert_id}.pdf"
            os.makedirs("artifacts/certs", exist_ok=True)
            HTML(string=html).write_pdf(output_path)
        else:
            print(f"WARNING: WeasyPrint not available. Certificate {cert_id} created in DB but PDF not generated locally.")

        # Persistent Record (Spec compliant)
        await certificates_col.insert_one({
            "certificate_id": cert_id,
            "event_id": cert_data["event_id"],
            "recipient_name": cert_data["recipient_name"],
            "rank": cert_data["rank"],
            "issued_at": datetime.utcnow(),
            "verification_code": v_code,
            "immutable_flag": True
        })
        return cert_id

    def _create_template(self, path):
        with open(path, 'w', encoding='utf-8') as f:
            f.write("""
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;800&display=swap');
        body { font-family: 'Outfit', sans-serif; text-align: center; color: #1e293b; background: white; padding: 50px; }
        .border { border: 15px solid #1e293b; padding: 40px; border-double: 5px solid #d4af37; }
        .header { font-size: 50px; font-weight: 800; color: #1e293b; }
        .recipient { font-size: 40px; margin: 30px 0; border-bottom: 2px solid #d4af37; display: inline-block; padding: 0 40px; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
        .qr { width: 100px; height: 100px; }
    </style>
</head>
<body>
    <div class="border">
        <div class="header">CERTIFICATE OF ACHIEVEMENT</div>
        <p>This is to officially certify that</p>
        <div class="recipient">{{ recipient_name }}</div>
        <p>has achieved the rank of <strong>{{ rank }}</strong> in the</p>
        <h2>{{ event_name }}</h2>
        <p>Date of Issue: {{ issue_date }}</p>
        <div class="footer">
            <div style="text-align: left;">
                <img class="qr" src="data:image/png;base64,{{ qr_blob }}">
                <div style="font-size: 10px;">ID: {{ cert_id }}<br>VERIFY AT STUDLYF.COM</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 20px; font-weight: bold; border-top: 1px solid #1e293b; padding-top: 10px;">Authorized Official</div>
                <div style="font-size: 12px; color: #64748b;">Studlyf Institution Network</div>
            </div>
        </div>
    </div>
</body>
</html>
""")

certificate_service = InstitutionalCertificateService()
