import os
from fastapi.testclient import TestClient


def test_dev_oauth_google_redirect():
    os.environ["DEV_OAUTH"] = "1"
    from app.main import app

    client = TestClient(app)
    resp = client.get("/auth/login/google")
    # TestClient may follow redirects; check either header or final url contains token
    loc = resp.headers.get("location", "")
    assert ("token=" in loc) or ("token=" in str(resp.url))


def test_dev_oauth_linkedin_redirect():
    os.environ["DEV_OAUTH"] = "1"
    from app.main import app

    client = TestClient(app)
    resp = client.get("/auth/login/linkedin")
    loc = resp.headers.get("location", "")
    assert ("token=" in loc) or ("token=" in str(resp.url))
