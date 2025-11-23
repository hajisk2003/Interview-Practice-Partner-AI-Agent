from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uuid
from session_store import SessionStore
from prompts import Q_TEMPLATE, FOLLOWUP_DECISION, FEEDBACK_PROMPT
from llm_client import call_llm, call_llm_json
import uvicorn
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
store = SessionStore()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartReq(BaseModel):
    role: str
    difficulty: str

class AnswerReq(BaseModel):
    text: str
    followup_answer: bool = False  

@app.post('/start')
async def start(req: StartReq):
    sid = str(uuid.uuid4())
    store.create(sid, req.role, req.difficulty)
    return {"session_id": sid}

@app.post('/next_question/{session_id}')
async def next_question(session_id: str):
    s = store.get(session_id)
    if not s:
        raise HTTPException(status_code=404, detail='session not found')
    prompt = Q_TEMPLATE.format(role=s.role, difficulty=s.difficulty)
    q = call_llm(prompt, temperature=0.2)
    s.add_question(q)
    return {"question": q}

@app.post('/submit_answer/{session_id}')
async def submit_answer(session_id: str, ans: AnswerReq):
    s = store.get(session_id)
    if not s:
        raise HTTPException(status_code=404, detail='session not found')

    
    if ans.followup_answer:
        s.add_followup_answer(ans.text)
    else:
        s.add_answer(ans.text)

    latest = s.history[-1]
    question_text = latest['q']

    prompt = FOLLOWUP_DECISION.format(answer=ans.text, question=question_text)

    
    resp = call_llm_json(prompt)

    if isinstance(resp, dict) and resp.get('follow_up') == 'yes':
        fq = resp.get('follow_up_question')
        s.add_followup(fq)
        return {"follow_up": fq, "reason": resp.get('reason','')}
    else:
        return {"follow_up": None}



@app.post('/end/{session_id}')
async def end_session(session_id: str):
    s = store.get(session_id)
    if not s:
        raise HTTPException(status_code=404, detail='session not found')

    hist_text_lines = []
    for i, item in enumerate(s.history, start=1):
        hist_text_lines.append(f"Q{i}: {item['q']}")
        hist_text_lines.append(f"A{i}: {item.get('a')}")
        for j, fu in enumerate(item.get('followups', []), start=1):
            hist_text_lines.append(f"Q{i}.{j}: {fu['q']}")
            hist_text_lines.append(f"A{i}.{j}: {fu.get('a')}")

    hist_text = "\n".join(hist_text_lines)
    prompt = FEEDBACK_PROMPT.format(history=hist_text)

    
    feedback = call_llm_json(prompt)

    return {"feedback": feedback}


if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)
