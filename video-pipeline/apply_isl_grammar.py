# apply_isl_grammar.py
import os, json, re
from typing import List

BASE = os.path.dirname(__file__) or "."
SENT_IN = os.path.join(BASE, "sentences_json", "sentences.json")
SENT_OUT = os.path.join(BASE, "sentences_json", "sentences_with_suggested_order.json")
RULES_PATH = os.path.join(BASE, "grammar_rules.json")
BUILD_SH = os.path.join(BASE, "build_suggested.sh")

def normalize_token(token: str) -> str:
    token = token.strip()
    token = token.replace('_____', 'name')
    token = token.lower()
    token = re.sub(r"[’'`\"]", "", token)
    token = re.sub(r"[\s/]+", "_", token)
    token = re.sub(r"[^a-z0-9_]+", "", token)
    return token

def load_rules():
    if not os.path.exists(RULES_PATH):
        raise FileNotFoundError("grammar_rules.json not found at " + RULES_PATH)
    with open(RULES_PATH, "r", encoding="utf8") as f:
        return json.load(f)

def move_any_to_end(tokens: List[str], match_any: List[str]):
    match_set = set(match_any)
    result = [t for t in tokens if t not in match_set]
    moved = [t for t in tokens if t in match_set]
    return result + moved

def move_any_to_start(tokens: List[str], match_any: List[str]):
    match_set = set(match_any)
    starts = [t for t in tokens if t in match_set]
    rest = [t for t in tokens if t not in match_set]
    return starts + rest

def append_marker_for_question(tokens: List[str], match_any: List[str]):
    match_set = set(match_any)
    has = any(t in match_set for t in tokens)
    if has and "question" not in tokens:
        return tokens + ["question"]
    return tokens

def move_neg_before_verb(tokens: List[str], negatives: List[str], aux_verbs: List[str]):
    negs = set(negatives)
    aux = set(aux_verbs)
    tokens = list(tokens)
    i = 0
    while i < len(tokens):
        t = tokens[i]
        if t in negs:
            tokens.pop(i)
            inserted = False
            for j in range(i, len(tokens)):
                if tokens[j] in aux:
                    tokens.insert(j, t)
                    inserted = True
                    break
            if not inserted:
                pronouns = {"i","you","he","she","we","they","it","my","your"}
                insert_pos = i
                for j in range(0, len(tokens)):
                    if tokens[j] not in pronouns:
                        insert_pos = j
                        break
                tokens.insert(insert_pos, t)
                i = insert_pos + 1
            else:
                i += 1
        else:
            i += 1
    return tokens

def apply_rules(tokens: List[str], rules_config):
    toks = list(tokens)
    for r in rules_config.get("rules", []):
        typ = r.get("type")
        if typ == "move_any_to_end" and "match_any" in r:
            toks = move_any_to_end(toks, [normalize_token(x) for x in r["match_any"]])
        elif typ == "move_any_to_start" and "match_any" in r:
            toks = move_any_to_start(toks, [normalize_token(x) for x in r["match_any"]])
        elif typ == "append_marker_for_question" and "match_any" in r:
            toks = append_marker_for_question(toks, [normalize_token(x) for x in r["match_any"]])
        elif typ == "move_neg_before_verb":
            negs = [normalize_token(x) for x in r.get("negatives", [])]
            aux = [normalize_token(x) for x in r.get("aux_verbs", [])]
            toks = move_neg_before_verb(toks, negs, aux)
    return toks

def main():
    if not os.path.exists(SENT_IN):
        raise FileNotFoundError("sentences.json not found at " + SENT_IN)
    with open(SENT_IN, "r", encoding="utf8") as f:
        sentences = json.load(f)
    rules = load_rules()

    out_sentences = []
    build_lines = ["#!/usr/bin/env bash", "set -e", "echo Building suggested sentence videos..."]
    for s in sentences:
        orig_toks = [normalize_token(t) for t in s.get("tokens", [])]
        suggested = apply_rules(orig_toks, rules)
        s2 = dict(s)
        s2["normalized_tokens"] = orig_toks
        s2["suggested_tokens"] = suggested
        s2["auto_changed"] = (suggested != orig_toks)
        out_sentences.append(s2)
        out_filename = f"{s['id']:03d}_" + "_".join(suggested) + ".mp4"
        out_path = os.path.join("output", "sentences", out_filename).replace("\\", "/")
        token_args = " ".join([f"'{t}'" for t in suggested])
        build_cmd = f"python build_sentence.py --tokens {token_args} --out {out_path}"
        build_lines.append(f"echo Building {out_path}")
        build_lines.append(build_cmd)

    with open(SENT_OUT, "w", encoding="utf8") as f:
        json.dump(out_sentences, f, indent=2, ensure_ascii=False)
    with open(BUILD_SH, "w", encoding="utf8") as f:
        f.write("\n".join(build_lines) + "\n")
    print("Wrote:", SENT_OUT)
    print("Wrote build script:", BUILD_SH)
    print("Review the suggested token orders in sentences_with_suggested_order.json, then run build_suggested.sh to render videos.")

if __name__ == '__main__':
    main()
