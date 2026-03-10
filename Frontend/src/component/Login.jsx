import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn, Mail, Lock, EyeOff, Eye } from "lucide-react";
import { API_BASE } from "../config.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Login = ({ onLoginSuccess = null }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const e = {};
    if (!email) e.email = "Email is required";
    else if (!isValidEmail(email)) e.email = "Invalid email";

    if (!password) e.password = "Password is required";

    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitError("");

    const validation = validate();
    setErrors(validation);

    if (Object.keys(validation).length) return;

    setLoading(true);

    try {
      const payload = { email: email.trim().toLowerCase(), password };

      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await resp.json();
      } catch {}

      if (!resp.ok) {
        setSubmitError(data?.message || "Login failed");
        return;
      }

      if (data?.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem(
          "currentUser",
          JSON.stringify(data.user || { email: payload.email })
        );

        const user = data.user || { email: payload.email };

        window.dispatchEvent(
          new CustomEvent("authChanged", { detail: { user } })
        );

        if (typeof onLoginSuccess === "function") onLoginSuccess(user);

        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Login error", err);
      setSubmitError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center px-6 font-sans">
      
      {/* Background Decorative Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-green-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Back button */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        
        <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 border border-green-500/20">
                <LogIn size={24} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-sm mt-1">Please enter your details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-400 ml-1">
              Email Address
            </label>

            <div className={`flex items-center bg-black/50 border ${errors.email ? 'border-red-500/50' : 'border-gray-800'} rounded-xl px-4 focus-within:border-green-500/50 transition-all duration-300 shadow-inner`}>
              <Mail size={18} className="text-gray-600" />
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full bg-transparent p-3.5 outline-none text-white text-sm"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((s) => ({ ...s, email: undefined }));
                }}
              />
            </div>

            {errors.email && (
              <p className="text-red-500 text-[12px] mt-1 ml-1 animate-pulse">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-400 ml-1">
              Password
            </label>

            <div className={`flex items-center bg-black/50 border ${errors.password ? 'border-red-500/50' : 'border-gray-800'} rounded-xl px-4 focus-within:border-green-500/50 transition-all duration-300 shadow-inner`}>
              <Lock size={18} className="text-gray-600" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-transparent p-3.5 outline-none text-white text-sm"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((s) => ({ ...s, password: undefined }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-gray-600 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-[12px] mt-1 ml-1 animate-pulse">{errors.password}</p>
            )}
          </div>

          {/* Global Submit Error */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg text-center">
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-green-900/10 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : "Sign In"}
          </button>

        </form>

        {/* Footer Link */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          New to ChatBot?{" "}
          <Link
            to="/signup"
            className="text-green-500 hover:text-green-400 font-semibold transition-colors"
          >
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;