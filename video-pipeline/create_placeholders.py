# create_placeholders.py (robust MoviePy import)
import os

try:
    # preferred explicit editor import
    from moviepy.editor import ColorClip
except Exception:
    # fallback to package-level export
    from moviepy import ColorClip

outdir = os.path.join("video-pipeline", "words")
os.makedirs(outdir, exist_ok=True)

words = ["hello", "how", "you"]  # add tokens you want placeholders for
for w in words:
    path = os.path.join(outdir, f"{w}.mp4")
    if not os.path.exists(path):
        clip = ColorClip((640,480), color=(0,0,0), duration=1)  # black 1s
        clip.write_videofile(path, fps=24, codec="libx264", audio=False)
        print("Wrote", path)
    else:
        print("Exists", path)
