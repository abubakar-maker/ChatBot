import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaUserCircle, FaBars, FaTimes, FaPlus } from "react-icons/fa";
import { FiMoreVertical } from "react-icons/fi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "../index.css";

function Bot() {
  const [messages, setMessages] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  /* ---------------- Shortcuts ---------------- */
  useEffect(() => {
    const handleShortcuts = (e) => {
      // Focus input with "/"
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // New chat with Ctrl + Shift + P
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, []); // Logic remains the same but ensured it's clean

  /* ---------------- Auto Scroll ---------------- */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  /* ---------------- Auth & Load ---------------- */
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoggedIn(true);
    }
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) return;
      const res = await axios.get(`http://localhost:4002/bot/v1/api/auth/chat/user/${currentUser.id}`);
      setChats(res.data);
    } catch (error) {
      console.log("Error loading chats:", error);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
    setInput("");
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await axios.delete(`http://localhost:4002/bot/v1/api/auth/chat/${chatId}`);
      setChats((prev) => prev.filter((chat) => chat._id !== chatId));
      if (activeChatId === chatId) {
        setMessages([]);
        setActiveChatId(null);
      }
      setOpenMenuId(null);
    } catch (error) {
      console.log("Delete Error", error);
    }
  };

  const handleSelectChat = (chat) => {
    setActiveChatId(chat._id);
    setMessages(chat.message || []);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    setLoggedIn(false);
    navigate("/login");
  };

  /* ---------------- Messaging ---------------- */
  const showBotMessageStreaming = (fullText) => {
    let index = 0;
    setMessages((prev) => [...prev, { text: "", sender: "bot" }]);
    const interval = setInterval(() => {
      index++;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].text = fullText.slice(0, index);
        return updated;
      });
      if (index === fullText.length) clearInterval(interval);
    }, 22);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const userMessage = { text: input, sender: "user" };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:4002/bot/v1/message", { text: userMessage.text });
      setLoading(false);
      showBotMessageStreaming(res.data.botMessage);

      if (currentUser) {
        const botMsg = { text: res.data.botMessage, sender: "bot" };
        if (activeChatId) {
          await axios.post(`http://localhost:4002/bot/v1/api/auth/chat/save/${activeChatId}`, { messages: [userMessage, botMsg] });
        } else {
          const newChatRes = await axios.post("http://localhost:4002/bot/v1/api/auth/chat/save", {
            userId: currentUser.id,
            message: [userMessage, botMsg],
          });
          setActiveChatId(newChatRes.data._id);
        }
      }
      loadChats();
    } catch (error) {
      setLoading(false);
      console.log("Error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0b0b] text-white font-sans overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#111] border-r border-gray-800 flex flex-col p-4 transform transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:static md:translate-x-0 md:flex
      `}>
        <div className="flex justify-between items-center md:hidden mb-6">
          <span className="font-bold text-green-500">History</span>
          <button onClick={() => setIsSidebarOpen(false)}><FaTimes size={20} /></button>
        </div>

        {/* NEW CHAT BUTTON WITH TOOLTIP */}
        <div className="relative group mt-14 md:mt-20">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500/20 to-green-500/5 border border-green-500/20 text-white py-3 rounded-xl hover:scale-[1.02] transition-all active:scale-95"
          >
            <FaPlus size={14} /> New Chat
          </button>
          {/* Tooltip */}
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700">
            Shortcut: Ctrl + Shift + P
          </span>
        </div>

        <h2 className="text-xs font-bold text-gray-500 mt-8 mb-4 uppercase tracking-widest">Recent Chats</h2>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {chats.map((chat) => (
            <div key={chat._id} className="relative group">
              <div
                onClick={() => handleSelectChat(chat)}
                className={`p-3 rounded-lg text-sm cursor-pointer transition-all flex justify-between items-center ${
                  activeChatId === chat._id ? "bg-gray-800 border border-gray-700 text-white" : "hover:bg-gray-900 text-gray-400"
                }`}
              >
                <span className="truncate flex-1">{chat.message?.[0]?.text || "New Conversation"}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === chat._id ? null : chat._id); }}
                  className="ml-2 opacity-0 group-hover:opacity-100 p-1 hover:text-white"
                >
                  <FiMoreVertical />
                </button>
              </div>

              {/* DELETE MENU */}
              {openMenuId === chat._id && (
                <div className="absolute right-0 mt-1 w-32 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-2xl z-50">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat._id); }}
                    className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg"
                  >
                    Delete Chat
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-gray-800 bg-[#0b0b0b]/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white">
              <FaBars size={22} />
            </button>
            <Link to="/" className="text-xl font-bold tracking-tighter">
              Chat<span className="text-green-500">Bot</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {loggedIn && <span className="hidden sm:block text-[11px] font-medium bg-gray-800 px-3 py-1 rounded-full">{user?.name}</span>}
            <button
              onClick={loggedIn ? handleLogout : () => navigate("/login")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${loggedIn ? "text-red-500 hover:bg-red-500/10" : "bg-green-500 text-black"}`}
            >
              {loggedIn ? "Logout" : "Login"}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8" ref={messagesEndRef}>
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center mt-32">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                    <span className="text-2xl">🤖</span>
                </div>
                <h2 className="text-2xl font-bold">How can I help you?</h2>
                <p className="text-gray-500 text-sm mt-2">Type "/" to focus the input field.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "bg-gray-800/50 text-gray-200 border border-gray-700/50"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {loading && <div className="text-gray-500 text-xs animate-pulse flex items-center gap-2"><span>●</span><span>●</span><span>●</span></div>}
          </div>
        </main>

        <footer className="p-4 bg-[#0b0b0b]">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-[#181818] border border-gray-800 rounded-2xl p-1.5 focus-within:border-green-500/40 transition-all shadow-xl">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent outline-none text-white px-4 py-2 text-sm"
                placeholder="Ask ChatBot... ( / )"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                Send
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Bot;