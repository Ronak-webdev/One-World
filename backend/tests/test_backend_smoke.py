from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_lab_features():
    response = client.get("/api/lab/features")
    assert response.status_code == 200
    assert any(feature["id"] == "style-transfer" for feature in response.json()["features"])


def test_placeholder_returns_501():
    response = client.post("/api/lab/video-generate")
    assert response.status_code == 501

