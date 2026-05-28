import os
import json
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture
def cleanup_portfolios():
    # Setup - find existing files to avoid deleting pre-existing ones
    existing_files = set(os.listdir("generated_portfolios") if os.path.exists("generated_portfolios") else [])
    yield
    # Teardown - remove any new files generated during tests
    if os.path.exists("generated_portfolios"):
        for filename in os.listdir("generated_portfolios"):
            if filename not in existing_files:
                try:
                    os.remove(os.path.join("generated_portfolios", filename))
                except Exception:
                    pass

def test_generate_portfolio_manual(cleanup_portfolios):
    """Test generating a portfolio with manual inputs (no resume upload)"""
    form_data = {
        "template_id": "swiss_minimal",
        "name": "Jane Doe",
        "role": "Software Engineer",
        "email": "jane@example.com",
        "skills": "Python, FastAPI, Docker",
        "summary": "Experienced backend developer.",
        "experience": json.dumps([
            {"company": "Tech Corp", "role": "Senior Dev", "year": "2022-2024", "details": "Built API services."}
        ]),
        "projects": json.dumps([
            {"name": "StudLyf", "description": "Educational platform", "technologies": "FastAPI, React", "link": "https://github.com"}
        ]),
        "certifications": json.dumps([
            {"name": "AWS Certified", "issuer": "Amazon", "date": "2023", "link": "https://aws.com"}
        ])
    }
    
    response = client.post("/generate-portfolio/", data=form_data)
    assert response.status_code == 200
    res_data = response.json()
    assert "portfolio_url" in res_data
    
    # Extract filename from URL
    url = res_data["portfolio_url"]
    filename = url.split("/")[-1]
    
    # Verify JSON file was created
    file_path = os.path.join("generated_portfolios", filename)
    assert os.path.exists(file_path)
    
    with open(file_path, "r", encoding="utf-8") as f:
        saved_data = json.load(f)
        
    assert saved_data["name"] == "Jane Doe"
    assert saved_data["template_id"] == "swiss_minimal"
    assert saved_data["skills"] == ["Python", "FastAPI", "Docker"]
    assert len(saved_data["experience"]) == 1
    assert saved_data["experience"][0]["company"] == "Tech Corp"

def test_view_portfolio(cleanup_portfolios):
    """Test viewing a generated portfolio dynamically"""
    # 1. Create a dummy portfolio json file
    portfolio_data = {
        "template_id": "swiss_minimal",
        "name": "Alex Smith",
        "role": "Frontend Architect",
        "email": "alex@example.com",
        "skills": ["HTML", "CSS", "JS"],
        "summary": "Design systems specialist.",
        "experience": [],
        "projects": [],
        "certifications": []
    }
    
    os.makedirs("generated_portfolios", exist_ok=True)
    filename = "alexsmith-test1234.json"
    file_path = os.path.join("generated_portfolios", filename)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(portfolio_data, f)
        
    # 2. Access the /view endpoint
    response = client.get(f"/view/{filename}")
    assert response.status_code == 200
    html_content = response.text
    
    # Verify Jinja rendering and script injections
    assert "Alex Smith" in html_content
    assert "Frontend Architect" in html_content
    assert "/static/portfolio_editor.css" in html_content
    assert 'id="portfolio-data"' in html_content
    assert "/static/portfolio_editor.js" in html_content

def test_update_portfolio(cleanup_portfolios):
    """Test updating an existing portfolio's JSON content"""
    # 1. Create a dummy portfolio json file
    portfolio_data = {
        "template_id": "swiss_minimal",
        "name": "Alex Smith",
        "role": "Frontend Architect",
        "email": "alex@example.com",
        "skills": ["HTML", "CSS", "JS"],
        "summary": "Design systems specialist.",
        "experience": [],
        "projects": [],
        "certifications": []
    }
    
    os.makedirs("generated_portfolios", exist_ok=True)
    filename = "alexsmith-test1234.json"
    file_path = os.path.join("generated_portfolios", filename)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(portfolio_data, f)
        
    # 2. Update via endpoint
    updated_data = portfolio_data.copy()
    updated_data["name"] = "Alex Smith Updated"
    updated_data["skills"].append("React")
    
    response = client.post("/update-portfolio", json={
        "filename": filename,
        "data": updated_data
    })
    
    assert response.status_code == 200
    assert response.json() == {"status": "success"}
    
    # 3. Read JSON file to verify changes are saved
    with open(file_path, "r", encoding="utf-8") as f:
        saved_data = json.load(f)
        
    assert saved_data["name"] == "Alex Smith Updated"
    assert "React" in saved_data["skills"]

def test_view_portfolio_not_found():
    """Test viewing a portfolio that does not exist returns error"""
    response = client.get("/view/nonexistent-portfolio-999.json")
    assert response.status_code == 200  # API returns 200 with error JSON
    assert response.json() == {"error": "Portfolio not found"}
