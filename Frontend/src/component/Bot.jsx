import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import axios from "axios";
import './bot.css';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FaBars, FaTimes, FaPlus, FaCopy,
  FaEdit, FaCheckCircle, FaStop, FaTrash, FaRobot,
  FaDownload, FaImage,
} from "react-icons/fa";
import { FiMoreVertical } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   IMAGE SKELETON — shown while image loads
───────────────────────────────────────────── */
function ImageSkeleton() {
  return (
    <div className="flex flex-col gap-3 max-w-[380px] w-full">
      {/* shimmer card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08]
        bg-[#0d1018] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        style={{ aspectRatio: "1/1" }}>

        {/* shimmer sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent
          -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" />

        {/* center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 border border-emerald-400/20
            flex items-center justify-center
            shadow-[0_0_32px_rgba(74,222,128,0.12)]">
            <FaImage className="text-emerald-400/60 text-xl animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide">Generating image…</p>
          </div>
        </div>

        {/* corner decorations */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-emerald-400/20 rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-emerald-400/20 rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-emerald-400/20 rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-emerald-400/20 rounded-br-lg" />
      </div>

      {/* progress bar */}
      <div className="h-0.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-400/40 to-sky-400/40 rounded-full
          animate-[progress_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
      </div>

      <p className="text-[10px] text-slate-600 italic px-1">
        ✦ Stable Diffusion XL via Cloudflare AI
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   IMAGE MESSAGE — shown after image arrives
───────────────────────────────────────────── */
function ImageMessage({ src, onLoad }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="flex flex-col gap-3 max-w-[380px] w-full">
      <div className="relative group overflow-hidden rounded-2xl
        border border-white/[0.09] shadow-[0_8px_40px_rgba(0,0,0,0.55)]
        bg-[#0d1018]">

        {/* blur-up reveal */}
        <img
          src={src}
          alt="AI Generated"
          className={`w-full h-auto object-cover transition-all duration-700
            ${loaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-sm scale-105"}`}
          onLoad={() => { setLoaded(true); onLoad?.(); }}
        />

        {/* skeleton shown until loaded */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1018]">
            <FaImage className="text-emerald-400/30 text-3xl animate-pulse" />
          </div>
        )}

        {/* hover overlay */}
        {loaded && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            flex items-end justify-end p-3">
            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = src;
                a.download = `ai-image-${Date.now()}.png`;
                a.click();
              }}
              className="flex items-center gap-1.5 text-[11px] font-semibold
                px-3 py-2 rounded-xl
                bg-black/50 backdrop-blur-md border border-white/20
                text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <FaDownload size={10} /> Download
            </button>
          </div>
        )}
      </div>

      {loaded && (
        <p className="text-[10px] text-slate-600 italic px-1 tracking-wider">
          ✦ Generated by Stable Diffusion XL
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CODE BLOCK
───────────────────────────────────────────── */
const CodeBlock = memo(function CodeBlock({ lang, code, isPartial }) {
  const [copied, setCopied] = useState(false);

  const doCopy = () => {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code).then(done);
    else {
      const ta = Object.assign(document.createElement("textarea"), { value: code, style: "position:fixed;opacity:0" });
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta); done();
    }
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/10 bg-[#06080f] w-full shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          </div>
          <span className="text-[11px] font-medium text-sky-400 lowercase tracking-wide ml-1"
            style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            {lang || "code"}
          </span>
          {isPartial && <span className="text-[10px] text-slate-600 animate-pulse">writing…</span>}
        </div>
        {!isPartial && (
          <button onClick={doCopy}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg transition-all duration-150
              ${copied ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20" : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 border border-transparent"}`}>
            {copied ? <><FaCheckCircle size={9} /> Copied!</> : <><FaCopy size={9} /> Copy</>}
          </button>
        )}
      </div>
      <pre className="code-pre px-5 py-4 overflow-x-auto text-[13px] leading-[1.75] text-[#cdd6f4] whitespace-pre m-0"
        style={{ fontFamily: "'JetBrains Mono',monospace" }}>
        {code}
      </pre>
    </div>
  );
});

/* ─────────────────────────────────────────────
   BOT CONTENT
───────────────────────────────────────────── */
function BotContent({ text, streaming }) {
  const clean = text.replace(/^["']+|["']+$/g, "").trim();
  const segments = [];
  const fenceRe = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m;

  while ((m = fenceRe.exec(clean)) !== null) {
    if (m.index > last) segments.push({ t: "md", v: clean.slice(last, m.index) });
    segments.push({ t: "code", lang: m[1] || "code", v: m[2].trimEnd(), partial: false });
    last = fenceRe.lastIndex;
  }

  const trailing = clean.slice(last);
  const openFence = trailing.match(/```(\w*)\n?([\s\S]*?)$/);
  if (streaming && openFence) {
    const before = trailing.slice(0, openFence.index);
    if (before) segments.push({ t: "md", v: before });
    segments.push({ t: "code", lang: openFence[1] || "code", v: openFence[2] || "", partial: true });
  } else if (trailing) {
    segments.push({ t: "md", v: trailing });
  }
  if (!segments.length) segments.push({ t: "md", v: clean });

  const lastIdx = segments.length - 1;
  return (
    <div className="md-prose">
      {segments.map((seg, i) => {
        if (seg.t === "code") return <CodeBlock key={i} lang={seg.lang} code={seg.v} isPartial={seg.partial} />;
        const isLast = i === lastIdx;
        const lines = seg.v.split("\n");
        const textWithout = lines.filter(l => !l.trim().startsWith("💬")).join("\n");
        const followup = lines.find(l => l.trim().startsWith("💬"));
        return (
          <span key={i} className={streaming && isLast ? "k-cursor" : ""}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              code({ inline, children }) {
                if (inline) return (
                  <code className="px-1.5 py-0.5 rounded-md text-[12px] text-sky-300 bg-white/[0.07] border border-white/10"
                    style={{ fontFamily: "'JetBrains Mono',monospace" }}>{children}</code>
                );
                return <code>{children}</code>;
              },
              pre({ children }) { return <>{children}</>; },
            }}>{textWithout}</ReactMarkdown>
            {followup && !streaming && <div className="followup-pill">{followup.trim()}</div>}
          </span>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHIPS
───────────────────────────────────────────── */
const CHIPS = [
  "✦ Explain quantum computing",
  "✦ Draw a cyberpunk city",
  "✦ Who is Babar Azam?",
  "✦ Tell me a fun fact",
];

const BASE = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function Bot() {
  const [messages, setMessages]         = useState([]);
  const [loggedIn, setLoggedIn]         = useState(false);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [openMenuId, setOpenMenuId]     = useState(null);
  const [user, setUser]                 = useState(null);
  const [chats, setChats]               = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [toast, setToast]               = useState({ show: false, msg: "" });
  // Track whether the CURRENT loading request is for an image
  const [generatingImage, setGeneratingImage] = useState(false);

  const msgsRef         = useRef(null);
  const bottomRef       = useRef(null);
  const taRef           = useRef(null);
  const abortRef        = useRef(null);
  const intervalRef     = useRef(null);
  const atBottom        = useRef(true);
  const messagesRef     = useRef([]);
  const activeChatIdRef = useRef(null);
  const navigate        = useNavigate();

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

  const showToast = useCallback((msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2800);
  }, []);

  const onScroll = () => {
    const el = msgsRef.current;
    if (el) atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };
  const snap = useCallback(() => {
    if (atBottom.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => { snap(); }, [messages.length]);

  useEffect(() => {
    const s = localStorage.getItem("currentUser");
    if (s) { setUser(JSON.parse(s)); setLoggedIn(true); }
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const cu = JSON.parse(localStorage.getItem("currentUser"));
      if (!cu) return;
      const { data } = await axios.get(`${BASE}/bot/v1/api/auth/chat/user/${cu.id}`);
      setChats(data);
    } catch (e) { console.error("fetchChats:", e); }
  };

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMessages(prev => { const c = [...prev]; if (c[c.length-1]?.streaming) c[c.length-1].streaming = false; return c; });
    setLoading(false);
    setGeneratingImage(false);
  }, []);

  const streamText = useCallback((fullText) => {
    const hasCode = fullText.includes("```");
    const cpt = hasCode ? 3 : 1;
    const tms = hasCode ? 12 : 28;
    setMessages(prev => [...prev, { text: "", sender: "bot", streaming: true }]);
    atBottom.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    let i = 0;
    intervalRef.current = setInterval(() => {
      i = Math.min(i + cpt, fullText.length);
      setMessages(prev => {
        const c = [...prev];
        const last = c[c.length - 1];
        if (last?.streaming !== undefined) { last.text = fullText.slice(0, i); last.streaming = i < fullText.length; }
        return [...c];
      });
      if (atBottom.current) snap();
      if (i >= fullText.length) { clearInterval(intervalRef.current); setLoading(false); }
    }, tms);
  }, [snap]);

  /* ─────────────────────────────────────────
     DETECT IMAGE REQUEST (mirrors backend logic)
     Only check the user's actual typed text.
  ───────────────────────────────────────── */
  const isImageRequest = (text) => {
    const t = text.toLowerCase().trim();
    const cmds = [
      "generate image", "generate a image", "generate an image",
      "draw ", "draw a ", "draw an ",
      "create image", "create a image", "create an image",
      "make image", "make a image", "make an image",
      "image of ", "picture of ",
      "create picture", "generate picture",
    ];
    return cmds.some(cmd => t.startsWith(cmd));
  };

  /* ── SEND ── */
  const send = async (override) => {
    const text = (override || input).trim();
    if (!text || loading) return;

    atBottom.current = true;
    const cu = JSON.parse(localStorage.getItem("currentUser"));
    const uMsg = { text, sender: "user" };

    // Detect BEFORE sending so we can show skeleton immediately
    const willGenerateImage = isImageRequest(text);

    setMessages(prev => [...prev, uMsg]);
    setInput("");
    if (taRef.current) taRef.current.style.height = "22px";
    setLoading(true);
    setGeneratingImage(willGenerateImage);
    abortRef.current = new AbortController();

    // Build context — only from text messages, not images
    const ctx = messagesRef.current.slice(-10).map(m => {
      if (m.isImage || m.imageGenerating) return `${m.sender === "user" ? "User" : "Bot"}: [Generated an image]`;
      const clean = m.text.split("\n").filter(l => !l.trim().startsWith("💬")).join("\n").trim();
      return `${m.sender === "user" ? "User" : "Bot"}: ${clean}`;
    }).join("\n");

    const finalText = ctx.length ? `${text}\n\n[Prior conversation]\n${ctx}` : text;

    try {
      const { data } = await axios.post(
        `${BASE}/bot/v1/message`,
        { text: finalText, userId: cu?.id },
        { signal: abortRef.current.signal }
      );

      const botReply = data.botMessage;
      const isImage  = !!data.isImage;

      setGeneratingImage(false);

      if (isImage) {
        setMessages(prev => [...prev, { text: botReply, sender: "bot", isImage: true }]);
        setLoading(false);
      } else {
        streamText(botReply);
      }

      if (cu) {
        const bMsg = { text: isImage ? "[AI Generated Image]" : botReply, sender: "bot", isImage };
        const currentChatId = activeChatIdRef.current;

        if (currentChatId) {
          axios.post(`${BASE}/bot/v1/api/auth/chat/save/${currentChatId}`, {
            messages: [uMsg, bMsg],
          }).catch(e => console.error("append:", e));
        } else {
          axios.post(`${BASE}/bot/v1/api/auth/chat/save`, {
            userId: cu.id,
            message: [uMsg, bMsg],
          }).then(r => setActiveChatId(r.data._id))
            .catch(e => console.error("create chat:", e));
        }
        setTimeout(fetchChats, 800);
      }
    } catch (err) {
      setGeneratingImage(false);
      if (!axios.isCancel(err)) { setLoading(false); console.error("send:", err); }
    }
  };

  const onInputChange = (e) => {
    setInput(e.target.value);
    const ta = taRef.current;
    if (ta) { ta.style.height = "22px"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; }
  };
  const onKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const newChat = () => { stop(); setMessages([]); setActiveChatId(null); setInput(""); setSidebarOpen(false); atBottom.current = true; };
  const selChat = (c) => { stop(); setActiveChatId(c._id); setMessages(c.message || []); setSidebarOpen(false); atBottom.current = true; };
  const delChat = async (id) => {
    try {
      await axios.delete(`${BASE}/bot/v1/api/auth/chat/${id}`);
      setChats(p => p.filter(c => c._id !== id));
      if (activeChatId === id) { setMessages([]); setActiveChatId(null); }
      setOpenMenuId(null);
    } catch (e) { console.error("delChat:", e); }
  };
  const logout = () => { stop(); localStorage.clear(); setLoggedIn(false); navigate("/login"); };

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "/" && document.activeElement !== taRef.current) { e.preventDefault(); taRef.current?.focus(); }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); newChat(); }
      if (e.key === "Escape") { setSidebarOpen(false); setOpenMenuId(null); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => { if (!e.target.closest(".k-ctx-menu") && !e.target.closest(".more-btn")) setOpenMenuId(null); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const isStreaming = messages.some(m => m.streaming);

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <>
      {/* Aurora */}
      <div className="k-aurora fixed pointer-events-none z-0"
        style={{
          top: -260, left: "50%", width: 1200, height: 600,
          background: "radial-gradient(ellipse at 30% 55%, rgba(74,222,128,0.08) 0%, transparent 55%),radial-gradient(ellipse at 72% 38%, rgba(56,189,248,0.06) 0%, transparent 52%)",
          filter: "blur(80px)", transform: "translateX(-50%)",
        }}
      />

      <div className="fixed inset-0 flex overflow-hidden bg-[#080b12] text-slate-200" style={{ height: "100dvh" }}>

        {/* ════ SIDEBAR ════ */}
        <aside className={[
          "fixed inset-y-0 left-0 z-[200] w-[272px] flex flex-col",
          "bg-[#090c15]/95 backdrop-blur-2xl border-r border-white/[0.06]",
          "transition-transform duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          sidebarOpen ? "translate-x-0 shadow-[12px_0_60px_rgba(0,0,0,0.7)]" : "-translate-x-full",
          "md:relative md:translate-x-0 md:shadow-none md:flex-shrink-0",
        ].join(" ")}>
          <div className="flex flex-col h-full px-3 pt-5 pb-4">
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400/20 to-sky-400/10 border border-emerald-400/25 flex items-center justify-center shadow-[0_0_16px_rgba(74,222,128,0.12)]">
                  <FaRobot size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[15px] font-bold tracking-tight leading-none">Chat<span className="text-emerald-400">Bot</span></p>
                  <p className="text-[9px] text-slate-600 mt-0.5">Powered by LLaMA</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all active:scale-95">
                <FaTimes size={13} />
              </button>
            </div>

            <button onClick={newChat}
              className="relative flex items-center gap-2.5 w-full px-4 py-3 mb-5 rounded-xl text-[13px] font-semibold text-emerald-400 bg-gradient-to-r from-emerald-400/[0.12] to-emerald-400/[0.04] border border-emerald-400/[0.2] hover:border-emerald-400/[0.5] hover:from-emerald-400/[0.18] hover:shadow-[0_0_32px_rgba(74,222,128,0.16)] transition-all duration-200 active:scale-[0.97] overflow-hidden">
              <div className="w-5 h-5 rounded-lg bg-emerald-400/15 flex items-center justify-center flex-shrink-0"><FaPlus size={9} /></div>
              New Chat
              <span className="ml-auto text-[9px] text-slate-600 font-normal border border-white/[0.08] px-1.5 py-0.5 rounded-md" style={{ fontFamily: "'JetBrains Mono',monospace" }}>⌃⇧P</span>
            </button>

            {chats.length > 0 && (
              <>
                <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-slate-600 px-1 mb-2">Recent Chats</p>
                <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 -mr-1 pr-1">
                  {chats.map(chat => (
                    <div key={chat._id} className="relative">
                      <div
                        className={["flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-[12.5px] border transition-all duration-150",
                          activeChatId === chat._id
                            ? "bg-emerald-400/[0.08] border-emerald-400/[0.2] text-slate-100"
                            : "border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 hover:border-white/[0.06]",
                        ].join(" ")}
                        onClick={() => selChat(chat)}>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeChatId === chat._id ? "bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-slate-700"}`} />
                        <span className="flex-1 min-w-0 truncate">{chat.message?.[0]?.text || "New Conversation"}</span>
                        <button className="more-btn opacity-0 flex-shrink-0 p-1 rounded-lg text-slate-600 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
                          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                          onMouseLeave={e => e.currentTarget.style.opacity = ""}
                          onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === chat._id ? null : chat._id); }}>
                          <FiMoreVertical size={12} />
                        </button>
                      </div>
                      {openMenuId === chat._id && (
                        <div className="k-ctx k-ctx-menu absolute right-0 top-[calc(100%+4px)] w-36 z-[300] bg-[#090c15]/99 backdrop-blur-xl border border-white/[0.1] rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.8)]"
                          onClick={e => e.stopPropagation()}>
                          <button className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-red-400 text-[12.5px] hover:bg-red-500/[0.1] transition-colors"
                            onClick={() => delChat(chat._id)}>
                            <FaTrash size={9} /> Delete Chat
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {loggedIn && (
              <div className="mt-auto pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2.5 px-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400/25 to-sky-400/20 border border-white/[0.12] flex items-center justify-center text-[12px] font-bold text-emerald-400 flex-shrink-0">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-200 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-600">Online</p>
                  </div>
                  <button onClick={logout} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl text-red-400 border border-red-400/20 hover:bg-red-400/[0.1] hover:border-red-400/40 transition-all">Out</button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[150] md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* ════ MAIN ════ */}
        <div className="fixed inset-y-0 left-0 right-0 md:left-[272px] flex flex-col z-10">

          {/* HEADER */}
          <header className="flex-shrink-0 flex items-center justify-between h-[56px] px-4 bg-[#080b12]/90 backdrop-blur-2xl border-b border-white/[0.06] z-[100]">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] transition-all active:scale-95"><FaBars size={16} /></button>
              <Link to="/" className="flex items-center gap-2.5 no-underline group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400/20 to-sky-400/10 border border-emerald-400/20 flex items-center justify-center group-hover:border-emerald-400/40 transition-all">
                  <FaRobot size={13} className="text-emerald-400" />
                </div>
                <span className="text-[17px] font-bold tracking-tight text-slate-100">Chat<span className="text-emerald-400">Bot</span></span>
              </Link>
              <span className="hidden sm:inline text-[9px] font-bold tracking-[0.12em] text-emerald-400 px-2 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">AI</span>
            </div>
            <div className="flex items-center gap-2">
              {loggedIn ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07]">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400/30 to-sky-400/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">{user?.name?.[0]?.toUpperCase() || "U"}</div>
                    <span className="text-[11.5px] font-medium text-slate-400 max-w-[90px] truncate">{user?.name}</span>
                  </div>
                  <button onClick={logout} className="text-[12px] font-semibold px-3.5 py-1.5 rounded-xl text-red-400 border border-red-400/[0.18] bg-transparent hover:bg-red-400/[0.09] hover:border-red-400/40 transition-all active:scale-95">Logout</button>
                </>
              ) : (
                <button onClick={() => navigate("/login")} className="text-[12.5px] font-bold px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-[#20e8b0] text-[#061a0e] hover:shadow-[0_0_28px_rgba(74,222,128,0.45)] transition-all active:scale-95">Login</button>
              )}
            </div>
          </header>

          {/* MESSAGES */}
          <div ref={msgsRef} onScroll={onScroll}
            className="flex-1 overflow-y-auto px-4 py-6"
            style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
            <div className="max-w-[740px] mx-auto w-full flex flex-col gap-6">

              {messages.length > 0 && (
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-2 text-[10px] text-sky-400/80 px-3 py-1.5 rounded-full bg-sky-400/[0.06] border border-sky-400/[0.12]">
                    <span className="k-memd w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                    Memory on · {messages.length} message{messages.length !== 1 ? "s" : ""} in context
                  </span>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="flex flex-col items-center text-center mt-[10vh] gap-6">
                  <div className="k-float relative w-20 h-20 rounded-[24px] bg-gradient-to-br from-emerald-400/[0.14] to-sky-400/[0.08] border border-emerald-400/[0.2] flex items-center justify-center shadow-[0_0_48px_rgba(74,222,128,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <FaRobot className="text-emerald-400 text-[32px]" />
                    <span className="k-ring absolute inset-[-14px] rounded-[32px] border border-emerald-400/[0.07]" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-[28px] font-bold tracking-tight text-slate-100">How can I help?</h2>
                    <p className="text-slate-500 text-[13.5px]">Type anything or pick a suggestion</p>
                  </div>
                  {/* Image generation hint */}
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400/[0.05] border border-emerald-400/[0.12]">
                    <FaImage className="text-emerald-400/60" size={12} />
                    <span className="text-[11.5px] text-slate-500">Try: <span className="text-emerald-400/80 font-medium">"draw a sunset over mountains"</span></span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {CHIPS.map(c => (
                      <button key={c} onClick={() => send(c.replace(/^✦ /, ""))}
                        className="px-4 py-2 rounded-full text-[12.5px] text-slate-400 bg-white/[0.04] border border-white/[0.08] hover:border-emerald-400/35 hover:text-emerald-400 hover:bg-emerald-400/[0.07] transition-all duration-200 active:scale-95">
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`k-msg flex flex-col gap-1.5 ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                    <div className={`flex items-center gap-1.5 px-1 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                      {msg.sender === "bot" && (
                        <div className="w-5 h-5 rounded-lg bg-emerald-400/15 border border-emerald-400/20 flex items-center justify-center">
                          <FaRobot size={9} className="text-emerald-400" />
                        </div>
                      )}
                      <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-slate-600">
                        {msg.sender === "user" ? (user?.name || "You") : "ChatBot"}
                      </span>
                    </div>

                    {msg.sender === "user" ? (
                      <div onClick={() => { setInput(msg.text); taRef.current?.focus(); showToast("Moved to input"); }}
                        className="max-w-[78%] px-4 py-3 cursor-pointer select-none rounded-[22px_22px_6px_22px] text-[14px] leading-relaxed bg-gradient-to-br from-[#1b2e4c] to-[#152038] border border-[#253c5c]/60 text-[#c5d6f2] hover:border-[#3a5a80]/70 hover:from-[#1e3352] active:scale-[0.99] transition-all duration-150 break-words whitespace-pre-wrap shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
                        title="Click to edit">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="max-w-[96%] w-full">
                        <div className="border-l-2 border-emerald-400/[0.18] pl-4 py-0.5">
                          {msg.isImage
                            ? <ImageMessage src={msg.text} onLoad={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })} />
                            : <BotContent text={msg.text} streaming={!!msg.streaming} />
                          }
                        </div>
                      </div>
                    )}

                    <div className={`flex gap-0.5 ${msg.sender === "user" ? "justify-end pr-1" : "justify-start pl-5"}`}>
                      <button onClick={() => { navigator.clipboard?.writeText(msg.isImage ? "[AI Image]" : msg.text); showToast("Copied!"); }}
                        className="flex items-center gap-1.5 text-[11px] text-slate-700 px-2.5 py-1 rounded-lg hover:text-emerald-400 hover:bg-emerald-400/[0.08] transition-all duration-150">
                        <FaCopy size={9} /> Copy
                      </button>
                      {msg.sender === "user" && (
                        <button onClick={() => { setInput(msg.text); taRef.current?.focus(); showToast("Moved to input"); }}
                          className="flex items-center gap-1.5 text-[11px] text-slate-700 px-2.5 py-1 rounded-lg hover:text-sky-400 hover:bg-sky-400/[0.08] transition-all duration-150">
                          <FaEdit size={9} /> Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* ── LOADING STATE ──
                  Show image skeleton if generating image, otherwise typing dots
              ── */}
              {loading && !isStreaming && (
                <div className="flex flex-col items-start gap-1.5">
                  <div className="flex items-center gap-1.5 px-1">
                    <div className="w-5 h-5 rounded-lg bg-emerald-400/15 border border-emerald-400/20 flex items-center justify-center">
                      <FaRobot size={9} className="text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-slate-600">ChatBot</span>
                  </div>
                  <div className="border-l-2 border-emerald-400/[0.18] pl-4 py-0.5">
                    {generatingImage
                      ? <ImageSkeleton />
                      : (
                        <div className="py-1">
                          <div className="flex items-center gap-1.5">
                            <span className="dot-1 w-2 h-2 rounded-full bg-emerald-400 opacity-50 inline-block" />
                            <span className="dot-2 w-2 h-2 rounded-full bg-sky-400 opacity-50 inline-block" />
                            <span className="dot-3 w-2 h-2 rounded-full bg-emerald-400 opacity-50 inline-block" />
                          </div>
                        </div>
                      )
                    }
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* FOOTER */}
          <footer className="safe-pb flex-shrink-0 px-4 pt-3 bg-[#080b12]/98 backdrop-blur-2xl border-t border-white/[0.05]">
            <div className="max-w-[740px] mx-auto">
              {loading && (
                <div className="flex justify-center mb-3">
                  <button onClick={stop}
                    className="flex items-center gap-2 text-[12px] font-medium text-red-400 px-4 py-2 rounded-xl bg-red-400/[0.07] border border-red-400/[0.16] hover:bg-red-400/[0.14] hover:border-red-400/40 transition-all active:scale-95">
                    <FaStop size={9} /> {generatingImage ? "Cancel image" : "Stop generating"}
                  </button>
                </div>
              )}
              <div className="flex items-end gap-3">
                <div className="flex-1 flex items-end gap-2 bg-[#0f1420] border border-white/[0.09] rounded-[18px] px-4 py-3 focus-within:border-emerald-400/35 focus-within:shadow-[0_0_0_3px_rgba(74,222,128,0.07),0_0_40px_rgba(74,222,128,0.04)] transition-all duration-200 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                  <textarea
                    ref={taRef}
                    value={input}
                    onChange={onInputChange}
                    onKeyDown={onKeyDown}
                    placeholder='Ask anything… or "draw a robot" for images'
                    rows={1}
                    style={{ height: "22px", fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "16px" }}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-slate-100 leading-[1.55] placeholder-slate-600 caret-emerald-400 max-h-[140px] min-h-[22px] overflow-y-auto"
                  />
                </div>
                <button onClick={() => send()} disabled={!input.trim() || loading}
                  className="flex-shrink-0 flex items-center gap-2 text-[13px] font-bold px-5 py-[11px] rounded-[14px] bg-gradient-to-br from-emerald-400 to-[#1de4a5] text-[#051a0e] hover:shadow-[0_0_32px_rgba(74,222,128,0.5)] hover:-translate-y-px active:scale-[0.95] disabled:from-[#181f2e] disabled:to-[#181f2e] disabled:text-slate-600 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed transition-all duration-200">
                  Send →
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-700 mt-2.5 pb-0.5">
                Powered by LLaMA + Stable Diffusion · AI can make mistakes
              </p>
            </div>
          </footer>
        </div>
      </div>

      {toast.show && (
        <div className="k-toast fixed bottom-[82px] left-1/2 z-[999] pointer-events-none flex items-center gap-2 text-[12px] font-medium text-emerald-400 px-5 py-2.5 rounded-full bg-emerald-400/[0.09] backdrop-blur-xl border border-emerald-400/[0.22] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <FaCheckCircle size={10} /> {toast.msg}
        </div>
      )}
    </>
  );
}