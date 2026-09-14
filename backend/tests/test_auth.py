"""Tests for the authentication API."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_student(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "email": "student@example.com",
        "password": "SecurePass123",
        "display_name": "Test Student",
        "role": "student",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "student@example.com"
    assert data["user"]["role"] == "student"


@pytest.mark.asyncio
async def test_register_instructor(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "email": "instructor@example.com",
        "password": "SecurePass123",
        "display_name": "Dr. Instructor",
        "role": "instructor",
    })
    assert resp.status_code == 201
    assert resp.json()["user"]["role"] == "instructor"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    body = {"email": "dup@example.com", "password": "SecurePass123", "role": "student"}
    await client.post("/api/auth/register", json=body)
    resp = await client.post("/api/auth/register", json=body)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "email": "weak@example.com", "password": "123", "role": "student"
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_valid(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "login@example.com", "password": "SecurePass123", "role": "student"
    })
    resp = await client.post("/api/auth/login", json={
        "email": "login@example.com", "password": "SecurePass123"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "email": "wrongpw@example.com", "password": "SecurePass123", "role": "student"
    })
    resp = await client.post("/api/auth/login", json={
        "email": "wrongpw@example.com", "password": "WrongPassword"
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_me_with_token(client: AsyncClient):
    reg = await client.post("/api/auth/register", json={
        "email": "me@example.com", "password": "SecurePass123", "role": "student"
    })
    token = reg.json()["access_token"]
    resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"
