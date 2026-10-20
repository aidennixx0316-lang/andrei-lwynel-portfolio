/* ===== Settings ===== */
const CONFIG = {
  // Optional: URL of your own backend that calls an AI model and returns { reply: "..." }.
  // Never put an API key in this file. Leave empty to use the built-in answers below.
  apiEndpoint: ""
};
 
/* ===== About Andrei: edit these facts to teach the chatbot more ===== */
const ABOUT = {
  name: "Andrei Lwynel Barican",
  school: "Philippine Christian University",
  program: "BSIT (Bachelor of Science in Information Technology)",
  year: "3rd year",
  honors: "He was a Dean's Lister in his first year.",
  org: "In his second year he was a Creatives member of the Junior Philippines Computer Society (JPCS)."
};
 
const TOPICS = [
  { keys: ["name", "who are", "who is", "andrei"],
    reply: `${ABOUT.name} is a ${ABOUT.year} ${ABOUT.program} student at ${ABOUT.school}.` },
  { keys: ["school", "university", "college", "study", "studying", "pcu"],
    reply: `He studies at ${ABOUT.school}.` },
  { keys: ["course", "program", "bsit", "major", "degree"],
    reply: `He is taking ${ABOUT.program}.` },
  { keys: ["year", "level", "grade"],
    reply: `He is currently in ${ABOUT.year}.` },
  { keys: ["dean", "lister", "honor", "award", "achievement", "academic"],
    reply: ABOUT.honors },
  { keys: ["jpcs", "creative", "org", "organization", "society", "club"],
    reply: ABOUT.org },
  { keys: ["skill", "tech", "know", "language", "work with"],
    reply: "He works with HTML, CSS and JavaScript, and has a creative side from his time in JPCS Creatives." },
  { keys: ["contact", "email", "reach", "hire", "message"],
    reply: "Use the Email button in the Contact section at the bottom of this page." },
  { keys: ["hi", "hello", "hey"],
    reply: "Hi! Ask me anything about Andrei's studies, achievements or organizations." }
];
const QUICK = ["Who is Andrei?", "Where does he study?", "Any achievements?", "What did he do in JPCS?"];
 
/* ===== Footer year ===== */
document.getElementById("year").textContent = new Date().getFullYear();
 
/* ===== Profile photo with fallback ===== */
const img = document.querySelector("#photo img");
img.addEventListener("error", () => {
  const box = document.createElement("div");
  box.className = "initials";
  box.textContent = "AB";
  img.replaceWith(box);
});
 
/* ===== Timeline reveal (answers scrolling) ===== */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add("in"), i * 150);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll(".timeline li").forEach((li) => io.observe(li));
 
/* ===== Animated network background ===== */
(function network() {
  const canvas = document.getElementById("net");
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mouse = { x: -999, y: -999 };
  let w, h, dots;
 
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    const count = Math.min(90, Math.floor(innerWidth / 14));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .5 * dpr, vy: (Math.random() - .5) * .5 * dpr,
      gold: Math.random() < .12
    }));
  }
  addEventListener("resize", resize);
  addEventListener("mousemove", (e) => {
    const dpr = window.devicePixelRatio || 1;
    mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr;
  });
  resize();
 
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const reach = 150 * (window.devicePixelRatio || 1);
    for (const d of dots) {
      if (!reduce) { d.x += d.vx; d.y += d.vy; }
      if (d.x < 0 || d.x > w) d.vx *= -1;
      if (d.y < 0 || d.y > h) d.vy *= -1;
    }
    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];
      for (let j = i + 1; j < dots.length; j++) {
        const b = dots[j], dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < reach) {
          ctx.strokeStyle = `rgba(77,227,209,${(1 - dist / reach) * .25})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const m = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (m < reach * 1.3) {
        ctx.strokeStyle = `rgba(255,201,60,${(1 - m / (reach * 1.3)) * .5})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = a.gold ? "#ffc93c" : "#4de3d1";
      ctx.beginPath(); ctx.arc(a.x, a.y, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  draw();
})();
 
/* ===== Chatbot ===== */
(function chatbot() {
  const chat = document.getElementById("chat");
  const fab = document.getElementById("chatFab");
  const msgs = document.getElementById("msgs");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const quick = document.getElementById("quick");
  const history = [];
 
  function add(text, who) {
    const el = document.createElement("div");
    el.className = "msg " + who;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }
 
  function localAnswer(q) {
    const text = q.toLowerCase();
    const hit = TOPICS.find((t) => t.keys.some((k) => text.includes(k)));
    return hit ? hit.reply
      : "I only know about Andrei's studies, achievements and organizations. Try asking where he studies or what he did in JPCS.";
  }
 
  async function answer(q) {
    if (!CONFIG.apiEndpoint) return localAnswer(q);
    try {
      const res = await fetch(CONFIG.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, about: ABOUT })
      });
      const data = await res.json();
      return data.reply || localAnswer(q);
    } catch (err) {
      return localAnswer(q);
    }
  }
 
  async function ask(q) {
    if (!q.trim()) return;
    add(q, "me");
    history.push({ role: "user", content: q });
    const typing = add("Typing…", "bot");
    const reply = await answer(q);
    await new Promise((r) => setTimeout(r, 450));
    typing.textContent = reply;
    history.push({ role: "assistant", content: reply });
  }
 
  function open() {
    chat.hidden = false; fab.hidden = true; input.focus();
    if (!msgs.children.length) add("Hi! I'm Andrei's assistant. What would you like to know about him?", "bot");
  }
  function close() { chat.hidden = true; fab.hidden = false; fab.focus(); }
 
  QUICK.forEach((q) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = q;
    b.addEventListener("click", () => ask(q));
    quick.appendChild(b);
  });
  fab.addEventListener("click", open);
  document.getElementById("openChat").addEventListener("click", open);
  document.getElementById("chatClose").addEventListener("click", close);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !chat.hidden) close(); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value; input.value = "";
    ask(q);
  });
})();
 