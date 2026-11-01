"""tools/tts_series.py — Vietnamese TTS (edge-tts) with word timings for episodes without a voiceover.
  python tools/tts_series.py --rows series/rows_31_60.json --out series/tts --voice vi-VN-NamMinhNeural
Writes series/tts/<ID>.mp3 and <ID>.words.json ([{word,start,end}], seconds; edge-tts WordBoundary)."""
import argparse, asyncio, json, os
import edge_tts

async def one(text, voice, rate, mp3, wj):
    c = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words = []
    with open(mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7; d = ch["duration"] / 1e7
                words.append({"word": ch["text"], "start": round(s, 3), "end": round(s + d, 3)})
    json.dump(words, open(wj, "w"), ensure_ascii=False)
    return len(words)

async def main(a):
    rows = json.load(open(a.rows, encoding="utf-8"))
    os.makedirs(a.out, exist_ok=True)
    for r in rows:
        i = r["Video_ID"]; mp3 = os.path.join(a.out, f"{i}.mp3"); wj = os.path.join(a.out, f"{i}.words.json")
        if os.path.exists(mp3) and os.path.exists(wj): continue
        for k in range(4):
            try:
                n = await one(r["TTS_Full_Script"], a.voice, a.rate, mp3, wj); print(i, n, "words"); break
            except Exception as e:
                print(i, "retry", k, e); await asyncio.sleep(5)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--rows"); ap.add_argument("--out"); ap.add_argument("--voice", default="vi-VN-NamMinhNeural"); ap.add_argument("--rate", default="+0%")
    asyncio.run(main(ap.parse_args()))
