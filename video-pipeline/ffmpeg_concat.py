# ffmpeg_concat.py
# helper CLI to concat tokens by using words/ token files
import os, sys, subprocess
from utils import normalize_token

BASE_DIR = os.path.dirname(__file__)
WORDS_DIR = os.path.join(BASE_DIR, 'words')

def ensure_file(token: str):
    expected = os.path.join(WORDS_DIR, normalize_token(token) + '.mp4')
    if os.path.exists(expected):
        return expected
    return None

def concat_with_ffmpeg(tokens, output_path):
    parts = []
    for t in tokens:
        p = ensure_file(t)
        if not p:
            raise FileNotFoundError(f"Missing clip for token '{t}' (expected {normalize_token(t)}.mp4 in {WORDS_DIR})")
        parts.append(p)

    listfile = os.path.join(BASE_DIR, 'tmp_list.txt')
    with open(listfile, 'w', encoding='utf8') as f:
        for p in parts:
            f.write(f"file '{os.path.abspath(p)}'\n")

    cmd = ['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', listfile, '-c', 'copy', output_path]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print('[INFO] fast concat failed; re-encoding to normalize formats')
        cmd = ['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', listfile,
               '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease',
               '-c:v', 'libx264', '-crf', '20', '-preset', 'fast', '-c:a', 'aac', output_path]
        subprocess.run(cmd, check=True)
    try:
        os.remove(listfile)
    except:
        pass

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python ffmpeg_concat.py out.mp4 token1 token2 ...')
        sys.exit(1)
    out = sys.argv[1]
    toks = sys.argv[2:]
    concat_with_ffmpeg(toks, out)
    print('Wrote', out)
