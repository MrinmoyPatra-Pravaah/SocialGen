import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useGlobalState } from '../context/GlobalStateContext';
import { MessageSquare, Star, Send, Smile, Frown, Meh, Globe, RotateCw, CheckCircle } from 'lucide-react';

const sentimentIcons = { positive: Smile, negative: Frown, neutral: Meh };
const sentimentColors = { positive: '#10b981', negative: '#ef4444', neutral: '#f59e0b' };
const platColors = {
  LinkedIn: 'platform-linkedin',
  Instagram: 'platform-instagram',
  Twitter: 'platform-twitter',
  Facebook: 'platform-facebook'
};

const SocialInbox = () => {
  const { showToast } = useGlobalState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/social/comments');
      setMessages(res.data);
      
      // Keep selected comment updated
      if (selected) {
        const updatedSelected = res.data.find(m => m.id === selected.id);
        if (updatedSelected) setSelected(updatedSelected);
      }
    } catch (err) {
      showToast('Failed to load social inbox.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const filtered = messages.filter(m => {
    if (filter === 'unread') return m.replied === 0;
    if (filter === 'starred') return m.starred === 1;
    if (filter === 'positive' || filter === 'negative' || filter === 'neutral') return m.sentiment === filter;
    return true;
  });

  const toggleStar = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/api/social/comments/${id}/star`);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, starred: res.data.starred } : m));
      if (selected && selected.id === id) {
        setSelected(prev => ({ ...prev, starred: res.data.starred }));
      }
      showToast(res.data.starred ? 'Message starred' : 'Message unstarred', 'success');
    } catch (err) {
      showToast('Failed to update star status.', 'error');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selected) return;

    setSubmittingReply(true);
    try {
      const res = await api.post(`/api/social/comments/${selected.id}/reply`, {
        reply_content: replyText
      });
      showToast('Reply sent successfully!', 'success');
      setReplyText('');
      
      // Update local state
      setMessages(prev => prev.map(m => m.id === selected.id ? { ...m, replied: 1, reply_content: res.data.reply_content } : m));
      setSelected(prev => ({ ...prev, replied: 1, reply_content: res.data.reply_content }));
    } catch (err) {
      showToast('Failed to send reply.', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const unreadCount = messages.filter(m => m.replied === 0).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'Z');
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getPlatformIcon = (platform, size = 12) => {
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
        return <Globe style={{ width: size, height: size }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Social Inbox</h2>
          {unreadCount > 0 && <span className="badge badge-violet">{unreadCount} unread</span>}
          <button onClick={fetchComments} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            <RotateCw className={loading ? 'animate-spin' : ''} style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div className="glass-panel" style={{ display: 'flex', padding: 2, borderRadius: 'var(--radius-sm)' }}>
          {['all', 'unread', 'starred', 'positive', 'neutral', 'negative'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: filter === f ? 'var(--bg-glass-strong)' : 'transparent',
                color: filter === f ? 'var(--text-primary)' : 'var(--text-tertiary)',
                transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.5fr)', gap: 16, minHeight: 520 }}>
        {/* Message list */}
        <div className="glass-panel" style={{ overflow: 'auto', maxHeight: 600, display: 'flex', flexDirection: 'column' }}>
          {loading && messages.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--accent-violet)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Syncing social feeds...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '80px 24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <MessageSquare style={{ width: 32, height: 32, color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>All caught up!</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>No comments match this filter.</p>
            </div>
          ) : (
            filtered.map(m => {
              const SentIcon = sentimentIcons[m.sentiment] || Smile;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelected(m)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                    background: selected?.id === m.id ? 'var(--bg-glass-strong)' : m.replied === 0 ? 'rgba(139,92,246,0.04)' : 'transparent',
                    transition: 'background 0.15s',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--bg-glass-strong)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    flexShrink: 0
                  }}>
                    {m.author_avatar || m.author_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: m.replied === 0 ? 700 : 500, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {m.author_name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <SentIcon style={{ width: 12, height: 12, color: sentimentColors[m.sentiment] }} />
                        <button
                          onClick={e => toggleStar(m.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: m.starred === 1 ? '#fbbf24' : 'var(--text-muted)' }}
                        >
                          <Star style={{ width: 12, height: 12, fill: m.starred === 1 ? '#fbbf24' : 'none' }} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)', margin: '1px 0 3px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      on "{m.post_title}"
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {m.content}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span className={`badge ${platColors[m.platform] || 'badge-neutral'}`} style={{ fontSize: 8, padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {getPlatformIcon(m.platform, 8)} {m.platform}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatDate(m.created_at)}</span>
                    </div>
                  </div>
                  {m.replied === 0 && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-purple)', flexShrink: 0, marginTop: 5 }} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Message detail pane */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 460 }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
              <MessageSquare style={{ width: 44, height: 44, color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>Select a Conversation</p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>Click a social message on the left panel to inspect comments and reply.</p>
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-secondary)'
                    }}>
                      {selected.author_avatar || selected.author_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{selected.author_name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span className={`badge ${platColors[selected.platform] || 'badge-neutral'}`} style={{ fontSize: 8, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          {getPlatformIcon(selected.platform, 8)} {selected.platform}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatDate(selected.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Smile style={{ width: 14, height: 14, color: sentimentColors[selected.sentiment] }} />
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: 600 }}>{selected.sentiment} Sentiment</span>
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div style={{ flex: 1, padding: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Original Post context */}
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>Context Post</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>{selected.post_title}</p>
                </div>

                {/* Comment message */}
                <div style={{ display: 'flex', gap: 12, maxWidth: '85%' }}>
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--bg-glass-strong)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '0 12px 12px 12px'
                  }}>
                    <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                      {selected.content}
                    </p>
                  </div>
                </div>

                {/* Reply message if already replied */}
                {selected.replied === 1 && selected.reply_content && (
                  <div style={{ display: 'flex', gap: 12, maxWidth: '85%', alignSelf: 'flex-end', flexDirection: 'row-reverse' }}>
                    <div style={{
                      padding: '12px 16px',
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      borderRadius: '12px 0 12px 12px'
                    }}>
                      <p style={{ fontSize: 10, color: 'var(--accent-purple)', fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle style={{ width: 10, height: 10 }} /> Replied
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                        {selected.reply_content}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Composer */}
              <form onSubmit={handleSendReply} style={{ padding: '16px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: 10 }}>
                <input
                  className="glass-input"
                  required
                  placeholder={selected.replied === 1 ? "Write another reply..." : "Type your reply to this comment..."}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  style={{ flex: 1 }}
                  disabled={submittingReply}
                />
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="btn-primary"
                  style={{ flexShrink: 0, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Send style={{ width: 14, height: 14 }} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialInbox;
