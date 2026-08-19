#!/usr/bin/env python3
# Transcribe con faster-whisper y saca los timestamps por palabra.
# Uso: python whisper_words.py audio.mp3 words.json
import sys, json
audio, out = sys.argv[1], sys.argv[2]
from faster_whisper import WhisperModel
model = WhisperModel("small", device="cpu", compute_type="int8")
segments, info = model.transcribe(audio, language="es", word_timestamps=True)
words = []
for seg in segments:
    for w in (seg.words or []):
        words.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
with open(out, "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False)
print(f"whisper: {len(words)} palabras")
