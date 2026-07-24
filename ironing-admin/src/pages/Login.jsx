import React, { useState } from 'react';
import { ShoppingBag, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login({ loginForm, setLoginForm, handleLogin, loginError, loading }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="brand-icon" style={{ margin: '0 auto 12px' }}>
            <ShoppingBag size={22} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Admin Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Enter administrative credentials to log in.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. admin"
              value={loginForm.username}
              onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                required 
                style={{ paddingRight: 40 }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, background: 'none', border: 'none',
                  cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center',
                  padding: 4
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {loginError && (
            <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center' }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 44 }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Log In'}
          </button>
        </form>

      </div>
    </div>
  );
}
