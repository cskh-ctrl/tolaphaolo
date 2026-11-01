"""tools/package_batches.py
  one     --project projects/P001-x --dest dist   -> dist/P001.zip  (folder 'NN_P001_slug/' with mp4, anh_bia.png, thong_tin_dang_bai.txt)
  batches --src eps --dest dist --per 10         -> dist/Dot_01_Video_01-10.zip ...
"""
import argparse, json, os, shutil, sys, zipfile, glob, re

def one(a):
    P = a.project.rstrip("/"); slug = os.path.basename(P); pid = slug.split("-")[0]; n = int(pid[1:])
    folder = f"{n:02d}_{slug}"[:70]
    os.makedirs(a.dest, exist_ok=True)
    z = os.path.join(a.dest, f"{pid}.zip")
    with zipfile.ZipFile(z, "w", zipfile.ZIP_STORED) as zf:
        zf.write(os.path.join(P, "out", "video.mp4"), f"{folder}/{folder}.mp4")
        zf.write(os.path.join(P, "out", "anh_bia.png"), f"{folder}/anh_bia.png")
        zf.write(os.path.join(P, "out", "thong_tin_dang_bai.txt"), f"{folder}/thong_tin_dang_bai.txt")
    print("wrote", z)

def batches(a):
    os.makedirs(a.dest, exist_ok=True)
    zs = sorted(glob.glob(os.path.join(a.src, "P0*.zip")))
    groups = {}
    for z in zs:
        n = int(re.search(r"P(\d+)", os.path.basename(z)).group(1)); b = (n - 1) // a.per
        groups.setdefault(b, []).append(z)
    for b, items in sorted(groups.items()):
        lo, hi = b * a.per + 1, (b + 1) * a.per
        top = f"Dot_{b+1:02d}_Video_{lo:02d}-{hi:02d}"
        out = os.path.join(a.dest, top + ".zip")
        with zipfile.ZipFile(out, "w", zipfile.ZIP_STORED) as zo:
            for z in items:
                with zipfile.ZipFile(z) as zi:
                    for info in zi.infolist():
                        zo.writestr(f"{top}/{info.filename}", zi.read(info.filename))
        print("wrote", out, len(items), "videos")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest="cmd")
    s1 = sp.add_parser("one"); s1.add_argument("--project"); s1.add_argument("--dest")
    s2 = sp.add_parser("batches"); s2.add_argument("--src"); s2.add_argument("--dest"); s2.add_argument("--per", type=int, default=10)
    a = ap.parse_args(); {"one": one, "batches": batches}[a.cmd](a)
