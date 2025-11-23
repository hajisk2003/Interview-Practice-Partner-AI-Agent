# Interview Practice Partner

A chat + voice interview practice agent (MVP) built with:

- **Backend:** FastAPI (Python)
- **Frontend:** HTML + JavaScript (Web Speech API for voice)
- **LLM:** OpenAI API (wrapper provided)

This project allows users to practice interviews interactively with:

- Role selection (Software Engineer, Data Analyst, Sales)
- Question generation via LLM
- Follow-up decisions (LLM decides if a follow-up question is needed)
- Final feedback generation with scores and suggestions
- Voice input/output using Web Speech API
- Transcript export (.txt)
- Screenshot of UI for demo/reference

---

## Folder Structure

```
Interview-Practice-Partner/
│
├── backend/
│   ├── main.py
│   ├── session_store.py
│   ├── prompts.py
│   ├── llm_client.py
│   ├── requirements.txt
│   └── .env                # store API keys here
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── ui.png              # screenshot of UI
│
├── README.md
└── .gitignore
```

---

## Quick Setup

### Prerequisites

- Python 3.9+
- OpenAI API key (or your LLM provider) — store in `.env` as `OPENAI_API_KEY`

### Backend Setup

```bash
cd backend
python -m venv venv
# Activate environment:
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

### Run Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

Open `frontend/index.html` in your browser.

- Select role and difficulty, then start the session
- Speak or type answers
- Generate follow-ups and final feedback
- Download transcript as `.txt`

---

## Demo Screenshot

![UI Screenshot](frontend/ui.png)

---

## Features / Future Improvements

- Add more roles & difficulty levels
- Improve UI with animations & themes
- Add more analytics on performance
- Save sessions in a database

---

## License

MIT License
