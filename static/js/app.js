/* ════════════════════════════════════════
   TruthLens — app.js
════════════════════════════════════════ */

/* ── STATE ──────────────────────────── */
let history = JSON.parse(localStorage.getItem("tl-history") || "[]");
let sources =
  JSON.parse(localStorage.getItem("tl-sources") || "null") ||
  getDefaultSources();
let stats = JSON.parse(
  localStorage.getItem("tl-stats") ||
    '{"total":0,"fake":0,"real":0,"suspect":0}',
);

/* ── PAGE NAV ───────────────────────── */
function showPage(id, btn) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + id).classList.add("active");
  if (btn) btn.classList.add("active");
  if (id === "history") renderHistory();
  if (id === "sources") renderSources();
}

function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("open");
  document.getElementById("sidebarOverlay").classList.toggle("open");
}

/* ── CHAR COUNT ─────────────────────── */
document.getElementById("newsInput").addEventListener("input", function () {
  document.getElementById("charCount").textContent =
    this.value.length + " characters";
});

function clearInput() {
  document.getElementById("newsInput").value = "";
  document.getElementById("charCount").textContent = "0 characters";
  document.getElementById("resultWrap").style.display = "none";
}

/* ── FETCH URL (placeholder) ─────────── */
function fetchUrl() {
  const url = document.getElementById("urlInput").value.trim();
  if (!url) {
    showToast("Please enter a URL first");
    return;
  }
  showToast(
    "URL fetching requires Flask backend — paste article text directly",
  );
}

/* ── ANALYZE ────────────────────────── */
async function analyzeNews() {
  const text = document.getElementById("newsInput").value.trim();
  if (text.length < 30) {
    showToast("Please paste at least a few sentences for accurate analysis");
    return;
  }

  const loader = document.getElementById("loader");
  const resultWrap = document.getElementById("resultWrap");
  const analyzeBtn = document.getElementById("analyzeBtn");

  loader.style.display = "flex";
  resultWrap.style.display = "none";
  analyzeBtn.disabled = true;

  const steps = [
    "Tokenizing text...",
    "Removing stopwords...",
    "Extracting TF-IDF features...",
    "Running credibility analysis...",
    "Computing confidence scores...",
    "Generating verdict...",
  ];
  let si = 0;
  const stepEl = document.getElementById("loaderStep");
  const stepInterval = setInterval(() => {
    stepEl.textContent = steps[si % steps.length];
    si++;
  }, 700);

  const prompt = `You are an expert fake news detection AI trained on NLP and journalism standards.
Analyze the following news text and return ONLY a valid JSON object — no markdown, no explanation, no backticks.

Evaluate these dimensions:
- Linguistic patterns (sensationalism, emotional manipulation, clickbait)
- Source credibility signals (named sources, anonymous claims, verifiability)
- Writing quality (grammar, coherence, professional tone)
- Factual consistency (internal logic, plausible claims)
- Headline-body alignment

Return exactly this JSON:
{
  "verdict": "REAL" or "FAKE" or "SUSPECT",
  "confidence": <integer 0-100>,
  "credibility_score": <integer 0-100>,
  "emotional_score": <integer 0-100>,
  "grammar_score": <integer 0-100>,
  "summary": "<2-3 sentence plain English explanation of the verdict>",
  "top_signals": ["<specific signal found>", "<specific signal found>", "<specific signal found>"]
}

NEWS TEXT:
"""
${text.substring(0, 2500)}
"""`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
        }),
      },
    );

    const data = await response.json();
    clearInterval(stepInterval);
    loader.style.display = "none";
    analyzeBtn.disabled = false;

    if (!data.choices || !data.choices[0]) {
      showToast("API error — check your Groq key in config.js");
      console.error("Groq response:", data);
      return;
    }

    const raw = data.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    saveToHistory(result, text);
    updateStats(result.verdict);
    displayResult(result, text);
  } catch (err) {
    clearInterval(stepInterval);
    loader.style.display = "none";
    analyzeBtn.disabled = false;
    showToast("Analysis failed — check your Groq API key in config.js");
    console.error("Analysis error:", err);
  }
}

/* ── DISPLAY RESULT ─────────────────── */
function displayResult(r) {
  const wrap = document.getElementById("resultWrap");

  const verdictColor =
    { REAL: "var(--green)", FAKE: "var(--red)", SUSPECT: "var(--amber)" }[
      r.verdict
    ] || "var(--amber)";
  const verdictBg =
    {
      REAL: "var(--green-dim)",
      FAKE: "var(--red-dim)",
      SUSPECT: "var(--amber-dim)",
    }[r.verdict] || "var(--amber-dim)";

  const conf = Math.round(r.confidence);
  const cred = Math.round(r.credibility_score);
  const emo = Math.round(r.emotional_score);
  const gram = Math.round(r.grammar_score);

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dash = (conf / 100) * circumference;

  const signals = (r.top_signals || [])
    .map((s) => `<div class="signal-chip">${s}</div>`)
    .join("");

  wrap.innerHTML = `
    <div class="result-panel">
      <div class="result-top" style="background:${verdictBg};">
        <div class="verdict-ring">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="${radius}"
              fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="5"/>
            <circle cx="40" cy="40" r="${radius}"
              fill="none" stroke="${verdictColor}" stroke-width="5"
              stroke-dasharray="${dash} ${circumference}"
              stroke-linecap="round"
              transform="rotate(-90 40 40)"/>
          </svg>
          <div class="verdict-ring-inner" style="color:${verdictColor}">${conf}%</div>
        </div>
        <div class="verdict-info">
          <div class="verdict-label">AI Verdict</div>
          <div class="verdict-text" style="color:${verdictColor}">${r.verdict}</div>
          <div class="verdict-conf">${conf}% confidence · ${new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      <div class="result-scores">
        <div class="score-cell">
          <div class="score-cell-label">Credibility</div>
          <div class="score-bar-wrap">
            <div class="score-bar-fill" style="width:${cred}%;background:var(--green)"></div>
          </div>
          <div class="score-val" style="color:var(--green)">${cred}<span style="font-size:0.65rem;color:var(--txt3)">/100</span></div>
        </div>
        <div class="score-cell">
          <div class="score-cell-label">Emotional Language</div>
          <div class="score-bar-wrap">
            <div class="score-bar-fill" style="width:${emo}%;background:${emo > 60 ? "var(--red)" : "var(--amber)"}"></div>
          </div>
          <div class="score-val" style="color:${emo > 60 ? "var(--red)" : "var(--amber)"}">${emo}<span style="font-size:0.65rem;color:var(--txt3)">/100</span></div>
        </div>
        <div class="score-cell">
          <div class="score-cell-label">Grammar Quality</div>
          <div class="score-bar-wrap">
            <div class="score-bar-fill" style="width:${gram}%;background:var(--blue)"></div>
          </div>
          <div class="score-val" style="color:var(--blue-bright)">${gram}<span style="font-size:0.65rem;color:var(--txt3)">/100</span></div>
        </div>
      </div>

      <div class="result-body">
        <div class="result-summary">${r.summary}</div>
        ${
          signals
            ? `
          <div class="signals-title">Key Signals Detected</div>
          <div class="signal-chips">${signals}</div>
        `
            : ""
        }
        <div class="result-actions">
          <button class="btn btn-ghost btn-sm" onclick="copyResult('${r.verdict}', ${conf})">Copy Result</button>
          <button class="btn btn-ghost btn-sm" onclick="clearInput()">Analyze Another</button>
        </div>
      </div>
    </div>
  `;

  wrap.style.display = "block";
  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function copyResult(verdict, conf) {
  const text = `TruthLens Analysis: ${verdict} (${conf}% confidence)`;
  navigator.clipboard.writeText(text).then(() => showToast("✓ Result copied"));
}

function saveToHistory(result, text) {
  const entry = {
    verdict: result.verdict,
    confidence: Math.round(result.confidence),
    excerpt: text.substring(0, 120).replace(/\n/g, " "),
    summary: result.summary,
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
  };
  history.unshift(entry);
  if (history.length > 50) history.pop();
  localStorage.setItem("tl-history", JSON.stringify(history));
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!history.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕓</div>
        <div class="empty-title">No history yet</div>
        <div class="empty-sub">Analyze an article and it will appear here</div>
      </div>`;
    return;
  }
  list.innerHTML = history
    .map(
      (h, i) => `
    <div class="history-item" onclick="showHistoryDetail(${i})">
      <div class="history-verdict hv-${h.verdict.toLowerCase()}">${h.verdict}</div>
      <div class="history-excerpt">${h.excerpt}...</div>
      <div class="history-time">${h.date} · ${h.time}</div>
    </div>
  `,
    )
    .join("");
}

function showHistoryDetail(i) {
  const h = history[i];
  showToast(`${h.verdict} · ${h.confidence}% confidence · ${h.date}`);
}

function clearHistory() {
  if (!confirm("Clear all analysis history?")) return;
  history = [];
  localStorage.removeItem("tl-history");
  renderHistory();
}

/* ── STATS ──────────────────────────── */
function updateStats(verdict) {
  stats.total++;
  if (verdict === "FAKE") stats.fake++;
  if (verdict === "REAL") stats.real++;
  if (verdict === "SUSPECT") stats.suspect++;
  localStorage.setItem("tl-stats", JSON.stringify(stats));
  renderStats();
}

function renderStats() {
  document.getElementById("totalAnalyzed").textContent = stats.total;
  document.getElementById("totalFake").textContent = stats.fake;
  document.getElementById("totalReal").textContent = stats.real;
}

/* ── SOURCES ────────────────────────── */
function getDefaultSources() {
  return [
    {
      name: "BBC News",
      url: "https://bbc.com/news",
      category: "International",
      reliability: "high",
    },
    {
      name: "Reuters",
      url: "https://reuters.com",
      category: "International",
      reliability: "high",
    },
    {
      name: "The Hindu",
      url: "https://thehindu.com",
      category: "National",
      reliability: "high",
    },
    {
      name: "NDTV",
      url: "https://ndtv.com",
      category: "National",
      reliability: "high",
    },
    {
      name: "Snopes",
      url: "https://snopes.com",
      category: "Fact Checkers",
      reliability: "high",
    },
    {
      name: "PolitiFact",
      url: "https://politifact.com",
      category: "Fact Checkers",
      reliability: "high",
    },
    {
      name: "Alt News India",
      url: "https://altnews.in",
      category: "Fact Checkers",
      reliability: "high",
    },
    {
      name: "Times of India",
      url: "https://timesofindia.indiatimes.com",
      category: "National",
      reliability: "medium",
    },
    {
      name: "AFP Fact Check",
      url: "https://factcheck.afp.com",
      category: "Fact Checkers",
      reliability: "high",
    },
    {
      name: "FactCheck.org",
      url: "https://factcheck.org",
      category: "Fact Checkers",
      reliability: "high",
    },
  ];
}

function saveSources() {
  localStorage.setItem("tl-sources", JSON.stringify(sources));
}

function renderSources() {
  const grid = document.getElementById("sourcesGrid");
  if (!sources.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔗</div>
        <div class="empty-title">No sources yet</div>
        <div class="empty-sub">Add your first one above</div>
      </div>`;
    return;
  }
  const dotColor = {
    high: "var(--green)",
    medium: "var(--amber)",
    low: "var(--red)",
  };
  grid.innerHTML = sources
    .map(
      (s, i) => `
    <div class="source-card">
      <div class="source-rel-dot" style="background:${dotColor[s.reliability] || "var(--txt3)"}"></div>
      <div class="source-name">${s.name}</div>
      <div class="source-cat">${s.category}</div>
      <a class="source-url" href="${s.url}" target="_blank" rel="noopener">${s.url.replace(/https?:\/\//, "")}</a>
      <div class="source-actions">
        <button class="btn btn-sm btn-outline" onclick="window.open('${s.url}','_blank')">Visit</button>
        <button class="btn btn-sm btn-outline" onclick="copySourceUrl('${s.url}')">Copy</button>
        <button class="btn btn-sm" style="border-color:var(--red-border);color:#f87171;" onclick="removeSource(${i})">✕</button>
      </div>
    </div>
  `,
    )
    .join("");
}

function addSource() {
  const name = document.getElementById("s-name").value.trim();
  const url = document.getElementById("s-url").value.trim();
  const cat = document.getElementById("s-cat").value;
  const rel = document.getElementById("s-rel").value;
  if (!name || !url) {
    showToast("Please fill in both name and URL");
    return;
  }
  const fullUrl = url.startsWith("http") ? url : "https://" + url;
  sources.push({ name, url: fullUrl, category: cat, reliability: rel });
  saveSources();
  renderSources();
  document.getElementById("s-name").value = "";
  document.getElementById("s-url").value = "";
  showToast("✓ Source added");
}

function removeSource(i) {
  sources.splice(i, 1);
  saveSources();
  renderSources();
}

function copySourceUrl(url) {
  navigator.clipboard.writeText(url).then(() => showToast("✓ URL copied"));
}

/* ── TOAST ──────────────────────────── */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.display = "none";
  }, 3000);
}

/* ── INIT ───────────────────────────── */
renderStats();
renderSources();
