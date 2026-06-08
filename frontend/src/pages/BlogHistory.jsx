import React, { useState, useMemo, useEffect } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';
import api from '../services/api';
import { Search, Trash2, Copy, Download, Edit3, X, Check, FileText, AlertCircle } from 'lucide-react';


const BlogHistory = () => {
  const { jobs, fetchJobs, showToast } = useGlobalState();
  const [search, setSearch] = useState('');
  const [platFilter, setPlatFilter] = useState('all');
  const [toneFilter, setToneFilter] = useState('all');
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [campaignPosts, setCampaignPosts] = useState([]);
  const [failedImages, setFailedImages] = useState({});
  const [loadingPosts, setLoadingPosts] = useState(false);


  const fetchCampaignPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await api.get('/api/social/posts');
      setCampaignPosts(res.data || []);
    } catch (err) {
      console.error('Error fetching campaign posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };



  useEffect(() => {
    fetchCampaignPosts();
  }, []);

  
  const getTopicKeywords = (title) => {
    if (!title) return 'marketing';
    const commonWords = new Set(['daily', 'updates', 'on', 'a', 'an', 'the', 'in', 'of', 'for', 'with', 'and', 'or', 'to', 'at', 'by', 'from', 'about']);
    const words = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !commonWords.has(w));
    return words.join(',') || 'marketing';
  };

  const combinedHistory = useMemo(() => {
    const mappedJobs = jobs.map(j => ({
      ...j,
      originalId: j.id,
      type: 'job'
    }));

    const mappedPosts = campaignPosts.map(p => ({
      id: `post-${p.id}`,
      originalId: p.id,
      type: 'campaign_post',
      topic: p.title,
      platform: p.platform,
      tone: 'Campaign',
      length: 'Social Post',
      result_content: p.content,
      created_at: p.posted_at,
      status: 'completed',
      likes: p.likes,
      shares: p.shares,
      comments_count: p.comments_count,
      image_url: p.image_url
    }));

    return [...mappedJobs, ...mappedPosts].sort((a, b) => new Date(b.created_at + 'Z') - new Date(a.created_at + 'Z'));
  }, [jobs, campaignPosts]);

  const filtered = useMemo(() => combinedHistory.filter(j => {
    if (j.status !== 'completed' && j.status !== 'failed') return false;
    const ms = j.topic.toLowerCase().includes(search.toLowerCase()) || (j.keywords && j.keywords.toLowerCase().includes(search.toLowerCase()));
    const mp = platFilter === 'all' || (j.platform && j.platform.toLowerCase() === platFilter.toLowerCase());
    const mt = toneFilter === 'all' || (j.tone && j.tone.toLowerCase() === toneFilter.toLowerCase());
    return ms && mp && mt;
  }), [combinedHistory, search, platFilter, toneFilter]);

  const openDetail = (j) => { setDetail(j); setEditText(j.result_content || ''); setEditing(false); };
  const saveEdits = async () => {
    if (!detail) return; setSaving(true);
    try {
      if (detail.type === 'campaign_post') {
        const r = await api.put(`/api/social/posts/${detail.originalId}`, { content: editText });
        const updatedPost = {
          id: `post-${r.data.id}`,
          originalId: r.data.id,
          type: 'campaign_post',
          topic: r.data.title,
          platform: r.data.platform,
          tone: 'Campaign',
          length: 'Social Post',
          result_content: r.data.content,
          created_at: r.data.posted_at,
          status: 'completed',
          likes: r.data.likes,
          shares: r.data.shares,
          comments_count: r.data.comments_count,
          image_url: r.data.image_url
        };
        setDetail(updatedPost);
        fetchCampaignPosts();
      } else {
        const r = await api.put(`/api/ai/jobs/${detail.id}`, { result_content: editText });
        setDetail(r.data);
        fetchJobs(true);
      }
      setEditing(false);
      showToast('Saved!', 'success');
    }
    catch (err) {
      showToast('Error saving.', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  const del = async (id, e) => {
    if (e) e.stopPropagation();
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => {
        setDeletingId(prev => prev === id ? null : prev);
      }, 3000);
      return;
    }
    try {
      if (id.toString().startsWith('post-')) {
        const originalId = id.toString().replace('post-', '');
        await api.delete(`/api/social/posts/${originalId}`);
        showToast('Deleted.', 'success');
        if (detail && detail.id === id) setDetail(null);
        fetchCampaignPosts();
      } else {
        await api.delete(`/api/ai/jobs/${id}`);
        showToast('Deleted.', 'success');
        if (detail && detail.id === id) setDetail(null);
        fetchJobs(true);
      }
    } catch {
      showToast('Error deleting.', 'error');
    } finally {
      setDeletingId(null);
    }
  };
  const copy = (t) => { navigator.clipboard.writeText(t); showToast('Copied!', 'success'); };
  const exportMd = (j) => {
    const el = document.createElement('a'); const f = new Blob([j.result_content], { type: 'text/markdown' });
    el.href = URL.createObjectURL(f); el.download = `blog-${j.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    document.body.appendChild(el); el.click(); document.body.removeChild(el); showToast('Downloading...', 'success');
  };

  const plats = ['all', 'LinkedIn', 'Instagram', 'Twitter/X', 'Facebook', 'Other'];
  const tones = ['all', 'Professional', 'Casual', 'Promotional', 'SEO Optimized', 'Creative', 'Campaign'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-glass)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search style={{ position: 'absolute', left: 12, top: 11, width: 15, height: 15, color: 'var(--text-muted)' }} />
          <input className="glass-input" style={{ paddingLeft: 36 }} placeholder="Search by topic or keywords..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="glass-select" style={{ width: 140 }} value={platFilter} onChange={e => setPlatFilter(e.target.value)}>
            {plats.map(p => <option key={p} value={p}>{p === 'all' ? 'All Channels' : p}</option>)}
          </select>
          <select className="glass-select" style={{ width: 140 }} value={toneFilter} onChange={e => setToneFilter(e.target.value)}>
            {tones.map(t => <option key={t} value={t}>{t === 'all' ? 'All Tones' : t}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '64px 32px', textAlign: 'center' }}>
          <FileText style={{ width: 32, height: 32, color: 'var(--text-muted)', margin: '0 auto' }} />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '16px 0 0' }}>No content found</h3>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>Try adjusting filters or generate your first blog.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map(j => (
            <div key={j.id} onClick={() => openDetail(j)} className="glass-card" style={{ padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', ...(j.status === 'failed' ? { borderColor: 'rgba(239,68,68,0.2)' } : {}) }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="badge badge-neutral" style={{ fontSize: 9 }}>{j.platform || 'Blog'}</span>
                    {j.type === 'campaign_post' && <span className="badge" style={{ fontSize: 9, background: 'rgba(34, 211, 238, 0.15)', color: 'var(--accent-cyan)' }}>Campaign Post</span>}
                  </div>
                  {j.status === 'failed' ? <span className="badge badge-red" style={{ fontSize: 9 }}><AlertCircle style={{ width: 10, height: 10 }} /> Failed</span>
                    : <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(j.created_at + 'Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                </div>
                <h4 className="line-clamp-2" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{j.topic}</h4>
                {j.keywords && <p className="line-clamp-1" style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Keywords: {j.keywords}</p>}
              </div>
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 12, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tone: {j.tone}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {j.status === 'completed' && <>
                    <button onClick={e => { e.stopPropagation(); exportMd(j); }} className="btn-icon" style={{ width: 26, height: 26 }} title="Download"><Download style={{ width: 13, height: 13 }} /></button>
                    <button onClick={e => { e.stopPropagation(); copy(j.result_content); }} className="btn-icon" style={{ width: 26, height: 26 }} title="Copy"><Copy style={{ width: 13, height: 13 }} /></button>
                  </>}
                  {deletingId === j.id ? (
                    <button onClick={e => del(j.id, e)} className="btn-danger" style={{ height: 26, padding: '0 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }} title="Confirm delete">
                      <Check style={{ width: 11, height: 11 }} /> Confirm
                    </button>
                  ) : (
                    <button onClick={e => del(j.id, e)} className="btn-icon" style={{ width: 26, height: 26, color: 'var(--text-muted)' }} title="Delete">
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setDetail(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div className="animate-slide-in-right" style={{ position: 'relative', width: '100%', maxWidth: 640, background: 'var(--bg-surface)', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-glass)' }}>
              <div style={{ minWidth: 0, flex: 1 }}><span className="label" style={{ margin: 0, fontSize: 9 }}>Article Details</span><h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail.topic}</h3></div>
              <button onClick={() => setDetail(null)} className="btn-icon"><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {detail.type === 'campaign_post' && detail.image_url && (
                <div style={{ width: '100%', height: 200, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                  <img 
                    src={failedImages[detail.id] ? `https://loremflickr.com/800/600/${getTopicKeywords(detail.topic)}?lock=${detail.originalId}` : detail.image_url} 
                    onError={() => {
                      setFailedImages(prev => ({ ...prev, [detail.id]: true }));
                    }}
                    alt="Creative Poster" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                <span className="badge badge-neutral">Platform: <strong>{detail.platform || 'Blog'}</strong></span>
                <span className="badge badge-neutral">Tone: <strong>{detail.tone}</strong></span>
                <span className="badge badge-neutral">Length: <strong>{detail.length || 'Medium'}</strong></span>
                {detail.type === 'campaign_post' && (
                  <>
                    <span className="badge badge-neutral">Likes: <strong>👍 {detail.likes}</strong></span>
                    <span className="badge badge-neutral">Shares: <strong>🔄 {detail.shares}</strong></span>
                    <span className="badge badge-neutral">Comments: <strong>💬 {detail.comments_count}</strong></span>
                  </>
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="label" style={{ margin: 0 }}>Document Text</span>
                  {detail.status === 'completed' && (editing
                    ? <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveEdits} disabled={saving} className="btn-primary" style={{ fontSize: 11, padding: '5px 12px' }}><Check style={{ width: 12, height: 12 }} /> Save</button>
                      <button onClick={() => { setEditText(detail.result_content); setEditing(false); }} className="btn-secondary" style={{ fontSize: 11, padding: '5px 12px' }}>Cancel</button>
                    </div>
                    : <button onClick={() => setEditing(true)} className="btn-secondary" style={{ fontSize: 11, padding: '5px 12px' }}><Edit3 style={{ width: 12, height: 12 }} /> Edit</button>
                  )}
                </div>
                {detail.status === 'failed'
                  ? <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', padding: 16, borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                    <p style={{ fontWeight: 700, color: '#dc2626', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle style={{ width: 14, height: 14 }} /> Error Log</p>
                    <p style={{ color: '#ef4444', margin: '8px 0 0', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{detail.error_message}</p>
                  </div>
                  : editing
                    ? <textarea className="glass-textarea" rows={16} style={{ fontFamily: 'monospace', fontSize: 12 }} value={editText} onChange={e => setEditText(e.target.value)} disabled={saving} />
                    : <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: 24, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 400, overflow: 'auto' }}>{detail.result_content}</div>
                }
              </div>
            </div>
            {detail.status === 'completed' && (
              <div style={{ borderTop: '1px solid var(--border-glass)', padding: '16px 24px', background: 'var(--bg-glass)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => exportMd(detail)} className="btn-secondary" style={{ fontSize: 12 }}><Download style={{ width: 14, height: 14 }} /> Download .MD</button>
                <button onClick={() => copy(detail.result_content)} className="btn-primary" style={{ fontSize: 12 }}><Copy style={{ width: 14, height: 14 }} /> Copy</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogHistory;
