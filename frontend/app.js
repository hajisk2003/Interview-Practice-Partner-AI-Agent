// app.js - keeps same logic but with improved UX and error handling
let sessionId = null;
let isAwaitingFollowup = false;

const apiBase = 'http://127.0.0.1:8000';

const chatEl = document.getElementById('chat');
const roleSelect = document.getElementById('role-select');
const diffSelect = document.getElementById('diff-select');
const startBtn = document.getElementById('start-btn');
const nextQBtn = document.getElementById('next-q-btn');
const endBtn = document.getElementById('end-btn');
const submitBtn = document.getElementById('submit-btn');
const userInput = document.getElementById('user-input');
const startVoiceBtn = document.getElementById('start-voice');
const downloadBtn = document.getElementById('download');
const sessionIdEl = document.getElementById('session-id');
const typingEl = document.getElementById('typing');

function logBot(text){
  appendMessage(text, 'bot');
}
function appendMessage(text, who='bot'){
  const div = document.createElement('div');
  div.className = 'message ' + (who==='bot'?'bot':'user');

  
  const safe = document.createElement('div');
  safe.textContent = text;
  div.appendChild(safe);

  const meta = document.createElement('span');
  meta.className = 'meta';
  const now = new Date();
  meta.textContent = now.toLocaleTimeString();
  div.appendChild(meta);

  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;

  if(who === 'bot') speak(text);
}

function showTyping(on=true){
  typingEl.classList.toggle('hidden', !on);
}

// small helper to show errors
function showError(msg){
  appendMessage("Error: " + msg, 'bot');
  console.error(msg);
}

// network helper with error handling
async function postJson(url, body){
  try{
    const res = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    if(!res.ok){
      const txt = await res.text();
      throw new Error(`${res.status} ${res.statusText} - ${txt}`);
    }
    return await res.json();
  }catch(e){
    showError(e.message);
    throw e;
  }
}

// Start session
startBtn.onclick = async ()=>{
  const role = roleSelect.value;
  const diff = diffSelect.value;
  try{
    const data = await postJson(`${apiBase}/start`, {role, difficulty: diff});
    sessionId = data.session_id;
    sessionIdEl.textContent = sessionId;
    appendMessage('Welcome! Your interview practice session has started.', 'bot');
    nextQBtn.disabled = false; endBtn.disabled = false; startBtn.disabled = true;
  }catch(e){
    
  }
}


nextQBtn.onclick = async ()=>{
  if(!sessionId){
    showError("Start a session first.");
    return;
  }
  showTyping(true);
  try{
    const data = await postJson(`${apiBase}/next_question/${sessionId}`, {});
    appendMessage(data.question, 'bot');
    isAwaitingFollowup = false;
  }catch(e){
    
  } finally{
    showTyping(false);
  }
}


submitBtn.onclick = async ()=>{
  const text = userInput.value.trim();
  if(!text) return;
  appendMessage(text, 'user');
  userInput.value = '';

  try{
    const body = {text, followup_answer: isAwaitingFollowup};
    showTyping(true);
    const data = await postJson(`${apiBase}/submit_answer/${sessionId}`, body);
    
    if(data && data.follow_up){
      appendMessage(data.follow_up, 'bot');
      isAwaitingFollowup = true;
    } else {
      appendMessage('No follow-up. You can request next question or end session.', 'bot');
      isAwaitingFollowup = false;
    }
  }catch(e){
    
  } finally{
    showTyping(false);
  }
}

// End session -> get feedback
endBtn.onclick = async () => {
  if (!sessionId) { 
    showError("Start a session first."); 
    return; 
  }

  showTyping(true);

  try {
    const data = await postJson(`${apiBase}/end/${sessionId}`, {});

    appendMessage('--- Final Feedback ---', 'bot');

    function formatFeedback(feedback) {
      return `
Communication:
  Score: ${feedback.communication.score}
  Reason: ${feedback.communication.reason}
  Suggestions:
    - ${feedback.communication.suggestions.join("\n    - ")}

Technical:
  Score: ${feedback.technical.score}
  Reason: ${feedback.technical.reason}
  Suggestions:
    - ${feedback.technical.suggestions.join("\n    - ")}

Problem Solving:
  Score: ${feedback.problem_solving.score}
  Reason: ${feedback.problem_solving.reason}
  Suggestions:
    - ${feedback.problem_solving.suggestions.join("\n    - ")}

Overall Summary:
${feedback.summary}
`;
    }

 
    const formatted = formatFeedback(data);

    appendMessage(formatted, "bot");  // <-- This shows clean text in UI

  } catch (e) {
    
  } finally {
    showTyping(false);
  }
}


// Transcript download
downloadBtn.onclick = ()=>{
  const text = Array.from(chatEl.querySelectorAll('.message')).map(m=>m.textContent).join('\n');
  const blob = new Blob([text], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='transcript.txt'; a.click();
}

// Voice input (Web Speech API)
let recognition = null;
let isRecording = false;
if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = ()=>{ isRecording = true; document.querySelector('.mic-btn').classList.add('recording'); }
  recognition.onend = ()=>{ isRecording = false; document.querySelector('.mic-btn').classList.remove('recording'); }

  recognition.onresult = (event)=>{
    const text = event.results[0][0].transcript;
    userInput.value = text;
    appendMessage('[Voice captured] ' + text, 'user');
  }
  recognition.onerror = (e)=>{ showError('Voice error: ' + e.error); }
} else {
  startVoiceBtn.disabled = true;
  startVoiceBtn.title = "Voice not supported on this browser";
}

startVoiceBtn.onclick = ()=>{
  if(!recognition) return;
  if(isRecording){
    recognition.stop();
  } else {
    recognition.start();
  }
}


function decodeJSONText(raw) {
  try {
    // If raw is actually JSON object from backend
    if (typeof raw !== "string") return raw;

    return JSON.parse(raw);
  } catch (e) {
    
    return raw
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\t/g, " ")
      .replace(/\\r/g, " ")
      .replace(/\\+/g, "")   
      .trim();
  }
}

function cleanForSpeech(text) {
  return text
    .replace(/\n+/g, " ")     
    .replace(/\s\s+/g, " ")   
    .trim();
}

function prepareTTS(text) {
  let decoded = decodeJSONText(text);

  if (typeof decoded !== "string") {
    decoded = JSON.stringify(decoded, null, 2);
  }

  decoded = decoded.replace(/\b\d{2}:\d{2}:\d{2}\b/g, "");

  decoded = decoded.replace(/[0-9a-fA-F\-]{36}/g, "");

  decoded = decoded.replace(/---+/g, "");

  decoded = decoded.replace(/Session started\s*—*/gi, "");

  decoded = decoded.replace(/[-–—]{2,}/g, "");

  
  decoded = decoded.replace(/\*\*Behavioral Question:\*\*/gi, "Behavioral Question:");

  
  return cleanForSpeech(decoded);
}


function speak(text){
  if(!('speechSynthesis' in window)) return;

  try{
    const cleaned = prepareTTS(text);  // <-- FIX HERE

    const ut = new SpeechSynthesisUtterance(cleaned);
    ut.rate = 1;
    ut.pitch = 1;

    speechSynthesis.cancel();
    speechSynthesis.speak(ut);

  }catch(e){ 
    console.warn('TTS failed', e); 
  }
}