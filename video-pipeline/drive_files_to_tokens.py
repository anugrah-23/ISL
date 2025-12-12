# drive_files_to_tokens.py
import os, sys, json, argparse, re

def normalize_token(token: str) -> str:
    token = token.strip()
    token = token.replace('_____', 'name')
    token = token.lower()
    token = re.sub(r"[’'`\"]", "", token)
    token = re.sub(r"[\s/]+", "_", token)
    token = re.sub(r"[^a-z0-9_]+", "", token)
    token = re.sub(r"\.mp4$|\.mov$|\.avi$|\.mkv$", "", token)
    return token

def gather_filenames(drive_root):
    files = []
    for dirpath, _, filenames in os.walk(drive_root):
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, drive_root)
            files.append(rel.replace("\\", "/"))
    return sorted(files)

def extract_tokens_from_filenames(filenames):
    tokens = set()
    for rel in filenames:
        base = os.path.basename(rel)
        name, _ = os.path.splitext(base)
        name = re.sub(r"\s*\(.*?\)$", "", name)
        name = re.sub(r"[_\-]+sign.*$|[_\-]+v\d+$|[_\-]+\d+$", "", name, flags=re.I)
        norm = normalize_token(name)
        if norm:
            tokens.add(norm)
    return tokens

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--drive-dir", required=True)
    p.add_argument("--pipeline-dir", default=".")
    args = p.parse_args()
    drive_dir = os.path.abspath(args.drive_dir)
    pipeline_dir = os.path.abspath(args.pipeline_dir)
    sent_json_path = os.path.join(pipeline_dir, "sentences_json", "sentences.json")
    out_dir = pipeline_dir
    if not os.path.isdir(drive_dir):
        print("Drive dir not found:", drive_dir); sys.exit(1)
    if not os.path.exists(sent_json_path):
        print("sentences.json not found at:", sent_json_path); sys.exit(1)
    filenames = gather_filenames(drive_dir)
    with open(os.path.join(out_dir, "file_list.txt"), "w", encoding="utf8") as f:
        f.write("\n".join(filenames))
    found_tokens = extract_tokens_from_filenames(filenames)
    with open(os.path.join(out_dir, "words_found.txt"), "w", encoding="utf8") as f:
        for t in sorted(found_tokens):
            f.write(t + "\n")
    with open(sent_json_path, "r", encoding="utf8") as f:
        sentences = json.load(f)
    all_tokens_in_sentences = set()
    for s in sentences:
        toks = s.get("tokens", [])
        for t in toks:
            all_tokens_in_sentences.add(normalize_token(t))
    missing_global = sorted([t for t in all_tokens_in_sentences if t not in found_tokens])
    with open(os.path.join(out_dir, "missing_words_to_download.txt"), "w", encoding="utf8") as f:
        for t in missing_global:
            f.write(t + "\n")
    out_sentences = []
    for s in sentences:
        toks = [normalize_token(t) for t in s.get("tokens", [])]
        missing = [t for t in toks if t not in found_tokens]
        s2 = dict(s)
        s2["normalized_tokens"] = toks
        s2["missing_tokens"] = missing
        out_sentences.append(s2)
    out_path = os.path.join(pipeline_dir, "sentences_json", "sentences_with_missing.json")
    with open(out_path, "w", encoding="utf8") as f:
        json.dump(out_sentences, f, indent=2, ensure_ascii=False)
    print("Wrote", out_path)
    print("Wrote missing_words_to_download.txt and words_found.txt")
