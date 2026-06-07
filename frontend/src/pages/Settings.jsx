import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalState } from '../context/GlobalStateContext';
import api from '../services/api';
import { Lock, Mail } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { showToast } = useGlobalState();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const updatePass = async (e) => {
    e.preventDefault();
    if (!password) { showToast('Password empty.', 'error'); return; }
    if (password.length < 6) { showToast('Min 6 characters.', 'error'); return; }
    if (password !== confirmPassword) { showToast('Passwords don\'t match.', 'error'); return; }
    setSavingPass(true);
    try {
      await api.put('/api/auth/me', { password });
      showToast('Password updated!', 'success');
      setPassword('');
      setConfirmPassword('');
    } catch (e) {
      showToast(e.response?.data?.detail || 'Error.', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const F = (l, ch) => <div><label className="label">{l}</label>{ch}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      {/* Account */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 className="label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Mail style={{ width: 14, height: 14 }} /> Account Profile
        </h3>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>Registered Email</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>{user?.email}</p>
        </div>
      </div>

      {/* Password */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock style={{ width: 14, height: 14 }} /> Update Password
        </h3>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 16px' }}>Min 6 characters.</p>
        <form onSubmit={updatePass} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {F('New Password', <input type="password" required className="glass-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={savingPass} />)}
            {F('Confirm Password', <input type="password" required className="glass-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={savingPass} />)}
          </div>
          <button type="submit" disabled={savingPass} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
            <Lock style={{ width: 14, height: 14 }} /> {savingPass ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
