import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useGlobalState } from '../context/GlobalStateContext';
import { Plus, Trash2, Shield, UserCheck, AlertCircle, Info, Sparkles } from 'lucide-react';

const SocialAccounts = () => {
  const { showToast } = useGlobalState();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initiatingOAuth, setInitiatingOAuth] = useState(null);

  // Platform details mapping
  const platforms = [
    {
      id: 'LinkedIn',
      name: 'LinkedIn Business',
      color: 'var(--platform-linkedin)',
      desc: 'Publish posts, target professionals, and sync comment replies.',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80'
    },
    {
      id: 'Twitter',
      name: 'Twitter / X Profile',
      color: 'var(--platform-twitter)',
      desc: 'Share punchy updates, threads, and track real-time impressions.',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'
    },
    {
      id: 'Instagram',
      name: 'Instagram Business',
      color: 'var(--platform-instagram)',
      desc: 'Post daily creative posters and monitor image engagement.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80'
    },
    {
      id: 'Facebook',
      name: 'Facebook Page',
      color: 'var(--platform-facebook)',
      desc: 'Promote campaigns to communities and moderate user comments.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80'
    }
  ];

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/social/accounts');
      setAccounts(res.data);
    } catch (err) {
      showToast('Failed to load social accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Check query parameters to capture incoming OAuth redirection callbacks
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const handle = searchParams.get('handle');
    const msg = searchParams.get('message');

    if (status === 'success') {
      showToast(`Connected ${platform} account @${handle || 'profile'}!`, 'success');
      // Clean query parameters from URL
      navigate('/connections', { replace: true });
      fetchAccounts();
    } else if (status === 'error') {
      showToast(msg || 'OAuth connection aborted.', 'error');
      navigate('/connections', { replace: true });
    }
  }, [searchParams]);

  /**
   * Triggers the OAuth 2.0 flow. Queries backend for OAuth redirect URL
   * and navigates the browser window directly to the social network portal.
   */
  const handleInitiateOAuth = async (platformId) => {
    setInitiatingOAuth(platformId);
    try {
      const origin = window.location.origin;
      const res = await api.get(`/api/social/auth/link/${platformId}?origin=${encodeURIComponent(origin)}`);
      if (res.data?.redirectUrl) {
        // Direct browser navigation to LinkedIn, Twitter, or Meta Auth
        window.location.href = res.data.redirectUrl;
      } else {
        throw new Error('Failed to resolve callback redirection endpoint.');
      }
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to initiate OAuth flow.', 'error');
      setInitiatingOAuth(null);
    }
  };

  const handleDisconnect = async (id, name) => {
    if (!window.confirm(`Are you sure you want to disconnect @${name}?`)) return;

    try {
      await api.delete(`/api/social/accounts/${id}`);
      showToast(`Disconnected @${name}.`, 'success');
      fetchAccounts();
    } catch (err) {
      showToast('Failed to disconnect account.', 'error');
    }
  };

  // Get inline platform icon SVG dynamically to prevent lucide-react build errors
  const getPlatformIcon = (platform, size = 18) => {
    const props = { width: size, height: size, fill: 'currentColor' };
    switch (platform) {
      case 'LinkedIn':
        return (
          <svg viewBox="0 0 24 24" {...props}>
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        );
      case 'Twitter':
        return (
          <svg viewBox="0 0 24 24" {...props}>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      case 'Instagram':
        return (
          <svg viewBox="0 0 24 24" {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        );
      case 'Facebook':
        return (
          <svg viewBox="0 0 24 24" {...props}>
            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 className="label" style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Social Channel Integration
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Link your official social media channels. Automated campaigns publish directly to these accounts.
        </p>
      </div>

      {/* Info notice about credentials */}
      <div className="glass-panel" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start', border: '1px solid var(--border-glass-strong)' }}>
        <Info style={{ width: 18, height: 18, color: 'var(--accent-purple)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>OAuth Developer Credentials Notice</h4>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            To link your live profiles, make sure to add your app's Client ID and Secret to your backend environment files (`backend/.env`). 
            If credentials are not supplied, the platform automatically boots in a <strong>Developer Sandbox mode</strong> so you can test the redirection loop and daily scheduling. See <code style={{ color: 'var(--accent-purple)' }}>APIS_SETUP.md</code> in the project directory for details.
          </p>
        </div>
      </div>

      {/* Grid of channels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {platforms.map(platform => {
          const connected = accounts.filter(acc => acc.platform === platform.id);
          const isConnecting = initiatingOAuth === platform.id;
          
          return (
            <div key={platform.id} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 260, justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>


              {/* Head info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-sm)',
                    background: `rgba(0,0,0,0.02)`,
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: platform.color
                  }}>
                    {getPlatformIcon(platform.id, 22)}
                  </div>
                  {connected.length > 0 ? (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <UserCheck style={{ width: 10, height: 10 }} /> Connected
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '4px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.03)', color: 'var(--text-muted)', border: '1px solid var(--border-glass)' }}>
                      Disconnected
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>{platform.name}</h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{platform.desc}</p>
              </div>

              {/* Connected users list or Connect action */}
              <div style={{ marginTop: 24 }}>
                {connected.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {connected.map(acc => (
                      <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={acc.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'} alt="Avatar" style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${platform.color}` }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>@{acc.username}</span>
                            {acc.access_token?.startsWith('sandbox_') && (
                              <span style={{ fontSize: 8, color: 'var(--accent-purple)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Sparkles style={{ width: 8, height: 8 }} /> Sandbox Mode
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleDisconnect(acc.id, acc.username)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 4, opacity: 0.7, transition: 'opacity 0.2s' }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.7}>
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => handleInitiateOAuth(platform.id)} disabled={isConnecting} className="btn-secondary" style={{ width: '100%', fontSize: 11, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                      <Plus style={{ width: 12, height: 12 }} /> Connect Another Account
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleInitiateOAuth(platform.id)} 
                    disabled={isConnecting}
                    className="btn-primary" 
                    style={{ 
                      width: '100%', 
                      fontSize: 12, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 6,
                      background: platform.color
                    }}
                  >
                    {isConnecting ? (
                      'Redirecting to Authorization...'
                    ) : (
                      <>
                        <Shield style={{ width: 14, height: 14 }} /> Connect Account via OAuth
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialAccounts;
