/* Sai Sandesh frontend — plain JS, no build step. */
"use strict";

const $ = (sel, el) => (el || document).querySelector(sel);

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(iso) {
  // iso: YYYY-MM-DD -> e.g. "Sunday, 4 October 2026"
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function youtubeEmbedUrl(url) {
  // Convert YouTube watch/shorts URLs to embed URLs; return null otherwise.
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? "https://www.youtube.com/embed/" + m[1] : null;
}

/* ---------------- devotional rendering ---------------- */

function renderDevotional(dev, container) {
  const parts = [];
  if (dev.fallback) {
    parts.push('<div class="fallback-note">This Sandesh was shared earlier and is offered again today, as a fresh message is not yet ready.</div>');
  }
  parts.push('<div class="card">');
  parts.push('<p class="greeting">' + esc(dev.greeting || "Sai Ram.") + "</p>");
  parts.push('<p class="citation">' + esc(fmtDate(dev.date)) + "</p>");

  const d = dev.discourse || {};
  parts.push('<div class="section-label">🕉️ Swami Speaks</div>');
  if (d.title) parts.push("<h2 style='margin:0 0 4px'>" + esc(d.title) + "</h2>");
  if (d.excerpt) parts.push('<p class="discourse-excerpt">' + esc(d.excerpt) + "</p>");
  if (d.theme) parts.push('<p class="theme">Theme: ' + esc(d.theme) + "</p>");
  const citeBits = [d.title, d.volume, d.date, d.occasion].filter(Boolean).map(esc);
  if (citeBits.length) parts.push('<p class="citation">' + citeBits.join(" · ") + "</p>");
  parts.push("</div>");

  if (dev.reflection) {
    parts.push('<div class="card"><div class="section-label">🪞 Reflection</div>' +
      '<p class="reflection">' + esc(dev.reflection) + "</p></div>");
  }

  if (dev.video && dev.video.url) {
    const embed = youtubeEmbedUrl(dev.video.url);
    let html = '<div class="card"><div class="section-label">🎬 Watch</div>';
    if (dev.video.title) html += "<h3 style='margin:0 0 8px'>" + esc(dev.video.title) + "</h3>";
    if (embed) {
      html += '<div class="video-embed"><iframe src="' + embed + '" title="' + esc(dev.video.title || "Video") +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
    }
    html += '<div class="btn-row"><a class="btn btn-indigo" href="' + esc(dev.video.url) +
      '" target="_blank" rel="noopener">▶ Watch on YouTube</a></div></div>';
    parts.push(html);
  }

  if (dev.bhajan && dev.bhajan.title) {
    let html = '<div class="card"><div class="section-label">🎵 Bhajan</div>' +
      "<h3 style='margin:0 0 8px'>" + esc(dev.bhajan.title) + "</h3>";
    const bEmbed = dev.bhajan.url ? youtubeEmbedUrl(dev.bhajan.url) : null;
    if (bEmbed) {
      html += '<div class="video-embed"><iframe src="' + bEmbed + '" title="' + esc(dev.bhajan.title) +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
    }
    if (dev.bhajan.url) {
      html += '<div class="btn-row"><a class="btn btn-outline" href="' + esc(dev.bhajan.url) +
        '" target="_blank" rel="noopener">🎧 Listen</a></div>';
    }
    parts.push(html + "</div>");
  }

  if (dev.seva_nudge) {
    parts.push('<div class="card seva"><div class="section-label">🙏 Seva Nudge</div>' +
      '<p style="margin:0">' + esc(dev.seva_nudge) + "</p></div>");
  }

  if (dev.share_card) {
    const id = "sharecard-" + Math.random().toString(36).slice(2);
    parts.push('<div class="card"><div class="section-label">💌 Share</div>' +
      '<img id="' + id + '" class="share-card-img" src="' + esc(dev.share_card) +
      '" alt="Sai Sandesh share card for ' + esc(fmtDate(dev.date)) + '" loading="lazy" ' +
      'onerror="this.closest(\'.card\').querySelector(\'.btn-row\').classList.add(\'hidden\');this.remove();" />' +
      '<div class="btn-row">' +
      '<button class="btn btn-primary" data-share="' + id + '" data-date="' + esc(dev.date) + '">📤 Share</button>' +
      '<button class="btn btn-outline" data-download="' + id + '" data-date="' + esc(dev.date) + '">⬇ Download</button>' +
      "</div></div>");
  }

  container.innerHTML = parts.join("");
  container.querySelectorAll("[data-share]").forEach((b) =>
    b.addEventListener("click", () => shareCard(b)));
  container.querySelectorAll("[data-download]").forEach((b) =>
    b.addEventListener("click", () => downloadCard(b)));
}

async function loadToday() {
  const el = $("#today-content");
  try {
    const r = await fetch("/api/recent?limit=7");
    if (!r.ok) throw new Error("not ready");
    const days = await r.json();
    if (!days.length) throw new Error("empty");
    el.innerHTML = "";
    days.forEach((dev, i) => {
      const wrap = document.createElement("div");
      wrap.className = "devotional-day" + (i > 0 ? " devotional-past" : "");
      if (i > 0) {
        const divider = document.createElement("div");
        divider.className = "day-divider";
        divider.innerHTML = "<span>" + esc(fmtDate(dev.date)) + "</span>";
        wrap.appendChild(divider);
      }
      const body = document.createElement("div");
      renderDevotional(dev, body);
      wrap.appendChild(body);
      el.appendChild(wrap);
    });
  } catch (e) {
    el.innerHTML = '<div class="card"><div class="empty">🙏<br>Today\'s Sandesh is not ready yet.<br>Please check back soon.</div></div>';
  }
}

async function loadDay(day) {
  const el = $("#today-content");
  switchView("today");
  el.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const r = await fetch("/api/day/" + encodeURIComponent(day));
    if (!r.ok) throw new Error("missing");
    renderDevotional(await r.json(), el);
  } catch (e) {
    el.innerHTML = '<div class="card"><div class="error">Could not load the Sandesh for ' + esc(day) + ".</div></div>";
  }
}

/* ---------------- share card ---------------- */

async function cardFile(btn) {
  const img = document.getElementById(btn.getAttribute(btn.hasAttribute("data-share") ? "data-share" : "data-download"));
  const blob = await (await fetch(img.src)).blob();
  const name = "sai-sandesh-" + btn.getAttribute("data-date") + ".png";
  return new File([blob], name, { type: "image/png" });
}

async function shareCard(btn) {
  const dateStr = btn.getAttribute("data-date");
  try {
    const file = await cardFile(btn);
    const data = { files: [file], title: "Sai Sandesh", text: "Sai Ram. Today's Sai Sandesh — " + fmtDate(dateStr) };
    if (navigator.canShare && navigator.canShare(data)) {
      await navigator.share(data);
      return;
    }
  } catch (e) { /* fall through to fallback */ }
  try {
    await navigator.share({ title: "Sai Sandesh", text: "Sai Ram. Today's Sai Sandesh — " + fmtDate(dateStr), url: location.origin });
  } catch (e) {
    downloadCard(btn); // final fallback: just download the card
  }
}

async function downloadCard(btn) {
  const file = await cardFile(btn);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------------- topics ---------------- */

let topicsCache = null;

async function loadTopics() {
  const el = $("#topics-content");
  try {
    const r = await fetch("/api/topics");
    topicsCache = await r.json();
    if (!topicsCache.length) {
      el.innerHTML = '<div class="empty">Topics are on their way.</div>';
      return;
    }
    el.innerHTML = '<div class="topic-grid">' + topicsCache.map((t) =>
      '<div class="topic-tile" data-slug="' + esc(t.slug) + '">' + esc(t.title) + "</div>").join("") + "</div>";
    el.querySelectorAll(".topic-tile").forEach((tile) =>
      tile.addEventListener("click", () => loadTopic(tile.getAttribute("data-slug"))));
  } catch (e) {
    el.innerHTML = '<div class="error">Could not load topics.</div>';
  }
}

async function loadTopic(slug) {
  const el = $("#topics-content");
  el.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const r = await fetch("/api/topic/" + encodeURIComponent(slug));
    if (!r.ok) throw new Error("missing");
    const t = await r.json();
    const back = (topicsCache ? topicsCache.find((x) => x.slug === t.slug) || {} : {}).title || t.title;
    let html = '<span class="back-link" id="topics-back">← All topics</span>';
    html += '<div class="card"><p class="section-label" style="margin-top:0">Topic</p><h1 style="margin:0">' + esc(t.title) + "</h1></div>";

    if (t.definition && t.definition.quote) {
      html += '<div class="card"><div class="section-label">💬 Swami Defines It</div>' +
        '<div class="quote-block">' + esc(t.definition.quote) +
        (t.definition.citation ? '<span class="citation">— ' + esc(t.definition.citation) + "</span>" : "") + "</div></div>";
    }
    if (t.vahinis && t.vahinis.length) {
      html += '<div class="card"><div class="section-label">📖 From the Vahinis</div>' +
        t.vahinis.map((v) => '<div class="quote-block">' + esc(v.quote) +
          (v.source ? '<span class="citation">— ' + esc(v.source) + "</span>" : "") + "</div>").join("") + "</div>";
    }
    if (t.discourses && t.discourses.length) {
      html += '<div class="card"><div class="section-label">🕉️ From the Discourses</div>' +
        t.discourses.map((v) => '<div class="quote-block">' + esc(v.quote) +
          (v.citation ? '<span class="citation">— ' + esc(v.citation) + "</span>" : "") + "</div>").join("") + "</div>";
    }
    if (t.actionable_steps && t.actionable_steps.length) {
      html += '<div class="card"><div class="section-label">🧭 His Actionable Steps</div>' +
        t.actionable_steps.map((s, i) => '<div class="step-item"><div class="step-num">' + (i + 1) + "</div><div>" +
          esc(s.step) + (s.citation ? '<p class="citation" style="margin:4px 0 0">— ' + esc(s.citation) + "</p>" : "") +
          "</div></div>").join("") + "</div>";
    }
    if (t.make_it_real) {
      html += '<div class="make-it-real"><div class="section-label">✨ Make It Real</div>' + esc(t.make_it_real) + "</div>";
    }
    el.innerHTML = html;
    $("#topics-back").addEventListener("click", loadTopics);
    window.scrollTo(0, 0);
  } catch (e) {
    el.innerHTML = '<span class="back-link" id="topics-back">← All topics</span><div class="error">Could not load this topic.</div>';
    $("#topics-back").addEventListener("click", loadTopics);
  }
}

/* ---------------- search ---------------- */

async function populateTopicDropdown() {
  try {
    const r = await fetch("/api/topics");
    const topics = await r.json();
    const sel = $("#search-topic");
    topics.forEach((t) => {
      const o = document.createElement("option");
      o.value = t.slug; o.textContent = t.title;
      sel.appendChild(o);
    });
  } catch (e) { /* search works without the dropdown */ }
}

async function runSearch() {
  const q = $("#search-q").value.trim();
  const topic = $("#search-topic").value;
  const box = $("#search-results");
  if (!q) { box.innerHTML = '<div class="empty">Type a word or phrase to search Swami\'s discourses and Vahinis.</div>'; return; }
  box.innerHTML = '<div class="loading">Searching…</div>';
  try {
    const params = new URLSearchParams({ q: q, limit: "10" });
    if (topic) params.set("topic", topic);
    const r = await fetch("/api/search?" + params.toString());
    if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error(err.detail || "search failed"); }
    const data = await r.json();
    const hits = data.results || [];
    const dym = data.did_you_mean;
    const dymHtml = dym ? '<div class="did-you-mean">Did you mean <button class="dym-link" id="dym-btn">' + esc(dym) + '</button>?</div>' : '';
    if (!hits.length) { box.innerHTML = dymHtml + '<div class="empty">No passages found. Try a different word.</div>'; return; }
    box.innerHTML = dymHtml + '<div class="card">' + hits.map((h) =>
      '<div class="result-item"><button class="result-link" data-doc="' + h.doc_id + '">' +
      esc(h.citation || h.title) + ' <span class="read-more">Read full →</span></button>' +
      (h.gist ? '<p class="result-gist"><span class="gist-label">Meaning:</span> ' + esc(h.gist) + "</p>" : "") +
      '<p class="result-excerpt">' + esc(h.excerpt) + "</p></div>").join("") + "</div>";
    const dymBtn = $("#dym-btn");
    if (dymBtn) dymBtn.addEventListener("click", () => { $("#search-q").value = dym; runSearch(); });
    box.querySelectorAll("[data-doc]").forEach((b) =>
      b.addEventListener("click", () => openDiscourse(b.getAttribute("data-doc"))));
  } catch (e) {
    box.innerHTML = '<div class="error">Search failed: ' + esc(e.message) + "</div>";
  }
}

/* ---------------- reader ---------------- */

async function openDiscourse(docId) {
  const box = $("#reader-content");
  switchView("reader");
  box.innerHTML = '<div class="loading">Loading discourse…</div>';
  try {
    const r = await fetch("/api/discourse/" + encodeURIComponent(docId));
    if (!r.ok) throw new Error("could not load discourse");
    const d = await r.json();
    const paras = esc(d.text).split(/\n\n+/).map((p) => "<p>" + p + "</p>").join("");
    box.innerHTML = "<h2 style='margin-top:0'>" + esc(d.title) + "</h2>" +
      '<p class="citation">' + esc(d.citation) +
      (d.word_count ? " · " + Number(d.word_count).toLocaleString() + " words" : "") + "</p>" +
      '<div class="discourse-body">' + paras + "</div>";
    window.scrollTo(0, 0);
  } catch (e) {
    box.innerHTML = '<div class="error">Could not load the discourse.</div>';
  }
}

$("#reader-back").addEventListener("click", () => switchView("search"));

/* ---------------- archive ---------------- */

async function loadArchive() {
  const ul = $("#archive-list");
  try {
    const r = await fetch("/api/archive");
    const dates = await r.json();
    if (!dates.length) { ul.innerHTML = '<div class="empty">No past Sandeshs yet.</div>'; return; }
    ul.innerHTML = dates.map((d) =>
      '<li><button data-day="' + esc(d) + '">' + esc(fmtDate(d)) + "</button></li>").join("");
    ul.querySelectorAll("[data-day]").forEach((b) =>
      b.addEventListener("click", () => loadDay(b.getAttribute("data-day"))));
  } catch (e) {
    ul.innerHTML = '<div class="error">Could not load the archive.</div>';
  }
}

/* ---------------- nav ---------------- */

function switchView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  $("#view-" + name).classList.add("active");
  document.querySelectorAll(".bottom-nav button").forEach((b) =>
    b.classList.toggle("active", b.getAttribute("data-view") === name));
  window.scrollTo(0, 0);
  if (name === "topics" && !$("#topics-content").dataset.loaded) { $("#topics-content").dataset.loaded = "1"; loadTopics(); }
  if (name === "archive") loadArchive();
}

document.querySelectorAll(".bottom-nav button").forEach((b) =>
  b.addEventListener("click", () => switchView(b.getAttribute("data-view"))));

$("#search-btn").addEventListener("click", runSearch);
$("#search-q").addEventListener("keydown", (e) => { if (e.key === "Enter") runSearch(); });

loadToday();
populateTopicDropdown();

// PWA: register the service worker (scope / so it covers API + cards).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => { /* offline support is best-effort */ });
  });
}
