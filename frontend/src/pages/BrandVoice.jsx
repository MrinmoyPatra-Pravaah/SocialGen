import React, { useState } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';
import api from '../services/api';
import { Mic, Save, Sparkles, RefreshCw, Plus, X } from 'lucide-react';
import { uploadFile } from '../services/storage'

const BrandVoice = () => {
  const { showToast } = useGlobalState();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState('');
  const [generating, setGenerating] = useState(false);

  const [voice, setVoice] = useState({
    formality: 60,
    humor: 30,
    energy: 70,
    technicality: 50,
    warmth: 65,
  });

  const [keywords, setKeywords] = useState(['innovation', 'growth', 'data-driven']);
  const [avoidWords, setAvoidWords] = useState(['synergy', 'disrupt']);
  const [newKw, setNewKw] = useState('');
  const [newAvoid, setNewAvoid] = useState('');

  const sliders = [
    { key: 'formality', label: 'Formality', left: 'Casual', right: 'Formal', color: 'var(--accent-violet)' },
    { key: 'humor', label: 'Humor', left: 'Serious', right: 'Playful', color: 'var(--accent-pink)' },
    { key: 'energy', label: 'Energy', left: 'Calm', right: 'Energetic', color: 'var(--accent-amber)' },
    { key: 'technicality', label: 'Technicality', left: 'Simple', right: 'Technical', color: 'var(--accent-cyan)' },
    { key: 'warmth', label: 'Warmth', left: 'Neutral', right: 'Warm', color: 'var(--accent-emerald)' },
  ];

  const addTag = (list, setter, val, valSetter) => {
    if (val.trim() && !list.includes(val.trim())) { setter([...list, val.trim()]); valSetter(''); }
  };
  const removeTag = (list, setter, idx) => setter(list.filter((_, i) => i !== idx));

  const generatePreview = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/api/ai/remix', { content: 'Write a short LinkedIn post about the future of AI in content marketing.', tone_level: voice.formality });
      setPreview(r.data?.remixes?.linkedin || '');
    } catch {
      const f = voice.formality > 60 ? 'We are pleased to announce' : 'Hey everyone! Excited to share';
      const h = voice.humor > 50 ? ' (and yes, the robots are coming for our jobs 🤖)' : '';
      const e = voice.energy > 60 ? '🚀 ' : '';
      setPreview(`${e}${f} our latest insights on AI in content marketing${h}.\n\n${voice.technicality > 50 ? 'Leveraging NLP and generative models, we\'ve identified key trends shaping the industry.' : 'AI is changing how we create content — here\'s what matters.'}\n\n${voice.warmth > 50 ? 'We\'d love to hear your thoughts! What\'s your experience been like? 💬' : 'Key takeaways in the thread below.'}\n\n${keywords.map(k => `#${k.replace(/\s/g, '')}`).join(' ')}`);
    } finally { setGenerating(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/api/auth/me', { brand_voice: JSON.stringify({ sliders: voice, keywords, avoidWords }) });
      showToast('Brand voice saved!', 'success');
    } catch { showToast('Could not save.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mic style={{ width: 20, height: 20, color: 'var(--accent-emerald)' }} /> Brand Voice Profile
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>Define your brand's unique personality for AI-generated content</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Sliders */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 className="label" style={{ marginBottom: 20 }}>Voice Spectrum</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {sliders.map(s => (
              <div key={s.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{voice[s.key]}%</span>
                </div>
                <input type="range" min="0" max="100" value={voice[s.key]} onChange={e => setVoice({ ...voice, [s.key]: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: s.color, height: 4, cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>{s.left}</span><span>{s.right}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keywords + Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Brand Keywords */}
          <div className="glass-panel" style={{ padding: 20 }}>
            <h3 className="label" style={{ marginBottom: 12 }}>Brand Keywords (Always Use)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {keywords.map((kw, i) => (
                <span key={i} style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#047857', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {kw} <button onClick={() => removeTag(keywords, setKeywords, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857', padding: 0, display: 'flex', alignItems: 'center' }}><X style={{ width: 10, height: 10 }} /></button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="glass-input" placeholder="Add keyword..." value={newKw} onChange={e => setNewKw(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(keywords, setKeywords, newKw, setNewKw); } }} style={{ flex: 1 }} />
              <button onClick={() => addTag(keywords, setKeywords, newKw, setNewKw)} className="btn-ghost" style={{ flexShrink: 0 }}><Plus style={{ width: 14, height: 14 }} /></button>
            </div>
          </div>

          {/* Avoid Words */}
          <div className="glass-panel" style={{ padding: 20 }}>
            <h3 className="label" style={{ marginBottom: 12 }}>Words to Avoid</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {avoidWords.map((w, i) => (
                <span key={i} style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'line-through' }}>
                  {w} <button onClick={() => removeTag(avoidWords, setAvoidWords, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', padding: 0, display: 'flex', alignItems: 'center' }}><X style={{ width: 10, height: 10 }} /></button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="glass-input" placeholder="Add word to avoid..." value={newAvoid} onChange={e => setNewAvoid(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(avoidWords, setAvoidWords, newAvoid, setNewAvoid); } }} style={{ flex: 1 }} />
              <button onClick={() => addTag(avoidWords, setAvoidWords, newAvoid, setNewAvoid)} className="btn-ghost" style={{ flexShrink: 0 }}><Plus style={{ width: 14, height: 14 }} /></button>
            </div>
          </div>

          {/* Preview */}
          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="label" style={{ margin: 0 }}>Voice Preview</h3>
              <button onClick={generatePreview} disabled={generating} className="btn-ghost" style={{ fontSize: 10, gap: 4 }}>
                {generating ? <><RefreshCw style={{ width: 11, height: 11, animation: 'spin 1.5s linear infinite' }} /> Generating...</> : <><Sparkles style={{ width: 11, height: 11 }} /> Generate Sample</>}
              </button>
            </div>
            {preview ? (
              <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: 16, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{preview}</div>
            ) : (
              <div style={{ border: '1px dashed var(--border-glass-strong)', borderRadius: 'var(--radius-sm)', padding: '32px 16px', textAlign: 'center' }}>
                <Sparkles style={{ width: 20, height: 20, color: 'var(--text-muted)', margin: '0 auto' }} />
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '8px 0 0' }}>Click "Generate Sample" to preview your brand voice</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{ padding: '12px 24px' }}>
          <Save style={{ width: 14, height: 14 }} /> {saving ? 'Saving...' : 'Save Brand Voice Profile'}
        </button>
      </div>
    </div>
  );
};




const FileUploadExample = () => {
  const [progress, setProgress] = useState(0)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setError('')
    setProgress(0)

    try {
      const downloadUrl = await uploadFile(
        file,
        `uploads/${Date.now()}_${file.name}`,
        setProgress
      )
      setUrl(downloadUrl)
      // Save `downloadUrl` to Firestore doc or send to backend as needed
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {progress > 0 && progress < 100 && <p>Uploading: {progress}%</p>}
      {url && <p>Uploaded: <a href={url} target="_blank" rel="noreferrer">View file</a></p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}



export default BrandVoice;
