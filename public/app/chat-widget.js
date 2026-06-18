(function () {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/app/chat-widget.css';
  document.head.appendChild(style);

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'te', label: 'తెలుగు' },
  ];

  const QUESTIONS = [
    { label: '📝 Sign Up', msg: 'How do I sign up?' },
    { label: '🔑 Login', msg: 'How do I login?' },
    { label: '📚 All Courses', msg: 'What courses do you offer?' },
    { label: '🎨 Front End', msg: 'Show me Front End courses' },
    { label: '🌐 Web Dev', msg: 'Show me Web Development courses' },
    { label: '💻 Programming', msg: 'Show me Programming courses' },
  ];

  let currentLang = 'en';

  const container = document.createElement('div');
  container.id = 'jt-chat-container';

  container.innerHTML = `
    <div id="jt-chat-bubble">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
        <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
      </svg>
    </div>
    <div id="jt-chat-window">
      <div id="jt-chat-header">
        <span>SK Assistant</span>
        <button id="jt-chat-close">&times;</button>
      </div>
      <div id="jt-lang-bar"></div>
      <div id="jt-chat-body"></div>
      <div id="jt-chat-questions"></div>
    </div>
  `;

  document.body.appendChild(container);

  const chatWindow = document.getElementById('jt-chat-window');
  const bubble = document.getElementById('jt-chat-bubble');
  const closeBtn = document.getElementById('jt-chat-close');
  const chatBody = document.getElementById('jt-chat-body');
  const langBar = document.getElementById('jt-lang-bar');
  const questionsContainer = document.getElementById('jt-chat-questions');

  LANGUAGES.forEach((lang) => {
    const btn = document.createElement('button');
    btn.className = 'jt-lang-btn';
    btn.textContent = lang.label;
    btn.dataset.code = lang.code;
    if (lang.code === 'en') btn.classList.add('active');
    btn.addEventListener('click', () => setLanguage(lang.code));
    langBar.appendChild(btn);
  });

  QUESTIONS.forEach((q) => {
    const btn = document.createElement('button');
    btn.className = 'jt-q-btn';
    btn.textContent = q.label;
    btn.dataset.msg = q.msg;
    questionsContainer.appendChild(btn);
  });

  questionsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.jt-q-btn');
    if (btn) {
      sendMessage(btn.dataset.msg);
    }
  });

  bubble.addEventListener('click', () => {
    chatWindow.classList.add('open');
    bubble.style.display = 'none';
    if (chatBody.children.length === 0) {
      addBotMsg('Hello! 👋 I\'m <strong>SK Assistant</strong>. Pick a language above, then choose a question below.');
    } else {
      setTimeout(() => { chatBody.scrollTop = chatBody.scrollHeight; }, 100);
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('open');
    bubble.style.display = 'flex';
  });

  function setLanguage(code) {
    currentLang = code;
    document.querySelectorAll('.jt-lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.code === code);
    });
  }

  function addBotMsg(html) {
    const div = document.createElement('div');
    div.className = 'jt-chat-msg jt-bot-msg';
    div.innerHTML = `<div class="jt-msg-bubble">${html}</div>`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function addUserMsg(text) {
    const div = document.createElement('div');
    div.className = 'jt-chat-msg jt-user-msg';
    div.innerHTML = `<div class="jt-msg-bubble">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'jt-chat-msg jt-bot-msg';
    div.id = 'jt-typing';
    div.innerHTML = '<div class="jt-msg-bubble"><span class="jt-dot">.</span><span class="jt-dot">.</span><span class="jt-dot">.</span></div>';
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function removeTyping() {
    const typing = document.getElementById('jt-typing');
    if (typing) typing.remove();
  }

  async function sendMessage(text) {
    if (!text) return;

    addUserMsg(text);
    addTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language: currentLang }),
      });
      const data = await res.json();
      removeTyping();
      if (data.reply) {
        addBotMsg(data.reply);
      } else {
        addBotMsg('Sorry, I could not process that. Please try again.');
      }
    } catch (err) {
      removeTyping();
      addBotMsg('Connection error. Please check your internet and try again.');
    }
  }
})();
