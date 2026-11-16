import uuid
from datetime import datetime
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.database import get_db
from ..models.chat import ChatConversation, ChatMessage


router = APIRouter(prefix="/api/chat", tags=["AI Chat History"])


async def get_supabase_user_id(
    authorization: str | None = Header(default=None),
) -> str:
    """Validate the bearer token against Supabase Auth."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid access token")

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=503,
            detail="Supabase authentication is not configured on the backend",
        )

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.SUPABASE_ANON_KEY,
                },
            )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="Could not verify the Supabase session",
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    try:
        user_id = response.json().get("id")
    except (ValueError, AttributeError):
        user_id = None

    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=401, detail="Invalid Supabase user")

    return user_id


class ConversationCreate(BaseModel):
    title: str = Field(default="New conversation", min_length=1, max_length=200)


class MessageCreate(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=50000)
    code: str | None = Field(default=None, max_length=50000)


def conversation_dict(item: ChatConversation) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


def message_dict(item: ChatMessage) -> dict:
    return {
        "id": item.id,
        "conversation_id": item.conversation_id,
        "role": item.role,
        "content": item.content,
        "code": item.code,
        "created_at": item.created_at,
    }


async def owned_conversation(
    conversation_id: str,
    owner_id: str,
    db: AsyncSession,
) -> ChatConversation:
    result = await db.execute(
        select(ChatConversation).where(
            ChatConversation.id == conversation_id,
            ChatConversation.owner_id == owner_id,
        )
    )
    conversation = result.scalar_one_or_none()
    if conversation is None:
        # Use the same response for nonexistent and other users' conversations.
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.get("/conversations")
async def list_conversations(
    owner_id: str = Depends(get_supabase_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatConversation)
        .where(ChatConversation.owner_id == owner_id)
        .order_by(ChatConversation.updated_at.desc())
        .limit(100)
    )
    return [conversation_dict(item) for item in result.scalars().all()]


@router.post("/conversations", status_code=201)
async def create_conversation(
    body: ConversationCreate,
    owner_id: str = Depends(get_supabase_user_id),
    db: AsyncSession = Depends(get_db),
):
    conversation = ChatConversation(
        id=str(uuid.uuid4()),
        owner_id=owner_id,
        title=body.title.strip() or "New conversation",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(conversation)
    await db.flush()
    return conversation_dict(conversation)


@router.get("/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    owner_id: str = Depends(get_supabase_user_id),
    db: AsyncSession = Depends(get_db),
):
    await owned_conversation(conversation_id, owner_id, db)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
        .limit(1000)
    )
    return [message_dict(item) for item in result.scalars().all()]


@router.post("/conversations/{conversation_id}/messages", status_code=201)
async def save_message(
    conversation_id: str,
    body: MessageCreate,
    owner_id: str = Depends(get_supabase_user_id),
    db: AsyncSession = Depends(get_db),
):
    conversation = await owned_conversation(conversation_id, owner_id, db)
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    message = ChatMessage(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role=body.role,
        content=content,
        code=body.code,
        created_at=datetime.utcnow(),
    )
    db.add(message)

    now = datetime.utcnow()
    conversation.updated_at = now
    if body.role == "user" and conversation.title == "New conversation":
        conversation.title = content[:80]

    await db.flush()
    return message_dict(message)


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    owner_id: str = Depends(get_supabase_user_id),
    db: AsyncSession = Depends(get_db),
):
    conversation = await owned_conversation(conversation_id, owner_id, db)
    await db.delete(conversation)
    return None
