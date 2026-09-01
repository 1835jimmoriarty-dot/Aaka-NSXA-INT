import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import init_db

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()

client = TestClient(app)

def test_health_check():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["backend_status"] == "OPERATIONAL"
    assert "tools" in data

def test_project_crud():
    # Create project
    create_res = client.post("/api/v1/projects", json={
        "name": "Unit Test Project",
        "description": "Automated test suite workspace"
    })
    assert create_res.status_code == 200
    project_id = create_res.json()["id"]
    assert project_id > 0

    # Get project
    get_res = client.get(f"/api/v1/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Unit Test Project"

    # Add Target
    target_res = client.post("/api/v1/targets", json={
        "project_id": project_id,
        "raw_input": "127.0.0.1, 10.0.0.1"
    })
    assert target_res.status_code == 200
    assert len(target_res.json()) == 2

    # Get Dashboard
    dash_res = client.get(f"/api/v1/projects/{project_id}/dashboard")
    assert dash_res.status_code == 200
    assert "total_assets" in dash_res.json()

    # Clean up project
    del_res = client.delete(f"/api/v1/projects/{project_id}")
    assert del_res.status_code == 200
