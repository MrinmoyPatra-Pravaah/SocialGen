import React, { useState, useMemo } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';
import api from '../services/api';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Trash2, Edit3, X, Sparkles } from 'lucide-react';


const platformColorMap = {
  'LinkedIn': 'platform-linkedin', 'Instagram': 'platform-instagram',
  'Facebook': 'platform-facebook', 'Twitter/X': 'platform-twitter',
  'YouTube': 'platform-youtube', 'Pinterest': 'platform-pinterest', 'Other': 'badge-neutral',
};


const platforms = ['LinkedIn','Instagram','Facebook','Twitter/X','YouTube','Pinterest','Other'];
const frequencies = ['Daily','Weekly','Custom'];
const goals = ['Brand Awareness','Lead Generation','Conversion','Engagement','Education'];


const fmtDate = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};
const todayStr = fmtDate(new Date());


const Calendar = () => {
  const { campaigns, fetchCampaigns, showToast } = useGlobalState();
  const [cur, setCur] = useState(new Date());
  const [view, setView] = useState('month');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sel, setSel] = useState(null);
  const [editing, setEditing] = useState(false);
  const init = { campaign_name:'', content_topic:'', platform:'LinkedIn', website_url:'', start_date:'', end_date:'', posting_frequency:'Weekly', content_goal:'Brand Awareness', notes:'' };
  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const nav = (dir) => { const d=new Date(cur); if(view==='month')d.setMonth(d.getMonth()+dir); else if(view==='week')d.setDate(d.getDate()+dir*7); else d.setDate(d.getDate()+dir); setCur(d); };
  const openNew = (ds) => { setConfirmDelete(false); setSel(null); setEditing(true); setForm({...init,start_date:ds||todayStr,end_date:ds||todayStr}); setDrawerOpen(true); };
  const openEvt = (e,ev) => { ev.stopPropagation(); setConfirmDelete(false); setSel(e); setForm({...init,campaign_name:e.campaign_name,content_topic:e.content_topic,platform:e.platform,website_url:e.website_url??'',start_date:e.start_date,end_date:e.end_date,posting_frequency:e.posting_frequency,content_goal:e.content_goal,notes:e.notes??''}); setEditing(false); setDrawerOpen(true); };


  const submit = async(ev) => {
    ev.preventDefault();
    if(!form.campaign_name||!form.content_topic||!form.start_date||!form.end_date){showToast('Fill required fields.','error');return;}
    setSaving(true);
    try{ if(sel){await api.put(`/api/calendar/${sel.id}`,form);showToast('Updated!','success');}else{await api.post('/api/calendar',form);showToast('Scheduled!','success');} fetchCampaigns(true);setDrawerOpen(false); }catch{showToast('Error saving.','error');}finally{setSaving(false);}
  };
  const del = async()=>{
    if(!sel)return;
    if(!confirmDelete){
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try{
      await api.delete(`/api/calendar/${sel.id}`);
      showToast('Removed.','success');
      fetchCampaigns(true);
      setDrawerOpen(false);
    }catch{
      showToast('Error.','error');
    }finally{
      setSaving(false);
      setConfirmDelete(false);
    }
  };


  const handleTrigger = async () => {
    if (!sel) return;
    setTriggering(true);
    try {
      const response = await api.post(`/api/calendar/${sel.id}/trigger`);
      if (response.data?.success) {
        showToast('Successfully generated and posted campaign content!', 'success');
        setDrawerOpen(false);
      } else {
        showToast('Failed to post campaign content.', 'error');
      }
    } catch (err) {
      console.error('[Trigger Campaign] UI request failed:', err);
      showToast('Error triggering campaign post generation.', 'error');
    } finally {
      setTriggering(false);
    }
  };


  const monthData = useMemo(() => {
    const y=cur.getFullYear(),m=cur.getMonth(),fd=new Date(y,m,1).getDay(),td=new Date(y,m+1,0).getDate(),pd=new Date(y,m,0).getDate(),days=[];
    for(let i=fd-1;i>=0;i--){const d=new Date(y,m-1,pd-i);days.push({d:pd-i,c:false,s:fmtDate(d)});}
    for(let i=1;i<=td;i++){const d=new Date(y,m,i);days.push({d:i,c:true,s:fmtDate(d)});}
    const r=42-days.length;for(let i=1;i<=r;i++){const d=new Date(y,m+1,i);days.push({d:i,c:false,s:fmtDate(d)});}
    return days;
  },[cur]);

  const weekData = useMemo(() => {
    const days=[],d=new Date(cur);d.setDate(d.getDate()-d.getDay());
    for(let i=0;i<7;i++){const w=new Date(d);days.push({d:w.getDate(),c:w.getMonth()===cur.getMonth(),s:fmtDate(w),l:w.toLocaleDateString(undefined,{weekday:'short'})});d.setDate(d.getDate()+1);}
    return days;
  },[cur]);

  const evts = (ds) => campaigns.filter(c=>ds>=c.start_date&&ds<=c.end_date);
  const mLabel = cur.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const dLabel = cur.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});

  const F = (l,ch) => <div><label className="label">{l}</label>{ch}</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Toolbar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:16,borderBottom:'1px solid var(--border-glass)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div className="glass-panel" style={{display:'flex',padding:2,borderRadius:'var(--radius-sm)'}}>
            <button onClick={()=>nav(-1)} className="btn-icon"><ChevronLeft style={{width:16,height:16}}/></button>
            <button onClick={()=>nav(1)} className="btn-icon"><ChevronRight style={{width:16,height:16}}/></button>
          </div>
          <button onClick={()=>setCur(new Date())} className="btn-secondary" style={{padding:'6px 14px',fontSize:12}}>Today</button>
          <span style={{fontSize:15,fontWeight:700,color:'var(--text-primary)'}}>{view==='day'?dLabel:mLabel}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div className="glass-panel" style={{display:'flex',padding:2,borderRadius:'var(--radius-sm)'}}>
            {['month','week','day'].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:'6px 14px',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',borderRadius:'var(--radius-sm)',border:'none',cursor:'pointer',transition:'all 0.2s',background:view===v?'var(--bg-glass-strong)':'transparent',color:view===v?'var(--text-primary)':'var(--text-tertiary)'}}>{v}</button>
            ))}
          </div>
          <button onClick={()=>openNew(todayStr)} className="btn-primary" style={{padding:'8px 16px',fontSize:12}}><Plus style={{width:14,height:14}}/> Schedule</button>
        </div>
      </div>

      <div className="glass-panel" style={{overflow:'hidden'}}>
        {view==='month'&&<div>
          <div className="calendar-grid" style={{background:'var(--bg-glass)'}}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} className="calendar-day-header">{d}</div>)}
          </div>
          <div className="calendar-grid">
            {monthData.map((cell,i)=>{const es=evts(cell.s);const isT=cell.s===todayStr;return(
              <div key={i} onClick={()=>openNew(cell.s)} className="calendar-cell" style={{color:cell.c?'var(--text-primary)':'var(--text-muted)',background:cell.c?'transparent':'var(--bg-glass)'}}>
                <div style={{marginBottom:4}}><span style={{display:'inline-flex',width:22,height:22,alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,borderRadius:'50%',...(isT?{background:'var(--accent-violet)',color:'#fff'}:{})}}>{cell.d}</span></div>
                <div style={{display:'flex',flexDirection:'column',gap:3,overflow:'auto',maxHeight:75}}>
                  {es.map(evt=><div key={evt.id} onClick={e=>openEvt(evt,e)} className={`badge ${platformColorMap[evt.platform]||'badge-neutral'}`} style={{fontSize:9,cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'2px 6px',borderRadius:4,display:'block'}} title={evt.campaign_name}>{evt.campaign_name}</div>)}
                </div>
              </div>
            );})}
          </div>
        </div>}
        {view==='week'&&<div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid var(--border-glass)',background:'var(--bg-glass)'}}>
            {weekData.map((c,i)=>{const isT=c.s===todayStr;return<div key={i} style={{padding:12,textAlign:'center'}}><span style={{fontSize:10,fontWeight:600,textTransform:'uppercase',color:'var(--text-muted)'}}>{c.l}</span><div style={{marginTop:4,width:28,height:28,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,...(isT?{background:'var(--accent-violet)',color:'#fff'}:{color:'var(--text-primary)'})}}>{c.d}</div></div>})}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',minHeight:350}}>
            {weekData.map((c,i)=>{const es=evts(c.s);return<div key={i} onClick={()=>openNew(c.s)} style={{padding:12,borderRight:'1px solid var(--border-glass)',cursor:'pointer',display:'flex',flexDirection:'column',gap:8}}>
              {es.map(evt=><div key={evt.id} onClick={e=>openEvt(evt,e)} className={`badge ${platformColorMap[evt.platform]||'badge-neutral'}`} style={{fontSize:9,cursor:'pointer',display:'flex',flexDirection:'column',gap:2,padding:'6px 8px',borderRadius:6,whiteSpace:'normal'}}><span style={{fontWeight:700}}>{evt.campaign_name}</span><span style={{opacity:0.7}}>{evt.content_topic}</span></div>)}
            </div>})}
          </div>
        </div>}
        {view==='day'&&<div style={{padding:24,minHeight:300}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--border-glass)',paddingBottom:16,marginBottom:16}}>
            <span className="label" style={{margin:0}}>Scheduled</span>
            <button onClick={()=>openNew(fmtDate(cur))} className="btn-secondary" style={{padding:'6px 12px',fontSize:11}}><Plus style={{width:12,height:12}}/> Add</button>
          </div>
          {evts(fmtDate(cur)).length===0?<div style={{textAlign:'center',padding:'50px 24px'}}><CalendarIcon style={{width:32,height:32,color:'var(--text-muted)',margin:'0 auto'}}/><p style={{fontSize:12,color:'var(--text-tertiary)',margin:'12px 0 0'}}>Nothing scheduled</p></div>
          :<div style={{display:'flex',flexDirection:'column',gap:12}}>
            {evts(fmtDate(cur)).map(evt=><div key={evt.id} onClick={e=>openEvt(evt,e)} className="glass-card" style={{padding:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
              <div><div style={{display:'flex',alignItems:'center',gap:8}}><span className={`badge ${platformColorMap[evt.platform]||'badge-neutral'}`} style={{fontSize:9}}>{evt.platform}</span><h4 style={{fontSize:14,fontWeight:700,color:'var(--text-primary)',margin:0}}>{evt.campaign_name}</h4></div><p style={{fontSize:12,color:'var(--text-secondary)',margin:'4px 0 0'}}>Topic: {evt.content_topic}</p></div>
              <div style={{flexShrink:0,fontSize:11,color:'var(--text-tertiary)',fontWeight:500}}>{evt.content_goal} • {evt.posting_frequency}</div>
            </div>)}
          </div>}
        </div>}
      </div>

      {/* Drawer */}
      {drawerOpen&&<div style={{position:'fixed',inset:0,zIndex:40,display:'flex',justifyContent:'flex-end'}}>
        <div onClick={()=>{setDrawerOpen(false); setConfirmDelete(false);}} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)'}}/>
        <div className="animate-slide-in-right" style={{position:'relative',width:'100%',maxWidth:440,background:'var(--bg-surface)',height:'100%',display:'flex',flexDirection:'column',borderLeft:'1px solid var(--border-glass)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',borderBottom:'1px solid var(--border-glass)'}}>
            <h3 style={{fontSize:14,fontWeight:700,color:'var(--text-primary)',margin:0}}>{sel?(editing?'Edit Campaign':'Details'):'New Campaign'}</h3>
            <button onClick={()=>{setDrawerOpen(false); setConfirmDelete(false);}} className="btn-icon"><X style={{width:16,height:16}}/></button>
          </div>
          <form onSubmit={submit} style={{flex:1,overflow:'auto',padding:24,display:'flex',flexDirection:'column',gap:16}}>
            {F('Campaign Name *',editing?<input required className="glass-input" placeholder="Summer Launch" value={form.campaign_name} onChange={e=>setForm({...form,campaign_name:e.target.value})}/>:<p style={{fontSize:14,fontWeight:700,color:'var(--text-primary)',margin:0}}>{form.campaign_name}</p>)}
            {F('Content Topic *',editing?<input required className="glass-input" placeholder="AI for marketing" value={form.content_topic} onChange={e=>setForm({...form,content_topic:e.target.value})}/>:<p style={{fontSize:13,color:'var(--text-secondary)',margin:0}}>{form.content_topic}</p>)}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {F('Platform',editing?<select className="glass-select" value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})}>{platforms.map(p=><option key={p}>{p}</option>)}</select>:<span className={`badge ${platformColorMap[form.platform]||'badge-neutral'}`}>{form.platform}</span>)}
              {F('Goal',editing?<select className="glass-select" value={form.content_goal} onChange={e=>setForm({...form,content_goal:e.target.value})}>{goals.map(g=><option key={g}>{g}</option>)}</select>:<p style={{fontSize:13,fontWeight:600,color:'var(--text-secondary)',margin:0}}>{form.content_goal}</p>)}
            </div>
            {F('Website URL',editing?<input type="url" className="glass-input" placeholder="https://..." value={form.website_url} onChange={e=>setForm({...form,website_url:e.target.value})}/>:form.website_url?<a href={form.website_url} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:'var(--accent-cyan)'}}>{form.website_url}</a>:<p style={{fontSize:12,color:'var(--text-muted)',fontStyle:'italic',margin:0}}>None</p>)}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {F('Start Date *',editing?<input type="date" required className="glass-input" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/>:<p style={{fontSize:12,color:'var(--text-secondary)',margin:0}}>{form.start_date}</p>)}
              {F('End Date *',editing?<input type="date" required className="glass-input" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})}/>:<p style={{fontSize:12,color:'var(--text-secondary)',margin:0}}>{form.end_date}</p>)}
            </div>
            {F('Frequency',editing?<select className="glass-select" value={form.posting_frequency} onChange={e=>setForm({...form,posting_frequency:e.target.value})}>{frequencies.map(f=><option key={f}>{f}</option>)}</select>:<p style={{fontSize:13,fontWeight:500,color:'var(--text-secondary)',margin:0}}>{form.posting_frequency}</p>)}
            {F('Notes',editing?<textarea className="glass-textarea" rows={3} placeholder="Guidelines..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>:form.notes?<p style={{fontSize:12,color:'var(--text-secondary)',background:'var(--bg-glass)',padding:12,borderRadius:'var(--radius-sm)',border:'1px solid var(--border-glass)',margin:0,whiteSpace:'pre-wrap'}}>{form.notes}</p>:<p style={{fontSize:12,color:'var(--text-muted)',fontStyle:'italic',margin:0}}>No notes</p>)}
            <div style={{paddingTop:16,borderTop:'1px solid var(--border-glass)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
              {sel&&<button type="button" onClick={del} disabled={saving || triggering} className="btn-danger" style={{fontSize:12, background: confirmDelete ? '#dc2626' : 'rgba(239, 68, 68, 0.1)', color: confirmDelete ? '#fff' : '#ef4444', borderColor: '#ef4444'}}><Trash2 style={{width:14,height:14}}/> {confirmDelete ? 'Confirm Delete' : 'Delete'}</button>}
              <div style={{flex:1,display:'flex',justifyContent:'flex-end',alignItems:'center',gap:10}}>
                {!editing ? (
                  <>
                    <button type="button" onClick={handleTrigger} disabled={triggering} className="btn-primary" style={{fontSize:12, background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#fff'}}>
                      <Sparkles style={{width:14,height:14}}/> {triggering ? 'Posting...' : 'Generate & Post'}
                    </button>
                    <button type="button" onClick={()=>setEditing(true)} className="btn-secondary" style={{fontSize:12}}><Edit3 style={{width:14,height:14}}/> Edit</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={()=>{if(sel)setEditing(false);else setDrawerOpen(false);}} disabled={saving} className="btn-secondary" style={{fontSize:12}}>Cancel</button>
                    <button type="submit" disabled={saving} className="btn-primary" style={{fontSize:12}}>{saving?'Saving...':'Save'}</button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
};

export default Calendar;
