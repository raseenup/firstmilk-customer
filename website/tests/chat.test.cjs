const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=fs.readFileSync(path.join(root,'chat.js'),'utf8');
test('public chatbot never exposes credentials or private conversations',()=>{
  assert.ok(file.includes('credentials:\'omit\''));
  assert.ok(file.includes("cache:'no-store'"));
  assert.ok(file.includes('AbortController'));
  assert.ok(file.includes('field.maxLength = limit'));
  assert.ok(file.includes("messages.children.length>30"));
  assert.ok(file.includes('node.textContent = text'));
  assert.doesNotMatch(file,/localStorage\./);
  assert.doesNotMatch(file,/Authorization.*Bearer/);
  assert.doesNotMatch(file,/eval\s*\(/);
});
test('public chatbot uses same approved production API and closes safely',()=>{
  assert.ok(file.includes('https://backend.firstmilkventure.com/public/assistant/chat'));
  assert.ok(file.includes("if (inFlight) {inFlight.abort();inFlight=null;}"));
  assert.ok(file.includes('timeout=setTimeout'));
  assert.ok(file.includes("submit.disabled=true"));
  assert.ok(file.includes('panel.hidden = !open'));
});
