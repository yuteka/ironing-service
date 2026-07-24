import React, { useState } from 'react';
import { ShoppingBag, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login({ loginForm, setLoginForm, handleLogin, loginError, loading }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/25">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Portal</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Enter administrative credentials to log in.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-200 rounded-xl text-slate-900 font-bold text-sm outline-none transition-all placeholder:text-slate-400" 
              placeholder="e.g. admin"
              value={loginForm.username}
              onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-200 rounded-xl text-slate-900 font-bold text-sm outline-none transition-all placeholder:text-slate-400" 
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer" 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
