"""Tests for progress tracking API."""
import pytest
from httpx import AsyncClient


async def _auth_token(client: AsyncClient) -> str:
    resp = await client.post("/api/auth/register", json={
        "email": "progress_user@example.com",
        "password": "SecurePass123",
        "role": "student",
    })
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_progress_requires_auth(client: AsyncClient):
    resp = await client.get("/api/progress")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_update_progress_creates_record(client: AsyncClient):
    token = await _auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/api/progress/update", json={
        "lesson_id": "superposition",
        "module_id": "quantum-foundations",
        "status": "completed",
        "quiz_score": 8,
        "time_spent_minutes": 20,
    }, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert data["lesson_id"] == "superposition"
    assert data["quiz_score"] == 8


@pytest.mark.asyncio
async def test_get_overall_progress(client: AsyncClient):
    token = await _auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # Add some progress
    await client.post("/api/progress/update", json={
        "lesson_id": "what-is-quantum",
        "module_id": "quantum-foundations",
        "status": "completed",
        "quiz_score": 7,
        "time_spent_minutes": 15,
    }, headers=headers)

    resp = await client.get("/api/progress", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_lessons" in data
    assert "completed_lessons" in data
    assert data["completed_lessons"] >= 1
