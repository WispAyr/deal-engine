import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginModal({ open, onClose, onLogin, onRegister, error, setError, userMode }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError?.(null);
    try {
      await onLogin(userMode ? email : password, userMode ? password : undefined);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError?.(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError?.(null);
    try {
      await onRegister(email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError?.(err.message);
    }
  };

  const handleSubmit = mode === 'register' ? handleRegister : handleLogin;

  return (
    <AnimatePresence>
      {open && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            className="login-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{mode === 'register' ? 'Create account' : 'Sign in'}</h3>
            <p className="helper-text" style={{ marginBottom: 16 }}>
              {mode === 'register'
                ? 'Register for access to the deal engine.'
                : 'Admin and sync actions require authentication.'}
            </p>
            <form onSubmit={handleSubmit}>
              {userMode && (
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="strategy-input"
                  style={{ width: '100%', marginBottom: 12 }}
                  autoFocus={mode === 'register'}
                />
              )}
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="strategy-input"
                style={{ width: '100%', marginBottom: 12 }}
                autoFocus={!userMode || mode === 'login'}
              />
              {error && (
                <p style={{ color: 'var(--accent-red, #ef4444)', fontSize: 13, marginBottom: 12 }}>{error}</p>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="submit" className="toolbar-btn primary">
                  {mode === 'register' ? 'Register' : 'Sign in'}
                </button>
                {userMode && (
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError?.(null); }}
                  >
                    {mode === 'login' ? 'Create account' : 'Back to sign in'}
                  </button>
                )}
                <button type="button" className="toolbar-btn" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
