import React, { useState, useEffect } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';
import api from '../services/api';
import { Sparkles, Loader, CheckCircle2, AlertCircle, Copy, Globe, FileText, RefreshCw, Clock, XCircle } from 'lucide-react';
import { uploadFile } from '../services/storage'


const BlogGenerator = () => {
  const { jobs, fetchJobs, showToast } = useGlobalState();
  const [currentJobId, setCurrentJobId] = useState(null);
  const [activeJobDetails, setActiveJobDetails] = useState(null);
  const [polling, setPolling] = useState(false);
  const [formData, setFormData] = useState({ topic:'', keywords:'', tone:'Professional', audience:'', goal:'Educational', platform:'LinkedIn', length:'Medium', website_url:'' });
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    const running = jobs.filter(j => j.status==='pending'||j.status==='processing');
    if (running.length > 0 && !currentJobId) { setCurrentJobId(running[0].id); setActiveJobDetails(running[0]); }
  }, [jobs, currentJobId]);


  useEffect(() => {
    if (!currentJobId) return;
    let id;
    const poll = async () => {
      try {
        const r = await api.get(`/api/ai/jobs/${currentJobId}`);
        setActiveJobDetails(r.data);
        if (r.data.status==='completed'||r.data.status==='failed') { setPolling(false); clearInterval(id); fetchJobs(true);
          showToast(r.data.status==='completed'?'Blog generated!':'Generation failed.', r.data.status==='completed'?'success':'error'); }
      } catch { setPolling(false); clearInterval(id); }
    };
    if (activeJobDetails && (activeJobDetails.status==='completed'||activeJobDetails.status==='failed')) { setPolling(false); return; }
    setPolling(true); poll();
    id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [currentJobId, fetchJobs, showToast]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.topic) { showToast('Topic required.', 'error'); return; }
    setSubmitting(true);
    try { const r = await api.post('/api/ai/jobs', formData); setCurrentJobId(r.data.id); setActiveJobDetails(r.data); fetchJobs(true); showToast('Job queued!', 'success'); }
    catch { showToast('Could not start.', 'error'); }
    finally { setSubmitting(false); }
  };


  const copy = (t) => { navigator.clipboard.writeText(t); showToast('Copied!', 'success'); };
  const retry = async (id) => {
    try { const r = await api.post(`/api/ai/jobs/${id}/retry`); setCurrentJobId(r.data.id); setActiveJobDetails(r.data); fetchJobs(true); showToast('Retrying...', 'success'); }
    catch { showToast('Retry failed.', 'error'); }
  };
  const handleCancel = async (id) => {
    try {
      const r = await api.post(`/api/ai/jobs/${id}/cancel`);
      setActiveJobDetails(r.data);
      fetchJobs(true);
      showToast('Generation cancelled.', 'info');
    } catch {
      showToast('Cancel failed.', 'error');
    }
  };

  
  const reset = () => { setCurrentJobId(null); setActiveJobDetails(null); };
  const tones = ['Professional','Casual','Promotional','SEO Optimized','Creative'];
  const lengths = ['Short','Medium','Long'];
  const plats = ['LinkedIn','Instagram','Twitter/X','Facebook','Other'];

  const F = (l,ch) => <div><label className="label">{l}</label>{ch}</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      <div>
        <h2 style={{fontSize:20,fontWeight:800,color:'var(--text-primary)',margin:0,display:'flex',alignItems:'center',gap:8}}>
          <Sparkles style={{width:20,height:20,color:'var(--accent-violet)'}}/> AI Content Generator
        </h2>
        <p style={{fontSize:12,color:'var(--text-tertiary)',margin:'4px 0 0'}}>Create engaging articles and social posts optimized for your brand</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:20,alignItems:'start'}}>
        {/* Form */}
        <div className="glass-panel" style={{padding:24}}>
          <h3 className="label" style={{borderBottom:'1px solid var(--border-glass)',paddingBottom:12,marginBottom:16}}>Campaign Settings</h3>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
            {F('Topic *',<input required className="glass-input" placeholder="E.g., 5 Ways AI reshapes ops" value={formData.topic} onChange={e=>setFormData({...formData,topic:e.target.value})} disabled={polling||submitting}/>)}
            {F('Keywords',<input className="glass-input" placeholder="ai, automation (comma separated)" value={formData.keywords} onChange={e=>setFormData({...formData,keywords:e.target.value})} disabled={polling||submitting}/>)}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {F('Tone',<select className="glass-select" value={formData.tone} onChange={e=>setFormData({...formData,tone:e.target.value})} disabled={polling||submitting}>{tones.map(t=><option key={t}>{t}</option>)}</select>)}
              {F('Length',<select className="glass-select" value={formData.length} onChange={e=>setFormData({...formData,length:e.target.value})} disabled={polling||submitting}>{lengths.map(l=><option key={l}>{l}</option>)}</select>)}
            </div>
            {F('Target Audience',<input className="glass-input" placeholder="Business owners, CTOs" value={formData.audience} onChange={e=>setFormData({...formData,audience:e.target.value})} disabled={polling||submitting}/>)}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {F('Goal',<input className="glass-input" placeholder="Lead generation" value={formData.goal} onChange={e=>setFormData({...formData,goal:e.target.value})} disabled={polling||submitting}/>)}
              {F('Platform',<select className="glass-select" value={formData.platform} onChange={e=>setFormData({...formData,platform:e.target.value})} disabled={polling||submitting}>{plats.map(p=><option key={p}>{p}</option>)}</select>)}
            </div>
            {F(<span style={{display:'flex',alignItems:'center',gap:4}}><Globe style={{width:12,height:12,color:'var(--text-muted)'}}/> Reference URL</span>,
              <input type="url" className="glass-input" placeholder="https://yourbrand.com" value={formData.website_url} onChange={e=>setFormData({...formData,website_url:e.target.value})} disabled={polling||submitting}/>)}
            <button type="submit" disabled={polling||submitting} className="btn-primary" style={{width:'100%',marginTop:8}}>
              {submitting?<><Loader style={{width:14,height:14,animation:'spin 1.5s linear infinite'}}/> Enqueuing...</>:<><Sparkles style={{width:14,height:14}}/> Generate Article</>}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div style={{minHeight:400}}>
          {!activeJobDetails&&(
            <div className="glass-panel" style={{padding:'64px 32px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:400}}>
              <Sparkles className="animate-float" style={{width:40,height:40,color:'var(--accent-violet)',opacity:0.5}}/>
              <h3 style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',margin:'16px 0 0'}}>Ready to Generate</h3>
              <p style={{fontSize:12,color:'var(--text-tertiary)',maxWidth:350,margin:'8px auto 0'}}>Configure your campaign settings and click Generate to create AI-powered content.</p>
            </div>
          )}

          {activeJobDetails&&(
            <div className="glass-panel" style={{overflow:'hidden',minHeight:400,display:'flex',flexDirection:'column'}}>
              {/* Header */}
              <div style={{borderBottom:'1px solid var(--border-glass)',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--bg-glass)'}}>
                <div><span className="label" style={{margin:0,fontSize:9}}>Generation Monitor</span><h4 style={{fontSize:13,fontWeight:700,color:'var(--text-primary)',margin:'2px 0 0',maxWidth:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{activeJobDetails.topic}</h4></div>
                {(activeJobDetails.status==='completed'||activeJobDetails.status==='failed')&&<button onClick={reset} className="btn-secondary" style={{fontSize:11,padding:'6px 12px'}}>New Content</button>}
                {(activeJobDetails.status==='pending'||activeJobDetails.status==='processing')&&<button onClick={()=>handleCancel(activeJobDetails.id)} className="btn-secondary" style={{fontSize:11,padding:'6px 12px',color:'#dc2626',borderColor:'#dc2626',display:'flex',alignItems:'center',gap:4}}><XCircle style={{width:12,height:12}}/> Cancel</button>}
              </div>

              {/* Status */}
              <div style={{borderBottom:'1px solid var(--border-glass)',padding:'16px 24px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    {activeJobDetails.status==='pending'&&<span style={{width:28,height:28,borderRadius:'50%',background:'var(--bg-glass-strong)',display:'flex',alignItems:'center',justifyContent:'center'}}><Clock style={{width:14,height:14,color:'var(--text-secondary)'}}/></span>}
                    {activeJobDetails.status==='processing'&&<span style={{width:28,height:28,borderRadius:'50%',background:'var(--accent-violet)',display:'flex',alignItems:'center',justifyContent:'center'}}><Loader style={{width:14,height:14,color:'#fff',animation:'spin 1.5s linear infinite'}}/></span>}
                    {activeJobDetails.status==='completed'&&<span style={{width:28,height:28,borderRadius:'50%',background:'rgba(16,185,129,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}><CheckCircle2 style={{width:14,height:14,color:'#34d399'}}/></span>}
                    {activeJobDetails.status==='failed'&&<span style={{width:28,height:28,borderRadius:'50%',background:'rgba(239,68,68,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}><AlertCircle style={{width:14,height:14,color:'#f87171'}}/></span>}
                    <div>
                      <p style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',margin:0,textTransform:'capitalize'}}>Status: {activeJobDetails.status}</p>
                      <p style={{fontSize:10,color:'var(--text-tertiary)',margin:'2px 0 0'}}>
                        {activeJobDetails.status==='pending'&&'Waiting for worker...'}{activeJobDetails.status==='processing'&&'AI writing content...'}{activeJobDetails.status==='completed'&&'Generated successfully!'}{activeJobDetails.status==='failed'&&'Error during generation.'}
                      </p>
                    </div>
                  </div>
                  <span style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace'}}>ID: {activeJobDetails.id?.slice(0,8)}</span>
                </div>
                {(activeJobDetails.status==='pending'||activeJobDetails.status==='processing')&&(
                  <div style={{width:'100%',height:3,background:'var(--bg-glass-strong)',borderRadius:100,marginTop:12,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:100,background:'var(--accent-violet)',transition:'width 3s ease',width:activeJobDetails.status==='pending'?'8%':'75%'}}/>
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{flex:1,padding:24,overflow:'auto',maxHeight:450}}>
                {(activeJobDetails.status==='pending'||activeJobDetails.status==='processing')&&(
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 0',gap:12}}>
                    <Loader style={{width:24,height:24,color:'var(--accent-violet)',animation:'spin 1.5s linear infinite'}}/>
                    <p style={{fontSize:12,color:'var(--text-secondary)'}}>AI is writing. You can navigate away — this runs in background.</p>
                  </div>
                )}
                {activeJobDetails.status==='failed'&&(
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 0',gap:16,textAlign:'center',maxWidth:400,margin:'0 auto'}}>
                    <AlertCircle style={{width:32,height:32,color:'#ef4444'}}/>
                    <div><h4 style={{fontSize:13,fontWeight:700,color:'var(--text-primary)',margin:0}}>Generation Failed</h4>
                    <p style={{fontSize:11,color:'#f87171',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:'var(--radius-sm)',padding:12,fontFamily:'monospace',margin:'8px 0 0',wordBreak:'break-all',maxHeight:120,overflow:'auto'}}>{activeJobDetails.error_message||'Unknown error.'}</p></div>
                    <button onClick={()=>retry(activeJobDetails.id)} className="btn-primary" style={{fontSize:12}}><RefreshCw style={{width:14,height:14}}/> Retry</button>
                  </div>
                )}
                {activeJobDetails.status==='completed'&&activeJobDetails.result_content&&(
                  <div style={{display:'flex',flexDirection:'column',gap:16}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--border-glass)',paddingBottom:12}}>
                      <h5 className="label" style={{margin:0,display:'flex',alignItems:'center',gap:6}}><FileText style={{width:14,height:14}}/> Generated Copy</h5>
                      <button onClick={()=>copy(activeJobDetails.result_content)} className="btn-secondary" style={{fontSize:11,padding:'6px 12px'}}><Copy style={{width:12,height:12}}/> Copy</button>
                    </div>
                    <div style={{background:'var(--bg-glass)',border:'1px solid var(--border-glass)',borderRadius:'var(--radius-sm)',padding:24,fontSize:13,color:'var(--text-primary)',whiteSpace:'pre-wrap',lineHeight:1.7,maxHeight:400,overflow:'auto',fontFamily:'Inter, sans-serif'}}>
                      {activeJobDetails.result_content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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






export default BlogGenerator;
