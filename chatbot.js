/* ================================
   MathLit Chatbot – Floating Widget
   ================================ */

(function () {
  // ---------- CONFIG ----------
  const CHAT_API = "/api/chat"; // backend endpoint
  const BOT_NAME = "MathLit Buddy";

  // ---------- STYLES ----------
  const style = document.createElement("style");
  style.innerHTML = `
      
  #ml-chat-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 58px;
  height: 58px;
  border-radius: 9999px;

  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 26px;
  cursor: pointer;

  z-index: 10000;

  box-shadow:
    0 10px 30px rgba(15,23,42,0.45),
    0 0 0 0 rgba(99,102,241,0.6);

  animation: chatbotPulse 3s infinite;
}
#ml-chat-box {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 340px;
  max-width: 92vw;
  display: none;
  flex-direction: column;
  border-radius: 1.5rem;

  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  border: 1px solid rgba(99,102,241,0.25);
  box-shadow:
    0 30px 60px rgba(15,23,42,0.45),
    0 0 40px rgba(99,102,241,0.35);

  overflow: hidden;
  z-index: 9999;
  font-family: "Roboto", system-ui, sans-serif;
}

  
      #ml-chat-header {
  background: linear-gradient(135deg, #4f46e5, #7c3aed, #38bdf8);
  color: white;
  padding: 12px 16px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.3px;
  box-shadow: inset 0 -1px 0 rgba(255,255,255,0.25);
}
#ml-chat-messages {
  padding: 14px;
  height: 260px;
  overflow-y: auto;
  font-size: 13px;
  background: transparent;
}

.ml-msg-user {
  align-self: flex-end;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  padding: 8px 12px;
  border-radius: 14px 14px 4px 14px;
  margin-bottom: 8px;
  max-width: 80%;
}

.ml-msg-bot {
  align-self: flex-start;
  background: rgba(241,245,249,0.85);
  color: #1f2937;
  padding: 8px 12px;
  border-radius: 14px 14px 14px 4px;
  margin-bottom: 8px;
  max-width: 80%;
}
#ml-chat-input {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid rgba(99,102,241,0.15);
}

#ml-chat-input input {
  flex: 1;
  border: none;
  background: rgba(255,255,255,0.7);
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 9999px;
  outline: none;
}

#ml-chat-input button {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  border: none;
  padding: 0 16px;
  border-radius: 9999px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

#ml-chat-input button:hover {
  transform: scale(1.05);
}


      @keyframes chatbotPulse {
        0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.6); }
        70%  { box-shadow: 0 0 0 18px rgba(99,102,241,0); }
        100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
      }

    `;
  document.head.appendChild(style);

  // ---------- HTML ----------
  const btn = document.createElement("div");
  btn.id = "ml-chat-btn";
  btn.textContent = "💬";

  const box = document.createElement("div");
  box.id = "ml-chat-box";
  box.innerHTML = `
      <div id="ml-chat-header">${BOT_NAME}</div>
      <div id="ml-chat-messages"></div>
      <div id="ml-chat-input">
        <input type="text" placeholder="Ask a Maths question…" />
        <button>Send</button>
      </div>
    `;

  document.body.appendChild(btn);
  document.body.appendChild(box);

  // ---------- LOGIC ----------
  const messages = box.querySelector("#ml-chat-messages");
  const input = box.querySelector("input");
  const sendBtn = box.querySelector("button");

  function addMsg(text, cls) {
    const div = document.createElement("div");
    div.className = cls;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMsg(text, "ml-msg-user");
    input.value = "";

    try {
      const res = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      addMsg(data.reply || "Sorry, try again", "ml-msg-bot");
      if (data.cooldown || data.openaiRateLimited) {
        setTimeout(() => {
          addMsg("⌛ ਹੁਣ ਤੁਸੀਂ ਦੁਬਾਰਾ ਪੁੱਛ ਸਕਦੇ ਹੋ।", "ml-msg-bot");
        }, 20000);
      }
      
    } catch {
      addMsg("Server not available", "ml-msg-bot");
    }
  }

  btn.onclick = () => {
    box.style.display = box.style.display === "flex" ? "none" : "flex";
  };

  sendBtn.onclick = sendMessage;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Welcome message
  addMsg(
    "I can help with Maths chapters like Integers, Fractions, Decimals, Equations",
    "ml-msg-bot"
  );
})();
