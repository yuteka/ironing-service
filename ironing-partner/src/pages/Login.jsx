import React, { useState } from 'react';
import { ShoppingBag, AlertTriangle, Loader2, User, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login({ loginForm, setLoginForm, handleLogin, loginError, loading }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container-mobile">
      {/* Brand Header */}
      <div className="login-header-mobile">
        <div style={{ 
          display: 'inline-flex', 
          padding: 16, 
          backgroundColor: 'var(--primary-light)', 
          borderRadius: 20, 
          color: 'var(--primary-dark)', 
          marginBottom: 16,
          boxShadow: '0 8px 24px rgba(224, 168, 107, 0.2)'
        }}>
          <ShoppingBag size={32} />
        </div>
        <h2>Partner Portal</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
          Sign in to access your assigned pickups and delivery routes.
        </p>
      </div>

      {/* Login Card Form */}
      <form onSubmit={handleLogin} className="login-form-mobile">
        {/* Username Field */}
        <div className="form-group">
          <label className="form-label">Username</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <User 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: 14, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)',
                opacity: 0.8
              }} 
            />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter username"
              value={loginForm.username}
              onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
              style={{ paddingLeft: 44 }}
              required 
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <Lock 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: 14, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)',
                opacity: 0.8
              }} 
            />
            <input 
              type={showPassword ? 'text' : 'password'} 
              className="form-input" 
              placeholder="••••••••"
              value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              style={{ paddingLeft: 44, paddingRight: 44 }}
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: 4
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Error Message banner */}
        {loginError && (
          <div style={{ 
            color: '#DC2626', 
            fontSize: '0.82rem', 
            display: 'flex', 
            gap: 8, 
            alignItems: 'center',
            backgroundColor: '#FEE2E2',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(220, 38, 38, 0.15)',
            fontWeight: 600
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{loginError}</span>
          </div>
        )}

        {/* Submit Action Button */}
        <button 
          type="submit" 
          className="btn-mobile btn-mobile-primary" 
          style={{ 
            marginTop: 8, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 10,
            boxShadow: '0 8px 20px rgba(91, 58, 27, 0.15)'
          }} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Sandbox instructions footer */}
      <div style={{ textAlign: 'center', marginTop: 28, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        <span>Enter any credentials to login in sandbox mode.</span>
      </div>
    </div>
  );
}
