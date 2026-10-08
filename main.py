#!/usr/bin/env python3
"""Sai Sandesh backend.

FastAPI service that serves pre-generated devotional JSON (written by the
content team / daily cron) plus full-text search over the bundled
sai_corpus.db (mirrors ~/workspace/sai-corpus/search.py logic).

Run: uvicorn main:app --host 0.0.0.0 --port $PORT
"""
import json
import os
import re
import sqlite3
from datetime import date

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, "data")
DB_PATH = os.path.join(BASE, "sai_corpus.db")

app = FastAPI(title="Sai Sandesh", version="0.1.0")

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9\-]*$")


def _load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_devotional(day: str) -> dict:
    if not DATE_RE.match(day):
        raise HTTPException(status_code=400, detail="invalid date, use YYYY-MM-DD")
    path = os.path.join(DATA_DIR, "devotionals", day + ".json")
    if not os.path.isfile(path):
        raise HTTPException(
            status_code=404,
            detail={"error": "devotional_not_found", "date": day},
        )
    return _load_json(path)


# ---------------------------------------------------------------- endpoints
# API versioning: every route is served under both /api/... (legacy) and
# /api/v1/... (stable contract for future clients, e.g. Expo React Native).
# JSON contracts are identical on both paths.

V1 = "/api/v1"


@app.get("/api/today")
@app.get(V1 + "/today")
def api_today():
    """Today's devotional (server-local date). 404 JSON if missing, never crash."""
    return _load_devotional(date.today().isoformat())


@app.get("/api/recent")
@app.get(V1 + "/recent")
def api_recent(limit: int = Query(default=7, ge=1, le=30)):
    """Most recent devotionals, newest first. Accumulates past days so the
    Thought for the Day feed keeps history instead of replacing it."""
    ddir = os.path.join(DATA_DIR, "devotionals")
    dates = []
    if os.path.isdir(ddir):
        for fn in os.listdir(ddir):
            if fn.endswith(".json") and DATE_RE.match(fn[:-5]):
                dates.append(fn[:-5])
    dates.sort(reverse=True)
    out = []
    for day in dates[:limit]:
        try:
            out.append(_load_devotional(day))
        except HTTPException:
            continue
    return out


@app.get("/api/day/{day}")
@app.get(V1 + "/day/{day}")
def api_day(day: str):
    """Devotional for an explicit date."""
    return _load_devotional(day)


@app.get("/api/topics")
@app.get(V1 + "/topics")
def api_topics():
    """[{"slug","title"}] scanned from data/topics/*.json, sorted by title."""
    out = []
    tdir = os.path.join(DATA_DIR, "topics")
    if os.path.isdir(tdir):
        for fn in sorted(os.listdir(tdir)):
            if not fn.endswith(".json"):
                continue
            try:
                doc = _load_json(os.path.join(tdir, fn))
                out.append({"slug": doc["slug"], "title": doc["title"]})
            except (OSError, json.JSONDecodeError, KeyError):
                continue
    out.sort(key=lambda x: x["title"])
    return out


@app.get("/api/topic/{slug}")
@app.get(V1 + "/topic/{slug}")
def api_topic(slug: str):
    """Full Q&A document for one topic."""
    if not SLUG_RE.match(slug):
        raise HTTPException(status_code=400, detail="invalid topic slug")
    path = os.path.join(DATA_DIR, "topics", slug + ".json")
    if not os.path.isfile(path):
        raise HTTPException(
            status_code=404, detail={"error": "topic_not_found", "slug": slug}
        )
    return _load_json(path)


@app.get("/api/archive")
@app.get(V1 + "/archive")
def api_archive():
    """Sorted list (newest first) of available devotional dates."""
    ddir = os.path.join(DATA_DIR, "devotionals")
    dates = []
    if os.path.isdir(ddir):
        for fn in os.listdir(ddir):
            if fn.endswith(".json") and DATE_RE.match(fn[:-5]):
                dates.append(fn[:-5])
    return sorted(dates, reverse=True)


# ------------------------------------------------------- corpus search
# Mirrors ~/workspace/sai-corpus/search.py (function search(query, topic=None, limit=10))
# tables: documents, chunks, chunk_topics, chunks_fts (FTS5, BM25 rank).

import difflib as _difflib

_VOCAB = []
_vp = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vocab.txt")
if os.path.isfile(_vp):
    with open(_vp, encoding="utf-8") as _f:
        _VOCAB = [l.strip() for l in _f if l.strip()]
_VOCAB_SET = set(_VOCAB)


def _suggest_query(q: str) -> str | None:
    """Typo-tolerant 'did you mean': correct each query word against the
    corpus vocabulary. Returns corrected query or None if nothing to fix."""
    words = re.findall(r"[A-Za-z']+", q)
    if not words:
        return None
    fixed, changed = [], False
    for w in words:
        lw = w.lower()
        if lw in _VOCAB_SET or len(lw) <= 3:
            fixed.append(w)
            continue
        m = _difflib.get_close_matches(lw, _VOCAB, n=1, cutoff=0.78)
        if m and m[0] != lw:
            fixed.append(m[0])
            changed = True
        else:
            fixed.append(w)
    if not changed:
        return None
    # rebuild preserving non-word chars from original
    out, wi = [], 0
    for tok in re.findall(r"[A-Za-z']+|[^A-Za-z']+", q):
        if re.fullmatch(r"[A-Za-z']+", tok):
            out.append(fixed[wi]); wi += 1
        else:
            out.append(tok)
    return "".join(out)

def _sanitize(q: str) -> str:
    q = q.strip()
    if not q:
        raise ValueError("empty query")
    return '"' + q.replace('"', '""') + '"'


def _cite(kind: str, title: str, volume: str, d: str) -> str:
    if kind == "discourse":
        vol = (volume or "").replace("Sri Sathya Sai Speaks, Vol ", "SSS Vol ")
        return f"{title} — {vol}" + (f", {d}" if d else "")
    return f"{title} (Vahini)"


def _excerpt(txt: str, query: str, width: int = 420) -> str:
    """Excerpt centered on the first query-term match, so the user sees why
    the chunk matched instead of an unrelated opening paragraph."""
    txt = re.sub(r"\s+", " ", txt).strip()
    terms = [t.lower() for t in re.findall(r"[A-Za-z']+", query) if len(t) > 2]
    low = txt.lower()
    pos = -1
    for t in terms:
        i = low.find(t)
        if i != -1 and (pos == -1 or i < pos):
            pos = i
    start = max(0, pos - 140) if pos != -1 else 0
    end = min(len(txt), start + width)
    s = txt[start:end]
    if start > 0:
        sp = s.find(" ")
        s = ("…" + s[sp + 1 :]) if sp != -1 else ("…" + s)
    if end < len(txt):
        s = s.rsplit(" ", 1)[0] + "…"
    return s


@app.get("/api/search")
@app.get(V1 + "/search")
def api_search(
    q: str = Query(default="", min_length=1, max_length=200),
    topic: str | None = Query(default=None),
    limit: int = Query(default=10, ge=1, le=50),
):
    """Full-text search over the corpus DB. Returns [{"title","volume","date",
    "citation","excerpt"}] with real citations."""
    q = q.strip()
    if not q:
        raise HTTPException(status_code=400, detail="q must not be empty")
    if not os.path.isfile(DB_PATH):
        raise HTTPException(status_code=503, detail="corpus database not available")

    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    c = con.cursor()
    try:
        topic_id = None
        if topic:
            if not SLUG_RE.match(topic):
                raise ValueError("invalid topic slug")
            row = c.execute("SELECT id FROM topics WHERE slug=?", (topic,)).fetchone()
            if not row:
                raise ValueError(f"unknown topic slug: {topic}")
            topic_id = row["id"]

        match = _sanitize(q)
        if topic_id is not None:
            sql = """SELECT c.text, c.gist, d.id AS doc_id, d.kind, d.title, d.volume, d.discourse_date
                     FROM chunks_fts
                     JOIN chunks c ON c.id = chunks_fts.rowid
                     JOIN documents d ON d.id = c.doc_id
                     JOIN chunk_topics ct ON ct.chunk_id = c.id
                     WHERE chunks_fts MATCH ? AND ct.topic_id = ?
                     ORDER BY bm25(chunks_fts) LIMIT ?"""
            rows = c.execute(sql, (match, topic_id, limit)).fetchall()
        else:
            sql = """SELECT c.text, c.gist, d.id AS doc_id, d.kind, d.title, d.volume, d.discourse_date
                     FROM chunks_fts
                     JOIN chunks c ON c.id = chunks_fts.rowid
                     JOIN documents d ON d.id = c.doc_id
                     WHERE chunks_fts MATCH ?
                     ORDER BY bm25(chunks_fts) LIMIT ?"""
            rows = c.execute(sql, (match, limit)).fetchall()

        out = []
        for r in rows:
            txt = _excerpt(r["text"], q)
            out.append(
                {
                    "doc_id": r["doc_id"],
                    "gist": r["gist"],
                    "title": r["title"],
                    "volume": r["volume"],
                    "date": r["discourse_date"],
                    "citation": _cite(r["kind"], r["title"], r["volume"], r["discourse_date"]),
                    "excerpt": txt,
                }
            )
        did_you_mean = None
        if not out:
            fixed = _suggest_query(q)
            if fixed and fixed.lower() != q.lower():
                try:
                    rows2 = c.execute(sql, (_sanitize(fixed), *((topic_id,) if topic_id is not None else ()), limit)).fetchall()
                except sqlite3.OperationalError:
                    rows2 = []
                if rows2:
                    did_you_mean = fixed
                    for r in rows2:
                        txt = _excerpt(r["text"], fixed)
                        out.append(
                            {
                                "doc_id": r["doc_id"],
                                "gist": r["gist"],
                                "title": r["title"],
                                "volume": r["volume"],
                                "date": r["discourse_date"],
                                "citation": _cite(r["kind"], r["title"], r["volume"], r["discourse_date"]),
                                "excerpt": txt,
                            }
                        )
        return {"results": out, "did_you_mean": did_you_mean}
    except sqlite3.OperationalError as e:
        raise HTTPException(status_code=400, detail=f"bad query: {e}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        con.close()


@app.get("/api/discourse/{doc_id}")
@app.get(V1 + "/discourse/{doc_id}")
def api_discourse(doc_id: int):
    """Full text of one discourse/Vahini, reassembled from chunks in order."""
    if not os.path.isfile(DB_PATH):
        raise HTTPException(status_code=503, detail="corpus database not available")
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    c = con.cursor()
    try:
        doc = c.execute(
            "SELECT id, kind, title, volume, discourse_date, word_count FROM documents WHERE id=?",
            (doc_id,),
        ).fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="discourse not found")
        chunks = c.execute(
            "SELECT text FROM chunks WHERE doc_id=? ORDER BY seq", (doc_id,)
        ).fetchall()
        text = "\n\n".join(re.sub(r"\s+", " ", ch["text"]).strip() for ch in chunks)
        return {
            "doc_id": doc["id"],
            "kind": doc["kind"],
            "title": doc["title"],
            "volume": doc["volume"],
            "date": doc["discourse_date"],
            "citation": _cite(doc["kind"], doc["title"], doc["volume"], doc["discourse_date"]),
            "word_count": doc["word_count"],
            "text": text,
        }
    finally:
        con.close()


# ----------------------------------------------------------------- static

app.mount("/cards", StaticFiles(directory=os.path.join(BASE, "static", "cards")), name="cards")
app.mount("/static", StaticFiles(directory=os.path.join(BASE, "static")), name="static")


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(os.path.join(BASE, "static", "index.html"))


@app.get("/sw.js", include_in_schema=False)
def service_worker():
    # Served from root scope (not /static/) so the SW can control the whole app.
    return FileResponse(
        os.path.join(BASE, "static", "sw.js"),
        media_type="application/javascript",
        headers={"Cache-Control": "no-cache"},
    )
