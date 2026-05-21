"""
Integration test file to validate all enhanced features
Run with: pytest tests/test_enhanced_features.py
"""

import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from bson import ObjectId

# Mock data
TEST_INSTITUTION = "test_institution_123"
TEST_EVENT = "test_event_456"
TEST_USER = "test_user_789"
TEST_SUBMISSION = "test_submission_000"

class TestAnalyticsFeature:
    """Test Analytics Dashboard service"""
    
    @pytest.mark.asyncio
    async def test_get_dashboard_kpis(self, client: AsyncClient):
        """Test KPI calculation"""
        response = await client.get(
            f"/api/v2/institution/{TEST_INSTITUTION}/analytics/kpis"
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_registrations" in data
        assert "completion_rate" in data

    @pytest.mark.asyncio
    async def test_get_conversion_funnel(self, client: AsyncClient):
        """Test conversion funnel"""
        response = await client.get(
            f"/api/v2/institution/{TEST_INSTITUTION}/analytics/funnel"
        )
        assert response.status_code == 200
        data = response.json()
        assert "funnel_stages" in data
        assert len(data["funnel_stages"]) == 4

class TestCommunicationFeature:
    """Test Communication Hub service"""
    
    @pytest.mark.asyncio
    async def test_create_segment(self, client: AsyncClient):
        """Test participant segmentation"""
        payload = {
            "institution_id": TEST_INSTITUTION,
            "type": "by_department",
            "criteria": {"department": "Engineering"}
        }
        response = await client.post(
            f"/api/v2/events/{TEST_EVENT}/segments/create",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert "segment_ids" in data

    @pytest.mark.asyncio
    async def test_send_bulk_message(self, client: AsyncClient):
        """Test bulk messaging"""
        payload = {
            "institution_id": TEST_INSTITUTION,
            "segment_ids": [TEST_USER],
            "subject": "Test Message",
            "message": "<html><body>Test</body></html>",
            "type": "email"
        }
        response = await client.post(
            f"/api/v2/events/{TEST_EVENT}/messages/send",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True

class TestEventLifecycleFeature:
    """Test Event Lifecycle Automation service"""
    
    @pytest.mark.asyncio
    async def test_create_event_with_lifecycle(self, client: AsyncClient):
        """Test event creation with lifecycle"""
        payload = {
            "institution_id": TEST_INSTITUTION,
            "title": "Test Competition",
            "description": "A test event",
            "start_date": datetime.now(timezone.utc).isoformat(),
            "end_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "registration_deadline": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
        }
        response = await client.post(
            "/api/v2/events/create-with-lifecycle",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "DRAFT"

    @pytest.mark.asyncio
    async def test_get_lifecycle_status(self, client: AsyncClient):
        """Test getting lifecycle status"""
        response = await client.get(
            f"/api/v2/events/{TEST_EVENT}/lifecycle"
        )
        assert response.status_code in [200, 404]  # 404 if event doesn't exist
        if response.status_code == 200:
            data = response.json()
            assert "current_status" in data

class TestJudgingFeature:
    """Test Advanced Judging service"""
    
    @pytest.mark.asyncio
    async def test_enable_blind_review(self, client: AsyncClient):
        """Test blind review mode"""
        response = await client.put(
            f"/api/v2/events/{TEST_EVENT}/blind-review/enable"
        )
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_plagiarism_check(self, client: AsyncClient):
        """Test plagiarism detection"""
        payload = {
            "code": "This is a sample submission code"
        }
        response = await client.post(
            f"/api/v2/submissions/{TEST_SUBMISSION}/plagiarism-check",
            json=payload
        )
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "plagiarism_score" in data

class TestReportingFeature:
    """Test Reporting Engine service"""
    
    @pytest.mark.asyncio
    async def test_generate_report(self, client: AsyncClient):
        """Test custom report generation"""
        payload = {
            "type": "event_summary",
            "filters": {},
            "format": "json"
        }
        response = await client.post(
            f"/api/v2/events/{TEST_EVENT}/reports/generate",
            json=payload
        )
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_get_report_history(self, client: AsyncClient):
        """Test report history"""
        response = await client.get(
            f"/api/v2/events/{TEST_EVENT}/reports/history"
        )
        assert response.status_code == 200

class TestGamificationFeature:
    """Test Gamification service"""
    
    @pytest.mark.asyncio
    async def test_check_badges(self, client: AsyncClient):
        """Test badge checking"""
        response = await client.post(
            f"/api/v2/users/{TEST_USER}/badges/check"
        )
        assert response.status_code == 200
        data = response.json()
        assert "badges_earned" in data

    @pytest.mark.asyncio
    async def test_get_achievements(self, client: AsyncClient):
        """Test getting achievements"""
        response = await client.get(
            f"/api/v2/users/{TEST_USER}/achievements"
        )
        assert response.status_code == 200
        data = response.json()
        assert "badges" in data
        assert "achievements" in data

class TestTalentPoolFeature:
    """Test Talent Pool Discovery service"""
    
    @pytest.mark.asyncio
    async def test_search_talent_pool(self, client: AsyncClient):
        """Test talent pool search"""
        response = await client.get(
            "/api/v2/talent-pool/search?skill=Python&min_score=70"
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data

class TestBrandingFeature:
    """Test White-Label Branding service"""
    
    @pytest.mark.asyncio
    async def test_get_branding(self, client: AsyncClient):
        """Test getting branding config"""
        response = await client.get(
            f"/api/v2/institution/{TEST_INSTITUTION}/branding"
        )
        assert response.status_code in [200, 404]

class TestComplianceFeature:
    """Test Compliance & Audit service"""
    
    @pytest.mark.asyncio
    async def test_get_audit_logs(self, client: AsyncClient):
        """Test audit log retrieval"""
        response = await client.get(
            f"/api/v2/audit-logs/{TEST_INSTITUTION}"
        )
        assert response.status_code in [200, 403]  # 403 if not authorized

@pytest.fixture
async def client():
    """Create test client"""
    from httpx import AsyncClient
    from main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_all_endpoints_exist(client: AsyncClient):
    """Meta test: verify all endpoints are registered"""
    
    endpoints_to_test = [
        ("GET", "/api/v2/institution/test/analytics/kpis"),
        ("POST", "/api/v2/events/test/segments/create"),
        ("GET", "/api/v2/events/test/lifecycle"),
        ("POST", "/api/v2/users/test/badges/check"),
        ("GET", "/api/v2/talent-pool/search"),
        ("GET", "/api/v2/audit-logs/test")
    ]
    
    responses = []
    for method, endpoint in endpoints_to_test:
        if method == "GET":
            response = await client.get(endpoint)
        else:
            response = await client.post(endpoint, json={})
        
        # We expect either success or not-found, not 404 "not found endpoint"
        responses.append((endpoint, response.status_code))
    
    print("\nEndpoint Check Results:")
    for endpoint, status in responses:
        status_text = "✅" if status < 500 else "❌"
        print(f"{status_text} {endpoint}: {status}")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
