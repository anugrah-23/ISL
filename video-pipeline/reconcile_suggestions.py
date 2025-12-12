# reconcile_suggestions.py
"""
Combine apply_isl_grammar.py output (sentences_with_suggested_order.json) with required_words_mapping.csv
to produce the final sentences_isl_mapping.json used by builders.

Usage:
  python reconcile_suggestions.py --suggested video-pipeline/sentences_json/sentences_with_suggested_order.json --csv video-pipeline/required_words_mapping.csv --out video-pipeline/sentences_isl_mapping.json
"""
import json, csv, argparse, ast, os
from utils import normalize_token

def load_csv_token_map(csv_path):
    token_map = {}
    if not os.path.exists(csv_path):
        return token_map
    with open(csv_path, "r", encoding="utf8") as f:
        rdr = csv.DictReader(f)
        for r in rdr:
            token = r.get("token")
            fn_field = r.get("filenames","")
            files = []
            try:
                files = ast.literal_eval(fn_field) if fn_field else []
            except Exception:
                # fallback split
                files = [x for x in fn_field.split(";") if x]
            # normalize tokens keys
            if token:
                token_map[normalize_token(token)] = files
    return token_map

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--suggested", default="video-pipeline/sentences_json/sentences_with_suggested_order.json")
    p.add_argument("--csv", default="video-pipeline/required_words_mapping.csv")
    p.add_argument("--out", default="video-pipeline/sentences_isl_mapping.json")
    args = p.parse_args()

    suggested = []
    if os.path.exists(args.suggested):
        with open(args.suggested, "r", encoding="utf8") as f:
            suggested = json.load(f)
    else:
        raise SystemExit("Missing suggested file: " + args.suggested)

    token_map = load_csv_token_map(args.csv)

    final = []
    for s in suggested:
        toks = s.get("suggested_tokens") or s.get("normalized_tokens") or []
        normalized = [normalize_token(t) for t in toks]
        token_entries = []
        found = []
        missing = []
        for t in normalized:
            files = token_map.get(t, [])
            available = len(files) > 0
            if available:
                found.append(t)
            else:
                missing.append(t)
            token_entries.append({"token": t, "available": available, "filenames": files})
        final.append({
            "id": s["id"],
            "text": s.get("text",""),
            "isl_tokens": normalized,
            "tokens": token_entries,
            "found_tokens": found,
            "missing_tokens": missing
        })

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf8") as f:
        json.dump(final, f, indent=2, ensure_ascii=False)
    print("Wrote", args.out)

if __name__ == "__main__":
    main()
