import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';
import api from '../services/api';
import { Hash, Loader, Copy, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

const HashtagLab = () => {
  const { showToast } = useGlobalState();
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const generate = async () => {
    if (!topic.trim()) { showToast('Enter a topic.', 'error'); return; }
    setLoading(true);
    try {
      const r = await api.post('/api/ai/hashtags', { topic, platform });
      setResults(r.data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to generate hashtags.', 'error');
      setResults(null);
    } finally { setLoading(false); }
  };

  const copySet = (tags) => { navigator.clipboard.writeText(tags.join(' ')); showToast('Hashtags copied!', 'success'); };
  const copyAll = () => {
    if (!results) return;
    const all = [...(results.high_reach||[]), ...(results.medium_reach||[]), ...(results.niche||[])];
    navigator.clipboard.writeText(all.join(' ')); showToast('All hashtags copied!', 'success');
  };

  const TagGroup = ({ title, tags, icon: Icon, color, trend }) => (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 14, height: 14, color }} />
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h4>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{trend}</span>
          </div>
        </div>
        <button onClick={() => copySet(tags)} className="btn-ghost" style={{ fontSize: 10, gap: 4 }}><Copy style={{ width: 11, height: 11 }} /> Copy set</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((tag, i) => (
          <span key={i} style={{
            padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: color + '12', color, border: `1px solid ${color}25`,
            cursor: 'pointer', transition: 'all 0.2s',
          }} onClick={() => { navigator.clipboard.writeText(tag); showToast(`${tag} copied!`, 'success'); }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Hash style={{ width: 20, height: 20, color: 'var(--accent-cyan)' }} /> Hashtag Lab
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>AI-powered hashtag research and generation</p>
      </div>

      {/* Input */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Topic or Keywords</label>
            <input className="glass-input" placeholder="E.g., AI marketing, content strategy" value={topic} onChange={e => setTopic(e.target.value)} disabled={loading} />
          </div>
          <div style={{ width: 160 }}>
            <label className="label">Platform</label>
            <select className="glass-select" value={platform} onChange={e => setPlatform(e.target.value)} disabled={loading}>
              {['Instagram','Twitter/X','LinkedIn','Facebook','TikTok'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={generate} disabled={loading || !topic.trim()} className="btn-primary" style={{ padding: '10px 20px', flexShrink: 0 }}>
            {loading ? <><Loader style={{ width: 14, height: 14, animation: 'spin 1.5s linear infinite' }} /> Generating...</> : <><Sparkles style={{ width: 14, height: 14 }} /> Generate</>}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={copyAll} className="btn-secondary" style={{ fontSize: 12 }}><Copy style={{ width: 13, height: 13 }} /> Copy All Hashtags</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <TagGroup title="High Reach" tags={results.high_reach || []} icon={TrendingUp} color="#34d399" trend="1M+ potential impressions" />
            <TagGroup title="Medium Reach" tags={results.medium_reach || []} icon={Minus} color="var(--accent-amber)" trend="100K-1M impressions" />
            <TagGroup title="Niche / Targeted" tags={results.niche || []} icon={TrendingDown} color="var(--accent-violet)" trend="<100K but highly targeted" />
          </div>
          {results.platform_tips && (
            <div className="glass-panel" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-cyan)15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles style={{ width: 14, height: 14, color: 'var(--accent-cyan)' }} />
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{platform} Tip</span>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{results.platform_tips}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HashtagLab;
