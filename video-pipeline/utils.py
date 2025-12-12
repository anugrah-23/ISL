# utils.py
# Shared utilities used by all pipeline scripts.

import re
import os
import json
from typing import List

def normalize_token(token: str) -> str:
    """
    Normalize token text into filesystem-friendly token id.
    - replaces placeholder '_____' with 'name'
    - lowercases, removes quotes, converts spaces/slashes to underscores
    - strips non-alphanumerics except underscore
    """
    if token is None:
        return ""
    token = str(token).strip()
    token = token.replace('_____', 'name')
    token = token.lower()
    token = re.sub(r"[’'`\"]", "", token)
    token = re.sub(r"[\s/]+", "_", token)
    token = re.sub(r"[^a-z0-9_]+", "", token)
    return token

def load_json(path):
    with open(path, "r", encoding="utf8") as f:
        return json.load(f)

def write_json(path, data):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
