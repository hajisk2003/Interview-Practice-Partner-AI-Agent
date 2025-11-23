Q_TEMPLATE = '''You are an interviewer for the role: {role}.
Difficulty: {difficulty}.
Produce a single interview question (type either technical or behavioral) and label it.
Return only the question text. Keep under 60 words.'''


FOLLOWUP_DECISION = '''User answer: """{answer}"""
Question: """{question}"""
Instruction: Decide if a follow-up question is needed to better evaluate the candidate. If yes, output strict JSON:
{{"follow_up":"yes","follow_up_question":"...","reason":"short reason"}}
If not needed, output: {{"follow_up":"no"}}
Return only JSON.
'''


FEEDBACK_PROMPT = '''Session history:
{history}
Instruction: Score the candidate 0-10 in three categories: Communication, Technical Knowledge, Problem Solving.
For each category return: score (0-10), one-sentence reason, and two short actionable suggestions.
Output strict JSON of the shape: {{"communication":{{...}},"technical":{{...}},"problem_solving":{{...}},"summary":"..."}}
Keep the JSON parseable and concise.
'''