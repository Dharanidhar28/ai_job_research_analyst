from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def test_register_and_login():
    client = TestClient(app)
    email = f"auth-test-{uuid4().hex}@example.com"
    password = "test-password"

    register_resp = client.post(
        "/auth/register", json={"email": email, "password": password}
    )

    assert register_resp.status_code in (200, 400)
    if register_resp.status_code == 200:
        assert register_resp.json()["token_type"] == "bearer"
        assert register_resp.json()["access_token"]

    login_resp = client.post("/auth/login", json={"email": email, "password": password})

    assert login_resp.status_code == 200
    assert login_resp.json()["token_type"] == "bearer"
    assert login_resp.json()["access_token"]
