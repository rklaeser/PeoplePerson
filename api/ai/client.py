"""Gemini API client wrapper with retry logic."""
import os
import time
import random
import json
import logging
from typing import Type, TypeVar
from pydantic import BaseModel
from google import genai

logger = logging.getLogger(__name__)
T = TypeVar('T', bound=BaseModel)


class GeminiClient:
    """Wrapper for Gemini API with structured output and retry logic."""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        self.client = genai.Client(api_key=api_key)
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

    def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        max_retries: int = 5
    ) -> T:
        """
        Generate structured output from Gemini API.

        Args:
            prompt: The prompt to send to the model
            response_schema: Pydantic model class for the expected response
            max_retries: Maximum number of retry attempts

        Returns:
            Instance of response_schema with the parsed response

        Raises:
            Exception: If all retries fail
        """
        last_error = None

        # Add JSON schema instructions to the prompt
        schema_str = response_schema.model_json_schema()
        enhanced_prompt = f"""{prompt}

Respond with a JSON object that matches this schema:
{json.dumps(schema_str, indent=2)}

Return ONLY the JSON object, no other text."""

        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=enhanced_prompt,
                )

                # Extract JSON from response text
                response_text = response.text.strip()

                # Log the raw response for debugging
                logger.debug(f"Gemini raw response (first 500 chars): {response_text[:500]}")

                # Handle markdown code blocks if present
                if response_text.startswith("```"):
                    # Remove code fence
                    response_text = response_text.split("```")[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                    response_text = response_text.strip()

                # Parse the response into the Pydantic model
                return response_schema.model_validate_json(response_text)

            except Exception as e:
                last_error = e
                error_str = str(e).lower()

                # Log the error with attempt number
                logger.error(f"Gemini API error (attempt {attempt + 1}/{max_retries}): {str(e)}")

                # Handle rate limiting (429)
                if "429" in error_str or "quota" in error_str or "rate limit" in error_str:
                    # Exponential backoff with jitter
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    logger.warning(f"Rate limited, waiting {wait_time:.1f}s before retry")
                    time.sleep(min(wait_time, 60))  # Cap at 60 seconds

                # Handle server errors (500, 503)
                elif "500" in error_str or "503" in error_str or "server error" in error_str:
                    # Fixed 2 second retry
                    logger.warning(f"Server error, waiting 2s before retry")
                    time.sleep(2)

                else:
                    # Other errors - log and raise immediately
                    logger.error(f"Non-retryable error: {str(e)}")
                    raise

        # All retries failed
        raise Exception(f"Failed after {max_retries} retries. Last error: {last_error}")
