# video-pipeline/check_moviepy_env.py
import sys, importlib, os, site, glob

print("Python exe:", sys.executable)
print("Python version:", sys.version.splitlines()[0])
try:
    ups = site.getusersitepackages()
except Exception as e:
    ups = f"ERROR: {e}"
print("User site-packages:", ups)
print("PYTHONNOUSERSITE env var:", os.environ.get('PYTHONNOUSERSITE'))
print("\nsys.path (first 20 entries):")
for p in sys.path[:20]:
    print(" ", p)

print("\nfind_spec(moviepy):", importlib.util.find_spec("moviepy"))
print("find_spec(moviepy.editor):", importlib.util.find_spec("moviepy.editor"))

print("\nFiles in current working dir that might shadow packages (moviepy* and *.py):")
for fn in glob.glob("moviepy*") + glob.glob("*.py"):
    print(" ", fn)
