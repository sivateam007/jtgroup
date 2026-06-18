(function () {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/app/chat-widget.css';
  document.head.appendChild(style);

  const messages = [];

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
        <span>JT Guide</span>
        <button id="jt-chat-close">&times;</button>
      </div>
      <div id="jt-chat-body">
        <div class="jt-chat-msg jt-bot-msg">
          <div class="jt-msg-bubble">Hello! 👋 I'm JT Guide. How can I help you today?<br><br>Try asking:<br>• "How do I sign up?"<br>• "What courses do you offer?"<br>• "What is the price?"<br>• "Show me Web Development courses"</div>
        </div>
      </div>
      <div id="jt-chat-input-area">
        <input type="text" id="jt-chat-input" placeholder="Type your message...">
        <button id="jt-chat-send">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const bubble = document.getElementById('jt-chat-bubble');
  const window = document.getElementById('jt-chat-window');
  const closeBtn = document.getElementById('jt-chat-close');
  const input = document.getElementById('jt-chat-input');
  const sendBtn = document.getElementById('jt-chat-send');
  const chatBody = document.getElementById('jt-chat-body');

  bubble.addEventListener('click', () => {
    window.classList.add('open');
    bubble.style.display = 'none';
    setTimeout(() => {
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 100);
  });

  closeBtn.addEventListener('click', () => {
    window.classList.remove('open');
    bubble.style.display = 'flex';
  });

  function addMessage(text, isUser) {
    const div = document.createElement('div');
    div.className = 'jt-chat-msg ' + (isUser ? 'jt-user-msg' : 'jt-bot-msg');
    const bubble = document.createElement('div');
    bubble.className = 'jt-msg-bubble';
    if (isUser) {
      bubble.textContent = text;
    } else {
      bubble.innerHTML = text;
    }
    div.appendChild(bubble);
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

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addMessage(text, true);
    addTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      removeTyping();
      if (data.reply) {
        addMessage(data.reply, false);
      } else {
        addMessage('Sorry, I could not process that. Please try again.', false);
      }
    } catch (err) {
      removeTyping();
      addMessage('Connection error. Please check your internet and try again.', false);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();
