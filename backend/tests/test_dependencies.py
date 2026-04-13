"""
Tests for dependency injection providers.
"""

import pytest
from fastapi import HTTPException
from app.core.dependencies import get_session_id, get_openrouter_key


def test_session_id_validation_valid():
    """Test that valid session IDs pass validation."""
    valid_ids = [
        "simple",
        "session-123",
        "session_id",
        "a" * 64,  # Max length
        "SessionID-123_test",
    ]
    for session_id in valid_ids:
        result = get_session_id(session_id)
        assert result == session_id


def test_session_id_validation_missing():
    """Test that missing session ID raises 400."""
    with pytest.raises(HTTPException) as exc_info:
        get_session_id(None)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "SESSION_ID_MISSING"


def test_session_id_validation_empty():
    """Test that empty session ID raises 400."""
    with pytest.raises(HTTPException) as exc_info:
        get_session_id("")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "SESSION_ID_MISSING"


def test_session_id_validation_whitespace():
    """Test that whitespace-only session ID raises 400."""
    with pytest.raises(HTTPException) as exc_info:
        get_session_id("   ")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "SESSION_ID_MISSING"


def test_session_id_validation_invalid_charset():
    """Test that invalid characters in session ID raise 400."""
    invalid_ids = [
        "invalid@session",
        "session#123",
        "session$id",
        "session with spaces",
        "sessionID!",
        "a" * 65,  # Too long
    ]
    for session_id in invalid_ids:
        with pytest.raises(HTTPException) as exc_info:
            get_session_id(session_id)
        assert exc_info.value.status_code == 400
        assert exc_info.value.detail["code"] == "SESSION_ID_INVALID"


def test_openrouter_key_validation_valid(monkeypatch):
    """Test that valid API key passes."""
    from app.core import config

    monkeypatch.setattr(config.settings, "OPENROUTER_API_KEY", "sk-test-key-123")
    result = get_openrouter_key()
    assert result == "sk-test-key-123"


def test_openrouter_key_validation_missing(monkeypatch):
    """Test that missing API key raises 500."""
    from app.core import config

    monkeypatch.setattr(config.settings, "OPENROUTER_API_KEY", "")
    with pytest.raises(HTTPException) as exc_info:
        get_openrouter_key()
    assert exc_info.value.status_code == 500
    assert exc_info.value.detail["code"] == "NO_API_KEY"


def test_openrouter_key_validation_whitespace(monkeypatch):
    """Test that whitespace-only API key raises 500."""
    from app.core import config

    monkeypatch.setattr(config.settings, "OPENROUTER_API_KEY", "   ")
    with pytest.raises(HTTPException) as exc_info:
        get_openrouter_key()
    assert exc_info.value.status_code == 500
    assert exc_info.value.detail["code"] == "NO_API_KEY"
