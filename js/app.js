/* =========================================
   DK AI — app.js
   Chat logic + Anthropic API integration
   ========================================= */

// ── State ──────────────────────────────────
let messages    = [];
let isLoading   = false;
let msgCount    = 0;
let apiKey      = '';
let systemPrompt = 'Kamu adalah DK AI, asisten AI pintar untuk mahasiswa Teknik Informatika. Jawab dengan jelas, ringkas, dan gunakan bahasa Indonesia yang natural. Sertakan contoh kode bila relevan.';

// ── DOM Refs ───────────────────────────────
const area        = document.getElementById('messages-area');
const input       = document.getElementById('chat-input');
const sendBtn     = document.getElementById('send-btn');
const chatTitle   = document.getElementById('chat-title');
const emptyState  = document.getElementById('empty-state');
const charCount   = document.getElementById('char-count');

// ── Init ───────────────────────────────────
(function init() {
  apiKey       = localStorage.getItem('dk_api_key') || '';
  systemPrompt = localStorage.getItem('dk_system_prompt') || systemPrompt;
  const name   = localStorage.getItem('dk_user_name') || 'Dika Dev';

  document.querySelector('.user-name').textContent = name;
  document.getElementById('user-name-input').value  = name;
  document.getElementById('api-key-input').value    = apiKey;
  document.getElementById('system-prompt-input').value = systemPrompt;

  input.focus();
})();

// ── Helpers ────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function updateCount() {
  charCount.textContent = input.value.length + ' / 2000';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function scrollToBottom() {
  area.scrollTop = area.scrollHeight;
}

// ── Message Rendering ──────────────────────
function addMessage(role, text) {
  // Remove empty state on first message
  if (emptyState.parentNode) emptyState.remove();

  msgCount++;
  const id = 'msg-' + msgCount;

  const row = document.createElement('div');
  row.className = 'msg-row ' + role;

  // Avatar
  const av = document.createElement('div');
  av.className = 'msg-avatar ' + (role === 'ai' ? 'ai' : 'user-av');
  av.textContent = role === 'ai' ? 'DK' : getInitials();

  // Content wrapper
  const content = document.createElement('div');
  content.className = 'msg-content';

  // Bubble
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.id = id;
  if (text) bubble.textContent = text;

  // Meta
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.textContent = getTime();

  content.appendChild(bubble);
  content.appendChild(meta);

  if (role === 'ai') {
    row.appendChild(av);
    row.appendChild(content);
  } else {
    row.appendChild(content);
    row.appendChild(av);
  }

  area.appendChild(row);
  scrollToBottom();
  return id;
}

function getInitials() {
  const name = localStorage.getItem('dk_user_name') || 'Dika Dev';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'msg-row ai typing-row';
  row.id = 'typing-row';

  const av = document.createElement('div');
  av.className = 'msg-avatar ai';
  av.textContent = 'DK';

  const ind = document.createElement('div');
  ind.className = 'typing-indicator';
  ind.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';

  row.appendChild(av);
  row.appendChild(ind);
  area.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  const t = document.getElementById('typing-row');
  if (t) t.remove();
}

// ── Streaming text effect ──────────────────
function streamText(bubbleId, text, onDone) {
  const bubble = document.getElementById(bubbleId);
  if (!bubble) { if (onDone) onDone(); return; }

  const cursor = document.createElement('span');
  cursor.className = 'streaming-cursor';
  bubble.appendChild(cursor);

  let i = 0;
  const speed = text.length > 500 ? 6 : 12;

  const interval = setInterval(() => {
    if (i < text.length) {
      cursor.before(document.createTextNode(text[i]));
      i++;
      if (i % 10 === 0) scrollToBottom();
    } else {
      clearInterval(interval);
      cursor.remove();
      scrollToBottom();
      if (onDone) onDone();
    }
  }, speed);
}

// ── Send Message ───────────────────────────
async function sendMessage() {
  const text = input.value.trim();
  if (!text || isLoading) return;
  if (text.length > 2000) {
    alert('Pesan terlalu panjang (maks 2000 karakter).');
    return;
  }

  if (!apiKey) {
    openSettings();
    showToast('Masukkan API key terlebih dahulu.');
    return;
  }

  // Update sidebar title
  if (messages.length === 0) {
    const short = text.length > 32 ? text.slice(0, 32) + '…' : text;
    chatTitle.textContent = short;
    document.getElementById('item-0').querySelector('span').textContent = short;
  }

  messages.push({ role: 'user', content: text });
  addMessage('user', text);

  input.value = '';
  input.style.height = 'auto';
  updateCount();

  isLoading = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'HTTP ' + response.status);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Maaf, tidak ada respons dari server.';

    messages.push({ role: 'assistant', content: reply });

    removeTyping();
    const msgId = addMessage('ai', '');
    streamText(msgId, reply, () => {
      isLoading = false;
      sendBtn.disabled = false;
      input.focus();
    });

  } catch (err) {
    removeTyping();
    const msgId = addMessage('ai', '');
    const bubble = document.getElementById(msgId);
    bubble.textContent = '⚠ ' + (err.message || 'Gagal terhubung ke server. Periksa API key dan koneksi internet.');
    bubble.style.color = '#A32D2D';

    isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// ── Suggestion Chips ───────────────────────
function useSuggestion(text) {
  input.value = text;
  autoResize(input);
  updateCount();
  input.focus();
}

// ── New Chat ───────────────────────────────
function newChat() {
  messages  = [];
  msgCount  = 0;
  isLoading = false;
  sendBtn.disabled = false;

  area.innerHTML = '';
  area.appendChild(emptyState);

  chatTitle.textContent = 'New conversation';
  document.getElementById('item-0').querySelector('span').textContent = 'New conversation';

  input.value = '';
  input.style.height = 'auto';
  updateCount();

  document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
  document.getElementById('item-0').classList.add('active');
  input.focus();
}

// ── Demo History ───────────────────────────
const DEMOS = {
  1: {
    title: 'Machine learning basics',
    pairs: [
      {
        q: 'Apa itu machine learning?',
        a: 'Machine learning adalah cabang kecerdasan buatan di mana komputer belajar dari data tanpa diprogram secara eksplisit.\n\nAda 3 tipe utama:\n• Supervised learning — belajar dari data berlabel\n• Unsupervised learning — menemukan pola tanpa label\n• Reinforcement learning — belajar dari reward/punishment\n\nContoh nyata: spam filter email, rekomendasi Netflix, dan deteksi wajah di smartphone.'
      }
    ]
  },
  2: {
    title: 'REST API design',
    pairs: [
      {
        q: 'Prinsip desain REST API yang baik?',
        a: 'REST API yang baik mengikuti 6 prinsip:\n\n1. Stateless — tiap request mandiri, tidak bergantung sesi sebelumnya\n2. Uniform interface — endpoint konsisten, misal: GET /users, POST /users\n3. Resource-based URL — gunakan noun bukan verb (/products bukan /getProducts)\n4. HTTP methods yang tepat — GET (baca), POST (buat), PUT (update), DELETE (hapus)\n5. Status code yang benar — 200 OK, 201 Created, 404 Not Found, 500 Server Error\n6. Versioning — /api/v1/users\n\nContoh endpoint yang baik:\nGET    /api/v1/products        → list semua produk\nPOST   /api/v1/products        → buat produk baru\nGET    /api/v1/products/:id    → detail satu produk\nPUT    /api/v1/products/:id    → update produk\nDELETE /api/v1/products/:id   → hapus produk'
      }
    ]
  },
  3: {
    title: 'Python debugging help',
    pairs: [
      {
        q: 'Cara debug Python yang efektif?',
        a: 'Beberapa teknik debugging Python dari yang paling sederhana:\n\n1. Print debugging\nprint(f"Nilai x: {x}, tipe: {type(x)}")\n\n2. pdb — Python debugger bawaan\nimport pdb; pdb.set_trace()\nPerintah: n (next), s (step into), c (continue), p var (print var)\n\n3. breakpoint() — shortcut Python 3.7+\nbreakpoint()  # lebih bersih dari pdb.set_trace()\n\n4. Logging module — lebih profesional dari print\nimport logging\nlogging.basicConfig(level=logging.DEBUG)\nlogging.debug(f"Masuk fungsi: {nilai}")\n\n5. VS Code debugger — set breakpoint visual, lalu tekan F5\n\nTip penting: gunakan try/except untuk menangkap error spesifik:\ntry:\n    hasil = bagi(a, b)\nexcept ZeroDivisionError as e:\n    print(f"Error: {e}")'
      }
    ]
  }
};

function loadHistory(n) {
  const d = DEMOS[n];
  if (!d) return;

  document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
  document.getElementById('item-' + n).classList.add('active');

  messages  = [];
  msgCount  = 0;
  area.innerHTML = '';

  chatTitle.textContent = d.title;

  d.pairs.forEach(pair => {
    messages.push({ role: 'user', content: pair.q });
    messages.push({ role: 'assistant', content: pair.a });
    const uid = addMessage('user', pair.q);
    const aid = addMessage('ai', pair.a);
  });
}

// ── Export Chat ────────────────────────────
function exportChat() {
  if (messages.length === 0) {
    showToast('Belum ada percakapan untuk diekspor.');
    return;
  }

  const date = new Date().toLocaleDateString('id-ID');
  const header = `DK AI — Ekspor Chat\nTanggal: ${date}\n${'─'.repeat(40)}\n\n`;
  const body = messages
    .map(m => (m.role === 'user' ? 'Kamu' : 'DK AI') + ':\n' + m.content)
    .join('\n\n' + '─'.repeat(40) + '\n\n');

  const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'dkai-chat-' + Date.now() + '.txt';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Chat berhasil diekspor!');
}

// ── Settings Modal ─────────────────────────
function openSettings() {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('api-key-input').focus();
}

function closeSettings() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function saveSettings() {
  apiKey       = document.getElementById('api-key-input').value.trim();
  systemPrompt = document.getElementById('system-prompt-input').value.trim();
  const name   = document.getElementById('user-name-input').value.trim() || 'User';

  localStorage.setItem('dk_api_key', apiKey);
  localStorage.setItem('dk_system_prompt', systemPrompt);
  localStorage.setItem('dk_user_name', name);

  document.querySelector('.user-name').textContent = name;
  document.querySelectorAll('.msg-avatar.user-av').forEach(el => {
    el.textContent = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  });

  closeSettings();
  showToast('Pengaturan tersimpan!');
}

// ── Toast Notification ─────────────────────
function showToast(msg) {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       '24px',
    left:         '50%',
    transform:    'translateX(-50%)',
    background:   'var(--accent)',
    color:        'var(--accent-text)',
    padding:      '9px 18px',
    borderRadius: '20px',
    fontSize:     '12px',
    fontFamily:   'var(--font)',
    zIndex:       '999',
    boxShadow:    '0 4px 20px rgba(0,0,0,0.15)',
    opacity:      '0',
    transition:   'opacity 0.2s ease',
    pointerEvents:'none'
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ── Keyboard shortcuts ─────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    newChat();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === ',') {
    e.preventDefault();
    openSettings();
  }
  if (e.key === 'Escape') {
    closeSettings();
  }
});
