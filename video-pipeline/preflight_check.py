# preflight_check.py
"""
Quick preflight check:
 - verifies sentences_isl_mapping.json exists
 - counts how many sentences are fully buildable
 - lists top missing tokens by usage count
"""
import json, collections, os
from utils import normalize_token

SENTMAP = "video-pipeline/sentences_isl_mapping.json"

if not os.path.exists(SENTMAP):
    print("Missing", SENTMAP)
    raise SystemExit(1)

with open(SENTMAP, "r", encoding="utf8") as f:
    sentences = json.load(f)

total = len(sentences)
buildable = 0
missing_counter = collections.Counter()
for s in sentences:
    missing = s.get("missing_tokens", [])
    if not missing:
        buildable += 1
    for m in missing:
        missing_counter[m] += 1

print(f"Total sentences: {total}")
print(f"Currently buildable (all tokens available): {buildable}")
print(f"Currently skipped (missing >=1 token): {total - buildable}")
print()
print("Top missing tokens (by how many sentences require them):")
for token, cnt in missing_counter.most_common(40):
    print(f"{token}: {cnt}")
