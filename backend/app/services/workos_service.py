import os
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, List
from urllib.parse import urlencode

import requests
from jose import JWTError, jwt

from app.auth import SECRET_KEY, ALGORITHM


class WorkOSConfigurationError(Exception):
    """Raised when mandatory WorkOS configuration is missing."""


class WorkOSStateError(Exception):
    """Raised when the WorkOS state token is invalid."""


class WorkOSAPIError(Exception):
    """Raised when the WorkOS API returns an error."""


DEFAULT_BASE_URL = "https://api.workos.com"
STATE_TTL_MINUTES = int(os.getenv("WORKOS_STATE_TTL_MINUTES", "10"))
HTTP_TIMEOUT = int(os.getenv("WORKOS_HTTP_TIMEOUT_SECONDS", "15"))


def _get_settings() -> Dict[str, Optional[str]]:
    return {
        "api_key": os.getenv("WORKOS_API_KEY"),
        "client_id": os.getenv("WORKOS_CLIENT_ID"),
        "redirect_uri": os.getenv("WORKOS_REDIRECT_URI", "http://localhost:3000/auth/workos/callback"),
        "base_url": os.getenv("WORKOS_BASE_URL", DEFAULT_BASE_URL).rstrip("/"),
        "default_org": os.getenv("WORKOS_DEFAULT_ORGANIZATION_ID"),
        "default_connection": os.getenv("WORKOS_DEFAULT_CONNECTION_ID"),
        "default_provider": os.getenv("WORKOS_DEFAULT_PROVIDER"),
    }


def _require_credentials(settings: Dict[str, Optional[str]]) -> None:
    if not settings["api_key"] or not settings["client_id"]:
        raise WorkOSConfigurationError(
            "WORKOS_API_KEY and WORKOS_CLIENT_ID must be set to use WorkOS SSO."
        )


def _generate_state_token(extra: Optional[Dict[str, Any]] = None) -> str:
    payload = {
        "type": "workos_state",
        "nonce": secrets.token_urlsafe(16),
        "iat": datetime.utcnow(),
    }
    if extra:
        payload.update(extra)

    expire_at = datetime.utcnow() + timedelta(minutes=STATE_TTL_MINUTES)
    payload["exp"] = expire_at
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode_state_token(state: str) -> Dict[str, Any]:
    try:
        data = jwt.decode(state, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise WorkOSStateError("Invalid or expired WorkOS state parameter.") from exc

    if data.get("type") != "workos_state":
        raise WorkOSStateError("Unexpected WorkOS state payload.")
    return data


def build_authorization_url(
    *,
    organization_id: Optional[str] = None,
    connection_id: Optional[str] = None,
    provider: Optional[str] = None,
    login_hint: Optional[str] = None,
    domain_hint: Optional[str] = None,
    redirect_uri: Optional[str] = None,
    provider_scopes: Optional[List[str]] = None,
    provider_query_params: Optional[Dict[str, Any]] = None,
    client_state: Optional[str] = None,
) -> Dict[str, str]:
    """
    Construct the WorkOS authorization URL (no API call required).
    """
    settings = _get_settings()
    _require_credentials(settings)

    connection = connection_id or settings["default_connection"]
    organization = organization_id or settings["default_org"]
    provider_value = provider or settings["default_provider"]

    if not any([connection, organization, provider_value]):
        raise ValueError(
            "WorkOS SSO requires at least one of connection_id, organization_id, or provider."
        )

    redirect = (redirect_uri or settings["redirect_uri"]).strip()
    if not redirect:
        raise ValueError("WORKOS_REDIRECT_URI must be configured.")

    params: Dict[str, Any] = {
        "client_id": settings["client_id"],
        "redirect_uri": redirect,
        "response_type": "code",
    }
    if connection:
        params["connection"] = connection
    if organization:
        params["organization"] = organization
    if provider_value:
        params["provider"] = provider_value
    if login_hint:
        params["login_hint"] = login_hint
    if domain_hint:
        params["domain_hint"] = domain_hint
    if provider_scopes:
        params["provider_scopes"] = provider_scopes
    if provider_query_params:
        for key, value in provider_query_params.items():
            params[f"provider_query_params[{key}]"] = value

    state_token = _generate_state_token({"client_state": client_state} if client_state else None)
    params["state"] = state_token

    query = urlencode(params, doseq=True)
    authorization_url = f"{settings['base_url']}/sso/authorize?{query}"
    return {
        "authorization_url": authorization_url,
        "state": state_token,
        "redirect_uri": redirect,
    }


def exchange_code_for_profile(code: str) -> Dict[str, Any]:
    settings = _get_settings()
    _require_credentials(settings)

    if not code:
        raise ValueError("Missing WorkOS authorization code.")

    form = {
        "client_id": settings["client_id"],
        "client_secret": settings["api_key"],
        "grant_type": "authorization_code",
        "code": code,
    }
    response = requests.post(
        f"{settings['base_url']}/sso/token",
        data=form,
        timeout=HTTP_TIMEOUT,
    )
    if response.status_code >= 400:
        raise WorkOSAPIError(f"WorkOS token exchange failed: {response.text}")

    return response.json()


def validate_state(state: str) -> Dict[str, Any]:
    if not state:
        raise WorkOSStateError("Missing WorkOS state parameter.")
    return _decode_state_token(state)
