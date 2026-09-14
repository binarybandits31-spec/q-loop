"""Tests for instructor role-based access control."""
import pytest
from httpx import AsyncClient


async def _register_and_login(client: AsyncClient, email: str, role: str) -> str:
    reg = await client.post("/api/auth/register", json={
        "email": email, "password": "SecurePass123", "display_name": "Test", "role": role
    })
    return reg.json()["access_token"]


@pytest.mark.asyncio
async def test_instructor_overview_forbidden_for_student(client: AsyncClient):
    token = await _register_and_login(client, "student@test.com", "student")
    resp = await client.get("/api/instructor/overview", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_instructor_overview_allowed_for_instructor(client: AsyncClient):
    token = await _register_and_login(client, "instructor@test.com", "instructor")
    resp = await client.get("/api/instructor/overview", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "total_students" in data


@pytest.mark.asyncio
async def test_instructor_students_list_forbidden_for_student(client: AsyncClient):
    token = await _register_and_login(client, "student2@test.com", "student")
    resp = await client.get("/api/instructor/students", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_instructor_mistakes_allowed_for_instructor(client: AsyncClient):
    token = await _register_and_login(client, "instructor2@test.com", "instructor")
    resp = await client.get("/api/instructor/mistakes", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_unauthenticated_instructor_access(client: AsyncClient):
    resp = await client.get("/api/instructor/overview")
    assert resp.status_code in (401, 403)
