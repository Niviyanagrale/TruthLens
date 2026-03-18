# TruthLens v2 — AI Fake News Detector

> An AI-powered fake news detection system using NLP, ML, and api

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
