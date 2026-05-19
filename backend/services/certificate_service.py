import os
from jinja2 import Environment, FileSystemLoader
from datetime import datetime

class CertificateService:
    def __init__(self):
        # Setup Jinja2 environment
        template_dir = os.path.join(os.path.dirname(__file__), '../templates')
        os.makedirs(template_dir, exist_ok=True)
        self.jinja_env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=True
        )

    async def generate_certificate_pdf(self, cert_data: dict):
        """
        Generates a professional PDF certificate using HTML/CSS templates.
        """
        # 1. Create a basic HTML template if it doesn't exist
        template_path = os.path.join(os.path.dirname(__file__), '../templates/certificate_template.html')
        if not os.path.exists(template_path):
            self._create_default_template(template_path)

        # 2. Render HTML with data
        template = self.jinja_env.get_template('certificate_template.html')
        html_content = template.render(
            recipient_name=cert_data.get('recipient_name'),
            event_name=cert_data.get('event_name'),
            rank=cert_data.get('rank', 'Participant'),
            date=datetime.now().strftime("%B %d, %Y"),
            cert_id=cert_data.get('certificate_id'),
            verify_url=cert_data.get('verification_url')
        )

        # 3. Convert to PDF
        pdf_path = f"artifacts/certs/cert_{cert_data.get('certificate_id')}.pdf"
        os.makedirs("artifacts/certs", exist_ok=True)
        
        try:
            from weasyprint import HTML
            HTML(string=html_content).write_pdf(pdf_path)
            return pdf_path
        except Exception as e:
            html_path = f"artifacts/certs/cert_{cert_data.get('certificate_id')}.html"
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            print(f"[WARNING] WeasyPrint failed to compile PDF: {e}. Saved certificate as HTML fallback at {html_path}")
            return html_path

    def _create_default_template(self, path):
        with open(path, 'w', encoding='utf-8') as f:
            f.write("""
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica', sans-serif; text-align: center; color: #333; }
        .cert-container { border: 20px solid #2e75b6; padding: 50px; width: 800px; margin: auto; }
        .header { font-size: 50px; color: #2e75b6; font-weight: bold; }
        .subtitle { font-size: 20px; margin-top: 20px; }
        .name { font-size: 40px; margin: 30px 0; font-weight: bold; border-bottom: 2px solid #eee; display: inline-block; padding: 0 50px; }
        .footer { margin-top: 50px; font-size: 14px; color: #666; }
        .qr-placeholder { margin-top: 30px; }
    </style>
</head>
<body>
    <div class="cert-container">
        <div class="header">CERTIFICATE</div>
        <div class="subtitle">OF ACHIEVEMENT</div>
        <p>This is to certify that</p>
        <div class="name">{{ recipient_name }}</div>
        <p>has successfully achieved the rank of <strong>{{ rank }}</strong> in the</p>
        <h2>{{ event_name }}</h2>
        <p>Date: {{ date }}</p>
        <div class="footer">
            Verification ID: {{ cert_id }}<br>
            Verify at: {{ verify_url }}
        </div>
    </div>
</body>
</html>
""")

certificate_service = CertificateService()
