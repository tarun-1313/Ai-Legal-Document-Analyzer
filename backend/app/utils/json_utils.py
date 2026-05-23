"""
JSON Utilities
Robust JSON parsing, validation, and repair utilities for AI responses.
"""

import json
import re
import logging
from typing import Any, Optional, Dict, List
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class JSONRepairError(Exception):
    """Raised when JSON repair fails."""
    pass


class JSONValidationError(Exception):
    """Raised when JSON validation fails."""
    pass


def strip_markdown_code_blocks(content: str) -> str:
    """
    Remove markdown code block syntax from content.
    
    Args:
        content: Raw content that may contain markdown code blocks
        
    Returns:
        Content with markdown code blocks removed
    """
    if not content:
        return ""
    
    # Remove code block markers with language specifier
    content = re.sub(r'^```(?:json|javascript|js|python|py)?\s*', '', content, flags=re.MULTILINE | re.IGNORECASE)
    # Remove closing code block markers
    content = re.sub(r'\s*```$', '', content, flags=re.MULTILINE)
    # Remove inline code backticks
    content = re.sub(r'^`+|`+$', '', content)
    
    return content.strip()


def fix_common_json_errors(json_str: str) -> str:
    """
    Fix common JSON formatting errors from LLM outputs.
    
    Args:
        json_str: JSON string that may have errors
        
    Returns:
        Repaired JSON string
    """
    if not json_str:
        return "{}"
    
    original = json_str
    
    # Remove BOM if present
    json_str = json_str.lstrip('\ufeff')
    
    # Fix trailing commas in objects and arrays
    json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
    
    # Fix missing commas between elements (common in LLM outputs)
    json_str = re.sub(r'"\s*\n\s*"', '",\n"', json_str)
    json_str = re.sub(r'\}\s*\n\s*"', '},\n"', json_str)
    json_str = re.sub(r'\]\s*\n\s*"', '],\n"', json_str)
    
    # Fix single quotes to double quotes (carefully)
    # Only replace single quotes that are likely JSON string delimiters
    def replace_single_quotes(match):
        content = match.group(1)
        # If content contains double quotes, escape them
        content = content.replace('"', '\\"')
        return f'"{content}"'
    
    # Match single-quoted strings that are likely property names or values
    json_str = re.sub(r"'([^'\n\r]*?)'(?=\s*:)", replace_single_quotes, json_str)
    
    # Fix unescaped newlines in strings
    json_str = re.sub(r'(?<=")([^"\n]*)(\n)([^"]*)(?=")', lambda m: m.group(0).replace('\n', '\\n'), json_str)
    
    # Fix unescaped tabs
    json_str = json_str.replace('\t', '\\t')
    
    # Fix unescaped carriage returns
    json_str = json_str.replace('\r', '\\r')
    
    # Fix backspace
    json_str = json_str.replace('\b', '\\b')
    
    # Fix form feed
    json_str = json_str.replace('\f', '\\f')
    
    # Remove control characters
    json_str = ''.join(char for char in json_str if ord(char) >= 32 or char in '\n\r\t')
    
    return json_str


def extract_json_from_text(text: str) -> Optional[str]:
    """
    Extract JSON object or array from text that may contain other content.
    
    Args:
        text: Text that may contain JSON
        
    Returns:
        Extracted JSON string or None if not found
    """
    if not text:
        return None
    
    text = text.strip()
    
    # Try to find JSON object
    try:
        # Find the first '{' and matching '}'
        start = text.find('{')
        if start != -1:
            # Count braces to find matching close
            count = 0
            for i, char in enumerate(text[start:]):
                if char == '{':
                    count += 1
                elif char == '}':
                    count -= 1
                    if count == 0:
                        return text[start:start+i+1]
        
        # Try to find JSON array
        start = text.find('[')
        if start != -1:
            count = 0
            for i, char in enumerate(text[start:]):
                if char == '[':
                    count += 1
                elif char == ']':
                    count -= 1
                    if count == 0:
                        return text[start:start+i+1]
    except Exception:
        pass
    
    return None


def parse_json_robustly(content: str, max_attempts: int = 5) -> Dict[str, Any]:
    """
    Parse JSON content with multiple fallback strategies.
    
    Args:
        content: Raw content that should contain JSON
        max_attempts: Maximum number of repair attempts
        
    Returns:
        Parsed JSON as dictionary
        
    Raises:
        JSONRepairError: If all parsing attempts fail
    """
    if not content or not isinstance(content, str):
        logger.warning("Empty or invalid content provided for JSON parsing")
        return {}
    
    original_content = content
    
    # Attempt 1: Direct parse after stripping markdown
    content = strip_markdown_code_blocks(original_content)
    try:
        result = json.loads(content)
        if isinstance(result, dict):
            return result
        elif isinstance(result, list):
            return {"data": result}
    except json.JSONDecodeError:
        pass
    
    # Attempt 2: Extract JSON from text
    extracted = extract_json_from_text(content)
    if extracted:
        try:
            result = json.loads(extracted)
            if isinstance(result, dict):
                return result
            elif isinstance(result, list):
                return {"data": result}
        except json.JSONDecodeError:
            pass
    
    # Attempt 3: Fix common JSON errors
    for attempt in range(max_attempts):
        try:
            fixed = fix_common_json_errors(extracted if extracted else content)
            result = json.loads(fixed)
            if isinstance(result, dict):
                logger.info(f"JSON repaired successfully on attempt {attempt + 1}")
                return result
            elif isinstance(result, list):
                return {"data": result}
        except json.JSONDecodeError:
            # Try progressively more aggressive fixes
            if attempt == 0:
                # Remove all newlines within strings (aggressive)
                content = re.sub(r'(?<=")([^"\n]*)(\n)([^"]*)(?=")', lambda m: m.group(1) + ' ' + m.group(3), content)
            elif attempt == 1:
                # Remove all control characters
                content = ''.join(c for c in content if ord(c) >= 32 or c in '\n\r\t')
            elif attempt == 2:
                # Try to find just the object structure
                match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content, re.DOTALL)
                if match:
                    content = match.group(0)
            continue
    
    # All attempts failed
    logger.error(f"Failed to parse JSON after {max_attempts} attempts. Original content: {original_content[:500]}...")
    raise JSONRepairError(f"Could not parse JSON after {max_attempts} attempts")


def validate_against_schema(data: Dict[str, Any], schema_model: type[BaseModel]) -> BaseModel:
    """
    Validate dictionary data against a Pydantic model.
    
    Args:
        data: Dictionary to validate
        schema_model: Pydantic model class to validate against
        
    Returns:
        Validated model instance
        
    Raises:
        JSONValidationError: If validation fails
    """
    try:
        return schema_model(**data)
    except Exception as e:
        logger.error(f"Schema validation failed: {e}")
        raise JSONValidationError(f"Data does not match expected schema: {e}")


def safe_json_dumps(obj: Any, default: Any = None) -> str:
    """
    Safely serialize object to JSON string with fallback.
    
    Args:
        obj: Object to serialize
        default: Default value to return if serialization fails
        
    Returns:
        JSON string or default value
    """
    try:
        return json.dumps(obj, ensure_ascii=False, default=str)
    except Exception as e:
        logger.error(f"JSON serialization failed: {e}")
        return default if default is not None else "{}"
