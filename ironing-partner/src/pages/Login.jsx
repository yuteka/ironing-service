import React, { useState } from 'react';
import { ShoppingBag, AlertTriangle, Loader2, User, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login({ loginForm, setLoginForm, handleLogin, loginError, loading }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/25">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Partner Portal</h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Sign in to access your assigned pickups and delivery routes.
          </p>
        </div>

        {/* Login Card Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Username</label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-3.5 text-slate-400" />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-200 rounded-xl text-slate-900 font-bold text-sm outline-none transition-all placeholder:text-slate-400" 
                placeholder="Enter username"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                required 
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3.5 text-slate-400" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-200 rounded-xl text-slate-900 font-bold text-sm outline-none transition-all placeholder:text-slate-400" 
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Message banner */}
          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button 
            type="submit" 
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Sandbox instructions footer */}
        <div className="text-center pt-2 text-[11px] text-slate-400 font-medium">
          <span>Enter your assigned partner credentials to login.</span>
        </div>
      </div>
    </div>
  );
}
