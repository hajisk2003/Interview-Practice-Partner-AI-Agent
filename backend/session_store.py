from typing import List, Dict, Any

class Session:
    def __init__(self, role: str, difficulty: str):
        self.role = role
        self.difficulty = difficulty
        self.history: List[Dict[str, Any]] = []  # list of {q, a, followups:[]}

    def add_question(self, q: str):
        self.history.append({"q": q, "a": None, "followups": []})

    def add_answer(self, a: str):
        if not self.history:
            raise RuntimeError("No question to attach answer to")
        self.history[-1]["a"] = a

    def add_followup(self, follow_q: str):
        if not self.history:
            raise RuntimeError("No base question")
        self.history[-1]["followups"].append({"q": follow_q, "a": None})

    def add_followup_answer(self, text: str):
        if not self.history or not self.history[-1]["followups"]:
            raise RuntimeError("No followup to answer")
        self.history[-1]["followups"][-1]["a"] = text

class SessionStore:
    def __init__(self):
        self._store: Dict[str, Session] = {}

    def create(self, session_id: str, role: str, difficulty: str):
        self._store[session_id] = Session(role, difficulty)

    def get(self, session_id: str) -> Session:
        return self._store.get(session_id)

    def exists(self, session_id: str) -> bool:
        return session_id in self._store

    def delete(self, session_id: str):
        if session_id in self._store:
            del self._store[session_id]
