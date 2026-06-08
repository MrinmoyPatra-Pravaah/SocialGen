import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';
import api from '../services/api';
import { Repeat2, Loader, Copy, Mail } from 'lucide-react';

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const platformCfg = [
  { key: 'twitter', label: 'Twitter/X', icon: TwitterIcon, color: 'var(--text-primary)', maxChars: 280 },
  { key: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon, color: '#3b82f6', maxChars: 3000 },
  { key: 'instagram', label: 'Instagram', icon: InstagramIcon, color: '#ec4899', maxChars: 2200 },
  { key: 'facebook', label: 'Facebook', icon: FacebookIcon, color: '#3b82f6', maxChars: 63206 },
  { key: 'email', label: 'Newsletter', icon: Mail, color: 'var(--accent-amber)', maxChars: null },
];

const ContentRemixer = () => {
  const { showToast } = useGlobalState();
  const [input, setInput] = useState('');
  const [tone, setTone] = useState(50);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleRemix = async () => {
    if (!input.trim()) { showToast('Paste some content first.', 'error'); return; }
    setLoading(true);
    try {
      const r = await api.post('/api/ai/remix', { content: input, tone_level: tone });
      setResults(r.data.remixes);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to remix content.', 'error');
      setResults(null);
    } finally { setLoading(false); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); showToast('Copied!', 'success'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Repeat2 style={{ width: 20, height: 20, color: 'var(--accent-pink)' }} /> Content Remixer
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>Paste any content → get platform-optimized versions instantly</p>
      </div>

      {/* Input */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <label className="label">Original Content</label>
        <textarea className="glass-textarea" rows={6} placeholder="Paste your blog post, article, email, or any long-form content here..." value={input} onChange={e => setInput(e.target.value)} disabled={loading} style={{ marginBottom: 16 }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, maxWidth: 300 }}>
            <label className="label" style={{ marginBottom: 8 }}>Tone: {tone < 30 ? 'Formal' : tone > 70 ? 'Casual' : 'Balanced'}</label>
            <input type="range" min="0" max="100" value={tone} onChange={e => setTone(Number(e.target.value))} disabled={loading}
              style={{ width: '100%', accentColor: 'var(--accent-violet)', height: 4, cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Formal</span><span>Casual</span>
            </div>
          </div>
          <button onClick={handleRemix} disabled={loading || !input.trim()} className="btn-primary" style={{ padding: '12px 24px' }}>
            {loading ? <><Loader style={{ width: 14, height: 14, animation: 'spin 1.5s linear infinite' }} /> Remixing...</> : <><Repeat2 style={{ width: 14, height: 14 }} /> Remix Content</>}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {platformCfg.map(p => {
            const Icon = p.icon;
            const text = results[p.key] || '';
            return (
              <div key={p.key} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon style={{ width: 16, height: 16, color: p.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.maxChars && <span style={{ fontSize: 10, color: text.length > p.maxChars ? '#f87171' : 'var(--text-muted)' }}>{text.length}/{p.maxChars}</span>}
                    <button onClick={() => copy(text)} className="btn-icon" style={{ width: 26, height: 26 }}><Copy style={{ width: 12, height: 12 }} /></button>
                  </div>
                </div>
                <div style={{ padding: 20, flex: 1, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 250, overflow: 'auto' }}>
                  {text}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContentRemixer;
