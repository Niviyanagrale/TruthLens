# TruthLens v2 — AI Fake News Detector

> An AI-powered fake news detection system using NLP, ML, and the Gemini API.

---

## Folder Structure

```
TruthLens/
├── index.html
├── .gitignore
├── README.md
├── static/
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js
│   │   └── config.js        ← YOU CREATE THIS (not on GitHub)
│   └── images/
│       └── README.txt
├── model/
│   └── train_model.py
├── data/
│   └── README.txt
└── docs/
    └── project_report.md
```

---

## Setup (First Time)

**Step 1 — Create your config file**

Create `static/js/config.js` with:
```js
const GEMINI_API_KEY = "your-key-here";
```
Get your free key at: https://aistudio.google.com

**Step 2 — Run local server**
```bash
python -m http.server 8080
```

**Step 3 — Open browser**
```
http://localhost:8080
```

---

## Hardcode Your About Page Details

Open `index.html` and search for `← YOUR` — every field is marked.

---

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | HTML, CSS, JavaScript |
| AI API   | Google Gemini 1.5 Flash |
| ML Models| Logistic Regression, PAC, Naive Bayes |
| NLP      | TF-IDF, NLTK, spaCy |
| Backend* | Flask (optional) |

---

## Model Accuracy

| Model | Accuracy |
|-------|----------|
| Logistic Regression | ~92% |
| Passive Aggressive  | ~91% |
| Naive Bayes         | ~88% |
