from __future__ import annotations

import time
import asyncio
from dataclasses import dataclass
from typing import Any, Optional, Sequence, Dict

import httpx
from openai import AsyncOpenAI

from app.config import settings
from app.utils.logging_utils import get_logger

logger = get_logger("llm_router")

# Concurrency control to prevent overwhelming providers
GLOBAL_LLM_SEMAPHORE = asyncio.Semaphore(5)

@dataclass(frozen=True)
class LLMResult:
    text: str
    provider: str
    model: str
    fallback_used: bool
    routing_reason: str
    latency_ms: float
    context_chunks: int
    context_chars: int
    context_tokens_est: int

def _estimate_tokens(text: str) -> int:
    if not text: return 0
    return max(1, len(text) // 4)

def _dedupe_preserve_order(items: Sequence[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for it in items:
        if not it: continue
        key = it.strip()
        if not key or key in seen: continue
        seen.add(key)
        out.append(it)
    return out

def _optimize_context(chunks: Sequence[str], max_chars: int) -> tuple[list[str], int]:
    cleaned = _dedupe_preserve_order([c.strip() for c in chunks if isinstance(c, str) and c.strip()])
    if not cleaned: return [], 0
    total = 0
    kept: list[str] = []
    for c in cleaned:
        if total >= max_chars: break
        remaining = max_chars - total
        piece = c[:remaining]
        kept.append(piece)
        total += len(piece)
    return kept, total

class ProviderHealth:
    def __init__(self):
        self.consecutive_failures = 0
        self.last_failure_time = 0
        self.cooldown_period = 30 # seconds

    def record_failure(self):
        self.consecutive_failures += 1
        self.last_failure_time = time.time()

    def record_success(self):
        self.consecutive_failures = 0

    def is_healthy(self) -> bool:
        if self.consecutive_failures < 3:
            return True
        return (time.time() - self.last_failure_time) > self.cooldown_period

class GroqProvider:
    def __init__(self) -> None:
        self._client: Optional[AsyncOpenAI] = None
        self.health = ProviderHealth()

    def _get_client(self) -> AsyncOpenAI:
        if self._client is None:
            api_key = settings.get_groq_api_key()
            if not api_key:
                raise ValueError("GROQ_API_KEY is required")
            # Fixed AsyncClient init by removing unexpected args and ensuring stability
            self._client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1",
                timeout=settings.LLM_TIMEOUT_SECONDS,
            )
        return self._client

    async def generate(
        self,
        *,
        model: str,
        system: str,
        user: str,
        temperature: float,
        max_tokens: int,
        require_json: bool,
    ) -> str:
        async with GLOBAL_LLM_SEMAPHORE:
            client = self._get_client()
            kwargs: dict[str, Any] = {}
            if require_json:
                kwargs["response_format"] = {"type": "json_object"}
            
            # Exponential backoff for rate limits
            for attempt in range(3):
                try:
                    resp = await client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                        temperature=temperature,
                        max_tokens=max_tokens,
                        **kwargs,
                    )
                    self.health.record_success()
                    return resp.choices[0].message.content or ""
                except Exception as e:
                    if "429" in str(e) and attempt < 2:
                        wait = (attempt + 1) * 2
                        logger.warning(f"Groq Rate Limit (429). Retrying in {wait}s...")
                        await asyncio.sleep(wait)
                        continue
                    self.health.record_failure()
                    raise e
            return ""

class GeminiProvider:
    def __init__(self) -> None:
        self._base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.health = ProviderHealth()

    async def generate(
        self,
        *,
        model: str,
        system: str,
        user: str,
        temperature: float,
        max_tokens: int,
        require_json: bool,
    ) -> str:
        async with GLOBAL_LLM_SEMAPHORE:
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                raise ValueError("GEMINI_API_KEY is required")

            payload: dict[str, Any] = {
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [{"role": "user", "parts": [{"text": user}]}],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens,
                },
            }
            if require_json:
                payload["generationConfig"]["responseMimeType"] = "application/json"

            url = f"{self._base_url}/models/{model}:generateContent"
            headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}
            
            # Exponential backoff for Gemini
            for attempt in range(3):
                try:
                    async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
                        r = await client.post(url, headers=headers, json=payload)
                        if r.status_code == 429:
                            raise Exception("429 Too Many Requests")
                        r.raise_for_status()
                        data = r.json()

                    candidates = data.get("candidates") or []
                    if not candidates: return ""
                    content = (candidates[0].get("content") or {})
                    parts = content.get("parts") or []
                    if not parts: return ""
                    text = parts[0].get("text")
                    self.health.record_success()
                    return text or ""
                except Exception as e:
                    if "429" in str(e) and attempt < 2:
                        wait = (attempt + 1) * 5 # Gemini needs more cooldown
                        logger.warning(f"Gemini Rate Limit (429). Retrying in {wait}s...")
                        await asyncio.sleep(wait)
                        continue
                    self.health.record_failure()
                    raise e
            return ""

class SmartLLMRouter:
    def __init__(self) -> None:
        self._groq = GroqProvider()
        self._gemini = GeminiProvider()

    def choose_provider(
        self,
        *,
        task: str,
        context_text: str,
        prefer_fast: bool,
    ) -> tuple[str, str]:
        tokens = _estimate_tokens(context_text)
        
        # Check health first
        groq_ok = self._groq.health.is_healthy()
        gemini_ok = self._gemini.health.is_healthy()

        if not groq_ok and not gemini_ok:
            return "groq", "both_unhealthy_choosing_groq"
        if not groq_ok: return "gemini", "groq_unhealthy"
        if not gemini_ok: return "groq", "gemini_unhealthy"

        if task in {"chat", "clause_explain", "risk_clause"} and prefer_fast:
            return "groq", "interactive_task"

        if task == "summary" and tokens >= settings.ROUTER_LONG_SUMMARY_TOKENS:
            return "gemini", "long_summary"

        groq_limit = settings.ROUTER_GROQ_CONTEXT_TOKENS - settings.ROUTER_TOKEN_BUFFER
        if tokens > groq_limit:
            return "gemini", "context_too_large_for_groq"

        return "groq", "default"

    async def run(
        self,
        *,
        task: str,
        system: str,
        user: str,
        context_chunks: Sequence[str],
        prefer_fast: bool = True,
        require_json: bool = False,
        temperature: float = 0.2,
        max_tokens: int = 1200,
        groq_model: Optional[str] = None,
        gemini_model: Optional[str] = None,
    ) -> LLMResult:
        cleaned = _dedupe_preserve_order([c.strip() for c in context_chunks if isinstance(c, str) and c.strip()])
        full_text = "\n\n".join(cleaned)
        full_tokens_est = _estimate_tokens(full_text)
        provider, reason = self.choose_provider(task=task, context_text=full_text, prefer_fast=prefer_fast)

        max_chars = max(2000, (settings.ROUTER_GEMINI_CONTEXT_TOKENS if provider == "gemini" else settings.ROUTER_GROQ_CONTEXT_TOKENS) * 4 - 4000)
        optimized_chunks, context_chars = _optimize_context(cleaned, max_chars=max_chars)
        optimized_text = "\n\n".join(optimized_chunks)
        context_tokens_est = _estimate_tokens(optimized_text)

        groq_model_name = groq_model or settings.get_groq_model()
        gemini_model_name = gemini_model or settings.GEMINI_MODEL

        start = time.perf_counter()
        fallback_used = False
        used_provider = provider
        used_model = groq_model_name if provider == "groq" else gemini_model_name

        async def _call(p: str) -> str:
            try:
                if p == "groq":
                    return await self._groq.generate(
                        model=groq_model_name,
                        system=system,
                        user=user,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        require_json=require_json,
                    )
                return await self._gemini.generate(
                    model=gemini_model_name,
                    system=system,
                    user=user,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    require_json=require_json,
                )
            except Exception as e:
                logger.error(f"Provider {p} failed: {e}")
                raise e

        try:
            text = await _call(provider)
        except Exception as e:
            logger.warning(f"{provider} failed for task={task}: {e}")
            other = "gemini" if provider == "groq" else "groq"
            fallback_used = True
            used_provider = other
            used_model = groq_model_name if other == "groq" else gemini_model_name
            reason = f"{reason}|fallback_from_{provider}"
            try:
                text = await _call(other)
            except Exception as e2:
                logger.error(f"Ultimate fallback failed: {e2}")
                # Safe final fallback that won't crash the pipeline
                text = "{}" if require_json else "Error: Could not generate response. Please try again later."

        latency_ms = (time.perf_counter() - start) * 1000
        return LLMResult(
            text=text,
            provider=used_provider,
            model=used_model,
            fallback_used=fallback_used,
            routing_reason=reason,
            latency_ms=latency_ms,
            context_chunks=len(optimized_chunks),
            context_chars=context_chars,
            context_tokens_est=max(full_tokens_est, context_tokens_est),
        )

