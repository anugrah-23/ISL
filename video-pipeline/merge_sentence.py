#!/usr/bin/env python3
# merge_sentence.py (patched to import MoviePy robustly)
import os, sys, json, argparse, subprocess, shlex
from pathlib import Path

def choose_local_file(candidate_list, words_root):
    # try absolute path first, then try relative to words_root, then filename-only under words_root
    for fn in candidate_list:
        if not fn: continue
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

def write_ffmpeg_listfile(paths, listfile):
    with open(listfile, "w", encoding="utf8") as f:
        for p in paths:
            # ffmpeg concat requires exact path lines
            f.write("file '{}'\n".format(str(p).replace("'", "'\\''")))

def build_with_ffmpeg(paths, output_path, delete_listfile=True):
    listfile = output_path + ".list.txt"
    write_ffmpeg_listfile(paths, listfile)
    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listfile, "-c", "copy", output_path]
    print("Running:", " ".join(shlex.quote(c) for c in cmd))
    subprocess.run(cmd, check=True)
    if delete_listfile:
        try:
            os.remove(listfile)
        except:
            pass

def build_with_moviepy(paths, output_path):
    # Robust import: prefer moviepy.editor, fall back to top-level moviepy exports
    try:
        from moviepy.editor import VideoFileClip, concatenate_videoclips
    except Exception:
        from moviepy import VideoFileClip, concatenate_videoclips

    clips = [VideoFileClip(p) for p in paths]
    final = concatenate_videoclips(clips, method="compose")
    # Use libx264 + aac for wide compatibility
    final.write_videofile(output_path, codec="libx264", audio_codec="aac")

def merge_sentence_by_id(sentmap_path, sentence_id, words_root=".", out_dir="output/sentences", use_moviepy=False):
    with open(sentmap_path, "r", encoding="utf8") as f:
        sentences = json.load(f)
    entry = next((s for s in sentences if s.get("id")==sentence_id), None)
    if not entry:
        raise SystemExit("No sentence id {} in {}".format(sentence_id, sentmap_path))
    token_entries = entry.get("tokens", [])
    resolved_paths = []
    missing = []
    for te in token_entries:
        if te.get("available"):
            chosen = choose_local_file(te.get("filenames", []), words_root)
            if not chosen:
                # also try token name as filename
                alt = os.path.join(words_root, te['token'] + ".mp4")
                if os.path.exists(alt):
                    chosen = alt
        else:
            chosen = None
        if not chosen:
            missing.append(te['token'])
        else:
            resolved_paths.append(chosen)
    if missing:
        print("Cannot build sentence {} — missing tokens: {}".format(sentence_id, missing))
        return False
    os.makedirs(out_dir, exist_ok=True)
    outname = "{:03d}_".format(sentence_id) + "_".join(entry.get("isl_tokens", [])) + ".mp4"
    outpath = os.path.join(out_dir, outname)
    try:
        if use_moviepy:
            build_with_moviepy(resolved_paths, outpath)
        else:
            build_with_ffmpeg(resolved_paths, outpath)
        print("Wrote:", outpath)
        return True
    except Exception as e:
        print("Build failed:", e)
        return False

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--sentmap", default="sentences_isl_mapping.json", help="path to mapping file")
    p.add_argument("--id", type=int, help="sentence id to build (1..150)")
    p.add_argument("--words-root", default=".", help="folder where word files exist")
    p.add_argument("--out-dir", default="output/sentences", help="where to write sentence video")
    p.add_argument("--use-moviepy", action="store_true", help="use MoviePy instead of ffmpeg")
    args = p.parse_args()
    if not args.id:
        print("Specify --id N")
        sys.exit(1)
    ok = merge_sentence_by_id(args.sentmap, args.id, words_root=args.words_root, out_dir=args.out_dir, use_moviepy=args.use_moviepy)
    if not ok:
        sys.exit(2)

if __name__ == "__main__":
    main()
