/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { ArrowLeft, Sparkles, Lock, Eye, EyeOff, Mail, User } from "lucide-react";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/*
 * AUTH_CSS is identical to Login.jsx — if both pages are in the same app,
 * the <style id="auth-styles"> is only injected once (idempotent check).
 */
const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #08090d;
    --surface:   #0e1017;
    --surface2:  #13161f;
    --border:    rgba(255,255,255,0.07);
    --border-hi: rgba(255,255,255,0.14);
    --accent:    #4fffb0;
    --accent2:   #3de8fe;
    --accent-dim:rgba(79,255,176,0.10);
    --text:      #e8eaf0;
    --muted:     #5a5f72;
    --danger:    #ff5a6e;
  }

  html, body, #root { height: 100%; background: var(--bg); }

  .auth-noise::after {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    background-size: 180px; opacity: 0.4;
  }

  .auth-aurora {
    position: fixed; top: -180px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 420px; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse at 35% 50%, rgba(79,255,176,0.09) 0%, transparent 60%),
      radial-gradient(ellipse at 72% 38%, rgba(61,232,254,0.06) 0%, transparent 55%);
    filter: blur(55px);
    animation: auroraShift 12s ease-in-out infinite alternate;
  }
  @keyframes auroraShift {
    0%   { transform: translateX(-50%) scale(1);   opacity: 0.6; }
    100% { transform: translateX(-45%) scale(1.1); opacity: 1;   }
  }

  .auth-glow-br {
    position: fixed; bottom: -80px; right: -80px;
    width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(61,232,254,0.05), transparent 70%);
    filter: blur(60px); pointer-events: none; z-index: 0;
    animation: glowPulse 8s ease-in-out infinite alternate;
  }
  @keyframes glowPulse { 0% { opacity: 0.5; } 100% { opacity: 1; } }

  .auth-card {
    width: 100%; max-width: 420px;
    background: rgba(14,16,23,0.85);
    backdrop-filter: blur(28px) saturate(160%);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2.25rem 2rem;
    position: relative; z-index: 10;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04) inset;
    animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(28px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }

  .auth-card::before {
    content: '';
    position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent), var(--accent2), transparent);
    border-radius: 99px; opacity: 0.5;
  }

  .auth-icon-wrap {
    width: 52px; height: 52px; border-radius: 14px;
    background: var(--accent-dim);
    border: 1px solid rgba(79,255,176,0.2);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.1rem;
    animation: iconFloat 4s ease-in-out infinite;
    position: relative;
  }
  .auth-icon-wrap::after {
    content: '';
    position: absolute; inset: -7px; border-radius: 20px;
    border: 1px solid rgba(79,255,176,0.08);
    animation: iconRing 4s ease-in-out infinite;
  }
  @keyframes iconFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes iconRing  { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0; transform: scale(1.15); } }

  .auth-field {
    display: flex; align-items: center; gap: 10px;
    background: rgba(0,0,0,0.35);
    border: 1px solid var(--border);
    border-radius: 11px;
    padding: 0 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .auth-field:focus-within {
    border-color: rgba(79,255,176,0.35);
    box-shadow: 0 0 0 3px rgba(79,255,176,0.06);
  }
  .auth-field.err { border-color: rgba(255,90,110,0.4); }
  .auth-field input {
    flex: 1; background: transparent; border: none; outline: none;
    color: var(--text); font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; padding: 13px 0;
    caret-color: var(--accent);
  }
  .auth-field input::placeholder { color: var(--muted); }

  .auth-label {
    display: block; font-size: 12px; font-weight: 500;
    color: var(--muted); margin-bottom: 7px; letter-spacing: 0.02em;
    font-family: 'DM Sans', sans-serif;
  }

  .auth-err-text {
    font-size: 11.5px; color: var(--danger);
    margin-top: 5px; font-family: 'DM Sans', sans-serif;
    animation: errShake 0.3s ease;
  }
  @keyframes errShake {
    0%,100% { transform: translateX(0); }
    25%      { transform: translateX(-4px); }
    75%      { transform: translateX(4px); }
  }

  .auth-btn {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, var(--accent), #1de4a5);
    border: none; border-radius: 11px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    color: #061a0e; letter-spacing: 0.2px;
    position: relative; overflow: hidden;
    transition: all 0.2s ease;
  }
  .auth-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: rgba(255,255,255,0.18);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.4s ease;
  }
  .auth-btn:hover::after { transform: scaleX(1); }
  .auth-btn:hover { box-shadow: 0 0 28px rgba(79,255,176,0.35); }
  .auth-btn:active { transform: scale(0.97); }
  .auth-btn:disabled {
    background: var(--surface2); color: var(--muted);
    border: 1px solid var(--border); cursor: not-allowed; box-shadow: none;
  }

  .auth-submit-err {
    background: rgba(255,90,110,0.08);
    border: 1px solid rgba(255,90,110,0.2);
    color: var(--danger); font-size: 12.5px;
    padding: 10px 14px; border-radius: 9px; text-align: center;
    font-family: 'DM Sans', sans-serif;
    animation: cardIn 0.3s ease;
  }

  .auth-back {
    display: inline-flex; align-items: center; gap: 7px;
    position: absolute; top: 28px; left: 28px; z-index: 20;
    color: var(--muted); font-size: 13px;
    text-decoration: none; font-family: 'DM Sans', sans-serif;
    transition: color 0.2s;
  }
  .auth-back:hover { color: var(--text); }
  .auth-back svg { transition: transform 0.2s; }
  .auth-back:hover svg { transform: translateX(-3px); }

  .auth-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(6,26,14,0.3);
    border-top-color: #061a0e;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .auth-footer-link { color: var(--accent); font-weight: 600; text-decoration: none; transition: color 0.2s; }
  .auth-footer-link:hover { color: var(--accent2); }

  .auth-card > * { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  .auth-card > *:nth-child(1) { animation-delay: 0.08s; }
  .auth-card > *:nth-child(2) { animation-delay: 0.14s; }
  .auth-card > *:nth-child(3) { animation-delay: 0.20s; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }

  .icon-accent { color: var(--accent); }
  .icon-muted  { color: var(--muted);  }

  /* password strength bar (signup only) */
  .strength-bar {
    height: 3px; border-radius: 99px; margin-top: 8px;
    background: var(--surface2); overflow: hidden;
  }
  .strength-fill {
    height: 100%; border-radius: 99px;
    transition: width 0.4s ease, background 0.4s ease;
  }
`;

const getStrength = (pw) => {
  if (!pw) return { width: "0%", color: "transparent", label: "" };
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { width: "20%", color: "#ff5a6e", label: "Weak" };
  if (score <= 2) return { width: "45%", color: "#f5a623", label: "Fair" };
  if (score <= 3) return { width: "70%", color: "#4fffb0", label: "Good" };
  return           { width: "100%", color: "#3de8fe", label: "Strong" };
};

function Signup({ onSignupSuccess = null }) {
  const navigate = useNavigate();

  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]             = useState({});
  const [submitError, setSubmitError]   = useState("");
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (!document.getElementById("auth-styles")) {
      const style = document.createElement("style");
      style.id = "auth-styles";
      style.textContent = AUTH_CSS;
      document.head.appendChild(style);
    }
  }, []);

  const validate = () => {
    const e = {};
    if (!name.trim())    e.name = "Name is required";
    if (!email)          e.email = "Email is required";
    else if (!isValidEmail(email)) e.email = "Enter a valid email";
    if (!password)       e.password = "Password is required";
    else if (password.length < 6) e.password = "At least 6 characters";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitError("");
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    setLoading(true);

    try {
      const payload = { name: name.trim(), email: email.trim().toLowerCase(), password };
      const resp = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) { setSubmitError(data?.message || "Registration failed"); return; }
      if (data?.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
      }
      if (onSignupSuccess) onSignupSuccess(data.user);
      navigate("/login");
    } catch (err) {
      console.error(err);
      setSubmitError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(password);

  return (
    <div
      className="auth-noise"
      style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem", position: "relative", overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div className="auth-aurora" />
      <div className="auth-glow-br" />

      <Link to="/login" className="auth-back">
        <ArrowLeft size={15} /> Back to Login
      </Link>

      <div className="auth-card">
        {/* header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div className="auth-icon-wrap">
            <Sparkles size={22} className="icon-accent" />
          </div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px", marginBottom: 5 }}>
            Create Account
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Join ChatBot and start exploring</p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* name */}
          <div>
            <label className="auth-label">Full Name</label>
            <div className={`auth-field ${errors.name ? "err" : ""}`}>
              <User size={16} className="icon-muted" />
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(s => ({ ...s, name: undefined })); }}
              />
            </div>
            {errors.name && <p className="auth-err-text">{errors.name}</p>}
          </div>

          {/* email */}
          <div>
            <label className="auth-label">Email Address</label>
            <div className={`auth-field ${errors.email ? "err" : ""}`}>
              <Mail size={16} className="icon-muted" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(s => ({ ...s, email: undefined })); }}
              />
            </div>
            {errors.email && <p className="auth-err-text">{errors.email}</p>}
          </div>

          {/* password */}
          <div>
            <label className="auth-label">Password</label>
            <div className={`auth-field ${errors.password ? "err" : ""}`}>
              <Lock size={16} className="icon-muted" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(s => ({ ...s, password: undefined })); }}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 0 }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* strength bar */}
            {password && (
              <div>
                <div className="strength-bar">
                  <div className="strength-fill" style={{ width: strength.width, background: strength.color }} />
                </div>
                <p style={{ fontSize: 11, color: strength.color, marginTop: 4, fontFamily: "'DM Sans',sans-serif", transition: "color 0.4s" }}>
                  {strength.label}
                </p>
              </div>
            )}
            {errors.password && <p className="auth-err-text">{errors.password}</p>}
          </div>

          {/* global error */}
          {submitError && <div className="auth-submit-err">{submitError}</div>}

          {/* submit */}
          <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop: "0.25rem" }}>
            {loading
              ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span className="auth-spinner" /> Creating account…</span>
              : "Create Account →"
            }
          </button>
        </form>

        {/* footer */}
        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--muted)", fontSize: 13 }}>
          Already have an account?{" "}
          <Link to="/login" className="auth-footer-link">Sign in instead</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;