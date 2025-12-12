# build_available_sentences.py (patched MoviePy import)
"""
Batch build sentences that have all tokens available.

Usage:
    python build_available_sentences.py --sentmap sentences_isl_mapping.json --words-root /path/to/words --out-dir output/sentences

This script:
 - Reads sentences_isl_mapping.json
 - Resolves filenames for each token
 - Uses ffmpeg concat to merge word videos into full sentence videos
 - Builds only sentences where ALL tokens are available
"""
import os, json, argparse, subprocess, shlex
from pathlib import Path

USE_MOVIEPY = False  # Set True to use MoviePy instead of ffmpeg


def safe_choose_filename(entry, words_root):
    """Resolve filename from CSV-provided list, try absolute, then relative matches."""
    for fn in entry.get("filenames", []):
        if not fn:
            continue
        p = Path(fn)
        if p.is_absolute() and p.exists():
            return str(p)
        p2 = Path(words_root) / fn
        if p2.exists():
            return str(p2)
        p3 = Path(words_root) / Path(fn).name
        if p3.exists():
            return str(p3)
    return None


def build_with_ffmpeg(file_list, out_path):
    listfile = out_path + ".txt"
    with open(listfile, "w", encoding="utf8") as f:
        for p in file_list:
            f.write(f"file '{p}'\n")

    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listfile, "-c", "copy", out_path]
    print("Running:", " ".join(shlex.quote(x) for x in cmd))
    subprocess.run(cmd, check=True)
    os.remove(listfile)


def build_with_moviepy(file_list, out_path):
    # Robust import: try moviepy.editor first, fall back to package-level exports
    try:
        from moviepy.editor import VideoFileClip, concatenate_videoclips
    except Exception:
        from moviepy import VideoFileClip, concatenate_videoclips

    clips = [VideoFileClip(p) for p in file_list]
    final = concatenate_videoclips(clips, method="compose")
    final.write_videofile(out_path, codec="libx264", audio_codec="aac")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--sentmap", default="sentences_isl_mapping.json")
    p.add_argument("--words-root", default=".")
    p.add_argument("--out-dir", default="output/sentences")
    p.add_argument("--use-moviepy", action="store_true")
    args = p.parse_args()

    global USE_MOVIEPY
    if args.use_moviepy:
        USE_MOVIEPY = True

    with open(args.sentmap, "r", encoding="utf8") as f:
        sentences = json.load(f)

    os.makedirs(args.out_dir, exist_ok=True)

    built = []
    skipped = []

    for s in sentences:
        sid = s["id"]
        isl_tokens = s["isl_tokens"]
        token_entries = s["tokens"]

        file_list = []
        missing = []

        for te in token_entries:
            if te["available"]:
                resolved = safe_choose_filename(te, args.words_root)
                if not resolved:
                    alt = os.path.join(args.words_root, te["token"] + ".mp4")
                    if os.path.exists(alt):
                        resolved = alt
                if not resolved:
                    missing.append(te["token"])
                else:
                    file_list.append(resolved)
            else:
                missing.append(te["token"])

        if missing:
            skipped.append({"id": sid, "missing": missing})
            continue

        outname = f"{sid:03d}_" + "_".join(isl_tokens) + ".mp4"
        outpath = os.path.join(args.out_dir, outname)

        try:
            if USE_MOVIEPY:
                build_with_moviepy(file_list, outpath)
            else:
                build_with_ffmpeg(file_list, outpath)
            built.append(outpath)
        except Exception as e:
            skipped.append({"id": sid, "error": str(e)})

    print("Built:", len(built))
    print("Skipped:", len(skipped))

    with open(os.path.join(args.out_dir, "build_report.json"), "w", encoding="utf8") as f:
        json.dump({"built": built, "skipped": skipped}, f, indent=2)


if __name__ == "__main__":
    main()
