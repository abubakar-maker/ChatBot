import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FaUserCircle, FaBars, FaTimes, FaPlus, FaCopy, FaEdit, FaCheckCircle, FaStop } from "react-icons/fa";
import { FiMoreVertical } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
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
  
  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: "" });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Refs for stopping functionality
  const abortControllerRef = useRef(null);
  const streamingIntervalRef = useRef(null);

  /* ---------------- Helpers ---------------- */
  
  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const copyToClipboard = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  const handleEditMessage = (text) => {
    setInput(text);
    inputRef.current?.focus();
    showToast("Message moved to input for editing");
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }
    setLoading(false);
  };

  /* ---------------- Messaging ---------------- */

  const handleSendMessage = async (customText) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    // Restart logic: if already loading, kill the old one
    if (loading) {
      handleStopGenerating();
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const userMessage = { text: textToSend, sender: "user" };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/bot/v1/message`, { 
        text: userMessage.text,
        userId: currentUser?.id 
      }, {
        signal: abortControllerRef.current.signal
      });
      
      // We do NOT set loading false here; showBotMessageStreaming will handle it.
      showBotMessageStreaming(res.data.botMessage);

      if (currentUser) {
        const botMsg = { text: res.data.botMessage, sender: "bot" };
        if (activeChatId) {
          await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/bot/v1/api/auth/chat/save/${activeChatId}`, { messages: [userMessage, botMsg] });
        } else {
          const newChatRes = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/bot/v1/api/auth/chat/save`, {
            userId: currentUser.id,
            message: [userMessage, botMsg],
          });
          setActiveChatId(newChatRes.data._id);
        }
        loadChats();
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Request canceled");
      } else {
        setLoading(false);
        console.log("Error:", error);
      }
    }
  };

  const showBotMessageStreaming = (fullText) => {
    let index = 0;
    setMessages((prev) => [...prev, { text: "", sender: "bot" }]);
    
    if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);

    streamingIntervalRef.current = setInterval(() => {
      index++;
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].text = fullText.slice(0, index);
        }
        return updated;
      });

      if (index === fullText.length) {
        clearInterval(streamingIntervalRef.current);
        setLoading(false); // Button disappears ONLY when typing is done
      }
    }, 22);
  };

  /* ---------------- Shortcuts & Loaders ---------------- */
  useEffect(() => {
    const handleShortcuts = (e) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/bot/v1/api/auth/chat/user/${currentUser.id}`);
      setChats(res.data);
    } catch (error) { console.log(error); }
  };

  const handleNewChat = () => { 
    handleStopGenerating();
    setMessages([]); 
    setActiveChatId(null); 
    setInput(""); 
    setIsSidebarOpen(false); 
  };

  const handleLogout = () => { 
    handleStopGenerating();
    localStorage.clear(); 
    setLoggedIn(false); 
    navigate("/login"); 
  };

  const handleSelectChat = (chat) => { 
    handleStopGenerating();
    setActiveChatId(chat._id); 
    setMessages(chat.message || []); 
    setIsSidebarOpen(false); 
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/bot/v1/api/auth/chat/${chatId}`);
      setChats((prev) => prev.filter((chat) => chat._id !== chatId));
      if (activeChatId === chatId) { setMessages([]); setActiveChatId(null); }
      setOpenMenuId(null);
    } catch (error) { console.log(error); }
  };

  return (
    <div className="flex h-screen bg-[#0b0b0b] text-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111] border-r border-gray-800 flex flex-col p-4 transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:static md:translate-x-0 md:flex`}>
        <div className="flex justify-between items-center md:hidden mb-6">
          <span className="font-bold text-green-500">History</span>
          <button onClick={() => setIsSidebarOpen(false)}><FaTimes size={20} /></button>
        </div>

        <div className="relative group mt-14 md:mt-20">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500/20 to-green-500/5 border border-green-500/20 text-white py-3 rounded-xl hover:scale-[1.02] transition-all active:scale-95"
          >
            <FaPlus size={14} /> New Chat
          </button>
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-700 z-50">
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
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white"><FaBars size={22} /></button>
            <Link to="/" className="text-xl font-bold tracking-tighter">Chat<span className="text-green-500">Bot</span></Link>
          </div>
          <div className="flex items-center gap-4">
            {loggedIn && <span className="hidden sm:block text-[11px] font-medium bg-gray-800 px-3 py-1 rounded-full">{user?.name}</span>}
            <button onClick={loggedIn ? handleLogout : () => navigate("/login")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${loggedIn ? "text-red-500 hover:bg-red-500/10" : "bg-green-500 text-black"}`}>{loggedIn ? "Logout" : "Login"}</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center mt-32 text-gray-500">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20"><span className="text-2xl">🤖</span></div>
                <h2 className="text-2xl font-bold text-white">How can I help you?</h2>
                <p className="text-gray-500 text-sm mt-2">Type "/" to focus the input field.</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`group flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div 
                    onClick={() => msg.sender === "user" && handleEditMessage(msg.text)}
                    className={`relative group max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed cursor-pointer transition-all ${
                    msg.sender === "user" ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-gray-800/50 text-gray-200 border border-gray-700/50"
                  }`}>
                    {msg.text}
                    
                    <div className={`absolute -top-8 ${msg.sender === "user" ? "right-0" : "left-0"} hidden group-hover:flex gap-2 bg-[#1a1a1a] border border-gray-800 p-1 rounded-lg shadow-2xl`}>
                      <button onClick={(e) => copyToClipboard(e, msg.text)} className="p-1.5 hover:text-green-500 transition-colors" title="Copy"><FaCopy size={12}/></button>
                      {msg.sender === "user" && <button className="p-1.5 hover:text-blue-400 transition-colors" title="Edit"><FaEdit size={12}/></button>}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
            {loading && <div className="text-gray-500 text-xs animate-pulse flex items-center gap-2 px-4"><span>●</span><span>●</span><span>●</span></div>}
          </div>
        </main>

        {toast.show && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xl animate-bounce z-50">
            <FaCheckCircle /> {toast.message}
          </div>
        )}

        <footer className="p-4 bg-[#0b0b0b]">
          <div className="max-w-3xl mx-auto relative">
            
            {/* STOP BUTTON */}
            {loading && (
              <button 
                onClick={handleStopGenerating}
                className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#151515] border border-gray-800 text-gray-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-500/10 hover:text-red-500 transition-all shadow-2xl z-40"
              >
                <FaStop size={10} className="text-red-500" /> Stop Generating
              </button>
            )}

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
                onClick={() => handleSendMessage()} 
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                {loading ?"Ø" : "Send"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Bot;