/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import {
  ArrowLeft,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  Mail,
  User,
} from "lucide-react";

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function Signup({ onSignupSuccess = null }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email) e.email = "Email is required";
    else if (!isValidEmail(email)) e.email = "Please enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6)
      e.password = "Password must be at least 6 characters";
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
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      };

      const resp = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setSubmitError(data?.message || "Registration failed");
        return;
      }

      if (data?.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem(
          "currentUser",
          JSON.stringify(data.user)
        );
      }

      if (onSignupSuccess) {
        onSignupSuccess(data.user);
      }

      navigate("/login");
    } catch (err) {
      console.error(err);
      setSubmitError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center px-6 font-sans relative overflow-hidden">
      
      {/* Background Decorative Glow */}
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-green-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Back button */}
      <Link
        to="/login"
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm group z-20"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Login
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        
        <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 border border-green-500/20">
                <CheckCircle size={24} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-gray-500 text-sm mt-1">Join ChatBot today and start exploring.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-400 ml-1">
              Full Name
            </label>
            <div className={`flex items-center bg-black/50 border ${errors.name ? 'border-red-500/50' : 'border-gray-800'} rounded-xl px-4 focus-within:border-green-500/50 transition-all duration-300 shadow-inner`}>
              <User size={18} className="text-gray-600" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(s => ({...s, name: undefined}));
                }}
                placeholder="Hamza"
                className="w-full bg-transparent p-3.5 outline-none text-white text-sm"
              />
            </div>
            {errors.name && <p className="text-red-500 text-[11px] ml-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-400 ml-1">
              Email Address
            </label>
            <div className={`flex items-center bg-black/50 border ${errors.email ? 'border-red-500/50' : 'border-gray-800'} rounded-xl px-4 focus-within:border-green-500/50 transition-all duration-300 shadow-inner`}>
              <Mail size={18} className="text-gray-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(s => ({...s, email: undefined}));
                }}
                placeholder="your@email.com"
                className="w-full bg-transparent p-3.5 outline-none text-white text-sm"
              />
            </div>
            {errors.email && <p className="text-red-500 text-[11px] ml-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-400 ml-1">
              Password
            </label>
            <div className={`flex items-center bg-black/50 border ${errors.password ? 'border-red-500/50' : 'border-gray-800'} rounded-xl px-4 focus-within:border-green-500/50 transition-all duration-300 shadow-inner`}>
              <Lock size={18} className="text-gray-600" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(s => ({...s, password: undefined}));
                }}
                placeholder="********"
                className="w-full bg-transparent p-3.5 outline-none text-white text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-600 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-[11px] ml-1">{errors.password}</p>}
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg text-center">
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-green-900/10 active:scale-[0.98] mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : "Create Account"}
          </button>

        </form>

        {/* Footer Link */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-green-500 hover:text-green-400 font-semibold transition-colors"
          >
            Sign in instead
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Signup;