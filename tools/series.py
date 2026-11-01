"""tools/series.py — batch helper for the "Tớ là Phaolo" series (one long voiceover, many episodes).

  python tools/series.py split --xlsx X --words W --audio A --n 30      -> series/episodes.json + series/audio/Pxxx.wav
  python tools/series.py build --spec series/specs/P001.json             -> projects/P001-<slug>/ (config, words, shots.json)
"""
import argparse, difflib, json, os, re, subprocess, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SER = os.path.join(ROOT, "series")


def nw(s):
    s = unicodedata.normalize("NFC", s.lower())
    return re.sub(r"[^\w]", "", s)


def toks(text):
    return re.findall(r"\S+", text)


def split(a):
    import openpyxl
    wb = openpyxl.load_workbook(a.xlsx)
    ws = wb["SHORT_SCRIPTS"]
    hdr = [c.value for c in ws[1]]
    rows = [dict(zip(hdr, r)) for r in ws.iter_rows(min_row=2, values_only=True) if r[0]][: a.n]
    W = json.load(open(a.words, encoding="utf-8"))
    allt, owner = [], []
    for i, r in enumerate(rows):
        tt = toks(r["TTS_Full_Script"])
        allt += tt
        owner += [i] * len(tt)
    A = [nw(t) for t in allt]
    B = [nw(w["word"]) for w in W]
    sm = difflib.SequenceMatcher(a=A, b=B, autojunk=False)
    times = [None] * len(allt)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            w = W[blk.b + k]
            times[blk.a + k] = (w["start"], w["end"])
    matched = sum(1 for x in times if x)
    print(f"global alignment: {matched}/{len(allt)} ({100*matched/len(allt):.1f}%)")
    # interpolate gaps
    n = len(times); i = 0
    while i < n:
        if times[i]:
            i += 1; continue
        j = i
        while j < n and not times[j]:
            j += 1
        t0 = times[i - 1][1] if i else 0.0
        t1 = times[j][0] if j < n else W[-1]["end"]
        sp = max(0.05, t1 - t0) / (j - i)
        for k in range(i, j):
            times[k] = (t0 + sp * (k - i), t0 + sp * (k - i + 1))
        i = j
    total = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.audio]).decode())
    os.makedirs(os.path.join(SER, "audio"), exist_ok=True)
    matchedA = {}
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            matchedA[blk.a + k] = blk.b + k
    idx = [[k for k in range(n) if owner[k] == e] for e in range(len(rows))]
    # boundary between ep e and e+1: largest silence gap in whisper words between the last matched word of e and first matched word of e+1
    cuts = [0.0]
    for e in range(len(rows) - 1):
        lastb = max(matchedA[k] for k in idx[e][-25:] if k in matchedA)
        firstb = min(matchedA[k] for k in idx[e + 1][:25] if k in matchedA)
        best = None
        for j in range(lastb, max(lastb + 1, firstb)):
            gap = W[j + 1]["start"] - W[j]["end"]
            if best is None or gap > best[0]:
                best = (gap, j)
        j = best[1]
        cuts.append((W[j]["end"] + W[j + 1]["start"]) / 2)
    cuts.append(total)
    eps = []
    for e, r in enumerate(rows):
        seg = [w for w in W if w["start"] >= cuts[e] - 0.05 and w["end"] <= cuts[e + 1] + 0.05]
        tt = [allt[k] for k in idx[e]]
        sm2 = difflib.SequenceMatcher(a=[nw(x) for x in tt], b=[nw(w["word"]) for w in seg], autojunk=False)
        tm = [None] * len(tt)
        for blk in sm2.get_matching_blocks():
            for k in range(blk.size):
                tm[blk.a + k] = (seg[blk.b + k]["start"], seg[blk.b + k]["end"])
        m = sum(1 for x in tm if x)
        i = 0
        while i < len(tt):
            if tm[i]:
                i += 1; continue
            j = i
            while j < len(tt) and not tm[j]:
                j += 1
            t0 = tm[i - 1][1] if i else seg[0]["start"]
            t1 = tm[j][0] if j < len(tt) else seg[-1]["end"]
            sp = max(0.05, t1 - t0) / (j - i)
            for k in range(i, j):
                tm[k] = (t0 + sp * (k - i), t0 + sp * (k - i + 1))
            i = j
        c0 = max(cuts[e], seg[0]["start"] - 0.35)
        c1 = min(cuts[e + 1], seg[-1]["end"] + 0.9)
        words = [{"word": tt[k], "start": round(tm[k][0] - c0, 3), "end": round(tm[k][1] - c0, 3)} for k in range(len(tt))]
        out = os.path.join(SER, "audio", f"{r['Video_ID']}.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{c0:.3f}", "-to", f"{c1:.3f}", "-i", a.audio, "-ac", "1", "-ar", "44100", out], check=True)
        eps.append({"id": r["Video_ID"], "row": {k: r[k] for k in hdr if k}, "start": round(c0, 3), "end": round(c1, 3), "dur": round(c1 - c0, 3), "words": words, "match": round(m / len(tt), 3)})
        print(f"{r['Video_ID']}  {c0:8.2f} -> {c1:8.2f}  ({c1-c0:6.1f}s)  match {100*m/len(tt):.0f}%  first {seg[0]['word']!r} last {seg[-1]['word']!r}")
    json.dump(eps, open(os.path.join(SER, "episodes.json"), "w"), ensure_ascii=False, indent=1)


def slugify(s):
    s = unicodedata.normalize("NFD", s.replace("đ", "d").replace("Đ", "D"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()[:48]


DEF_SFX = {"fact": [{"at": 0.25, "name": "shimmer", "gain": -12}], "insert": [{"at": 0.15, "name": "pop", "gain": -14}],
           "lesson": [{"at": 0.2, "name": "shimmer", "gain": -12}], "end": [{"at": 0.2, "name": "ding", "gain": -12}],
           "text": [{"at": 0.1, "name": "blip", "gain": -12}], "steps": [{"at": 0.2, "name": "blip", "gain": -14}]}


def post_info(P, ep, spec):
    r = ep["row"]; q = r["Chu_de"]; title = r["Tieu_de_YouTube"]; last = " ".join(w["word"] for w in ep["words"])
    endq = spec["beats"][-1].get("question", "")
    tags = r.get("Hashtags") or ""
    m, s_ = divmod(int(round(ep["dur"])), 60)
    txt = f"""=== VIDEO {spec['id']} ({m}:{s_:02d}) ===
Chủ đề: {q}

=== TIÊU ĐỀ (chọn 1) ===
1. {title}
2. {q}
3. {title} | Tớ là Phaolo

=== YOUTUBE SHORTS ===
Tiêu đề: {title} #Shorts
Mô tả:
{r.get('Mo_ta_YouTube','')}

{endq}

Nguồn: {short_src(r.get('Nguon_tham_khao',''))}
{dd(tags, '#CongGiao #GiaoLyCongGiao #Shorts')}
Tags: {r.get('YouTube_Tags','')}

=== TIKTOK ===
Caption: {title} 👉 {endq}
{dd(tags, '#conggiao #catholic #giaoly #fyp')}

=== FACEBOOK REELS ===
Caption: {r.get('Mo_ta_YouTube','')}
{endq}
Nguồn: {short_src(r.get('Nguon_tham_khao',''))}
{dd(tags, '#CongGiao')}

=== BÌNH LUẬN GHIM ===
{r.get('Binh_luan_ghim','')}

=== NGUỒN ĐẦY ĐỦ ===
{r.get('Nguon_tham_khao','')}

=== LƯU Ý KIỂM CHỨNG (nội bộ, không đăng) ===
{r.get('Luu_y_kiem_chung','')}
"""
    open(os.path.join(P, "out", "thong_tin_dang_bai.txt"), "w", encoding="utf-8").write(txt)


def dd(a, b):
    out = []
    for t in (a + " " + b).split():
        if t.lower() not in [x.lower() for x in out]: out.append(t)
    return " ".join(out)


def short_src(s):
    parts = re.findall(r"(GLHTCG số [\d\-–, ]+\d|Giáo luật[^,;(]*|Bộ Giáo luật[^,;(]*|Quy chế Tổng quát[^,;(]*số \d+|[1-3]? ?[A-ZĐ][a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+ \d+,\s?\d+(?:-\d+)?)", s or "")
    seen = []
    for x in parts:
        x = x.strip()
        if x and x not in seen: seen.append(x)
    return "; ".join(seen[:5]) or (s or "")[:160]


def build(a):
    spec = json.load(open(a.spec, encoding="utf-8"))
    eps = {e["id"]: e for e in json.load(open(os.path.join(SER, "episodes.json"), encoding="utf-8"))}
    ep = eps[spec["id"]]
    words = ep["words"]
    N = [nw(w["word"]) for w in words]
    dur = ep["dur"]
    slug = f"{spec['id']}-{slugify(ep['row']['Tieu_de_YouTube'])}"
    P = os.path.join(ROOT, "projects", slug)
    for d in ["input", "timeline", "story", "scenes/shots", "build", "out"]:
        os.makedirs(os.path.join(P, d), exist_ok=True)
    import shutil
    vo = os.path.join(P, "input", "voiceover.mp3")
    if not os.path.exists(vo):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(SER, "audio", f"{spec['id']}.wav"), "-c:a", "libmp3lame", "-b:a", "256k", vo], check=True)
    for old in ("voiceover.wav",):
        if os.path.exists(os.path.join(P, "input", old)): os.remove(os.path.join(P, "input", old))
    post_info(P, ep, spec)
    json.dump({"source": "whisper:small+script", "words": words}, open(os.path.join(P, "timeline", "words.json"), "w"), ensure_ascii=False, indent=0)
    with open(os.path.join(P, "scenes", "shots", "auto.js"), "w") as f:
        f.write("import { autoRegister } from '/engine/director.js';\nautoRegister();\n")
    with open(os.path.join(P, "scenes", "shots", "99_cover.js"), "w") as f:
        f.write("// cover is registered by /engine/director.js from config.cover\n")

    def find(snippet, after):
        q = [nw(x) for x in toks(snippet)]
        q = [x for x in q if x]
        for i in range(after, len(N) - len(q) + 1):
            if N[i:i + len(q)] == q:
                return i
        raise SystemExit(f"[{spec['id']}] snippet not found after word {after}: {snippet!r}\n  context: {' '.join(w['word'] for w in words[after:after+30])}")

    beats = spec["beats"]
    starts, wi, pos = [], [], 0
    for k, b in enumerate(beats):
        if k == 0:
            starts.append(0.0); wi.append(0); continue
        i = find(b["at"], pos)
        pos = i + 1
        wi.append(i)
        prev_end = words[i - 1]["end"] if i else 0
        s = max(prev_end, words[i]["start"] - 0.12) if i else 0
        starts.append(round(min(words[i]["start"], (prev_end + words[i]["start"]) / 2 if words[i]["start"] - prev_end < 0.5 else words[i]["start"] - 0.15), 3))
    shots = []
    for k, b in enumerate(beats):
        st = starts[k]
        en = starts[k + 1] if k + 1 < len(beats) else round(dur, 3)
        if en - st < 0.8:
            print(f"  ! beat {k} very short ({en-st:.2f}s): {b.get('at')}")
        p = {kk: vv for kk, vv in b.items() if kk not in ("at", "in", "sfx", "amb", "captions", "scene")}
        p.setdefault("type", "scene")
        line_end = wi[k + 1] if k + 1 < len(beats) else len(words)
        typ = p["type"]
        inn = b.get("in") or ({"type": "flash", "dur": 0.3} if p.get("freeze") else {"type": "fade", "dur": 0.5} if typ in ("end", "lesson") else {"type": "cut", "dur": 0.3})
        sfx = b.get("sfx", DEF_SFX.get(typ, []) + ([{"at": 0.05, "name": "shimmer", "gain": -10}] if p.get("freeze") else []))
        cap = b.get("captions", not (typ in ("end",) or p.get("hook") or p.get("lesson") or typ == "lesson"))
        shots.append({"id": f"s{k+1:02d}", "start": round(st, 3), "end": round(en, 3), "line": " ".join(w["word"] for w in words[wi[k]:line_end]),
                      "scene": b.get("scene", typ), "set": p.get("set", ""), "in": inn, "sfx": sfx, "captions": cap, "params": p,
                      **({"amb": b["amb"]} if "amb" in b else {})})
    # music: [[snippet|0, mood, intensity], ...]
    music = []
    mpos = 0
    for k, m in enumerate(spec.get("music", [[0, "gentle", 0.6]])):
        st = 0.0 if m[0] == 0 else words[find(m[0], mpos)]["start"]
        if m[0] != 0:
            mpos = find(m[0], mpos)
        music.append({"start": round(st, 2), "mood": m[1], "intensity": m[2]})
    for k in range(len(music)):
        music[k]["end"] = music[k + 1]["start"] if k + 1 < len(music) else round(dur, 2)
    title = ep["row"]["Tieu_de_YouTube"]
    story = {"title": title, "duration": round(dur, 3), "shots": shots, "music": music, "sfx": []}
    json.dump(story, open(os.path.join(P, "story", "shots.json"), "w"), ensure_ascii=False, indent=1)
    cfg = {"title": title, "lang": "vi", "aspect": "9:16", "resolution": "1080p", "fps": 24, "style": "pastel", "voiceover": "input/voiceover.mp3", "script": None,
           "duration": round(dur, 3), "captions": True, "bars": "none", "fadeIn": 0.3, "fadeOut": 0.6, "music": {"enabled": True, "gainDb": -20}, "sfx": {"enabled": True, "gainDb": -6},
           "loudness": -14, "cover": spec.get("cover", {}), "episode": spec["id"]}
    json.dump(cfg, open(os.path.join(P, "config.json"), "w"), ensure_ascii=False, indent=1)
    lens = [s["end"] - s["start"] for s in shots]
    print(f"{slug}: {len(shots)} shots, {dur:.1f}s, shot len {min(lens):.1f}-{max(lens):.1f}s")
    print(os.path.relpath(P, ROOT))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd")
    s1 = sp.add_parser("split"); s1.add_argument("--xlsx"); s1.add_argument("--words"); s1.add_argument("--audio"); s1.add_argument("--n", type=int, default=30); s1.add_argument("--total-eps", type=int, default=30)
    s2 = sp.add_parser("build"); s2.add_argument("--spec")
    a = ap.parse_args()
    {"split": split, "build": build}[a.cmd](a)
