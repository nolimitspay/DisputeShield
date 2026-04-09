import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from './api';

const C = {
  bg: '#0f172a', sidebar: '#1e293b', card: '#1e293b', border: '#334155',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6',
  text: '#e2e8f0', muted: '#94a3b8', dark: '#64748b', white: '#fff',
};
const PIE_C = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6'];

function useAuth() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('nld_user')); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem('nld_token'));
  const login = async (email, password) => { const { data } = await api.post('/api/auth/login', { email, password }); localStorage.setItem('nld_token', data.token); localStorage.setItem('nld_user', JSON.stringify(data.user)); setToken(data.token); setUser(data.user); };
  const signup = async (name, email, password, company) => { const { data } = await api.post('/api/auth/signup', { name, email, password, company }); localStorage.setItem('nld_token', data.token); localStorage.setItem('nld_user', JSON.stringify(data.user)); setToken(data.token); setUser(data.user); };
  const logout = () => { localStorage.removeItem('nld_token'); localStorage.removeItem('nld_user'); setToken(null); setUser(null); };
  return { user, token, login, signup, logout, isAuth: !!token };
}

function Sidebar({ user, onLogout }) {
  const loc = useLocation();
  const links = [
    { path: '/dashboard', icon: '\u2302', label: 'Home' },
    { path: '/disputes', icon: '\u2694', label: 'Disputes' },
    { path: '/alerts', icon: '\u25B3', label: 'Chargeback Alerts' },
    { path: '/mids', icon: '\u25CE', label: 'MIDs' },
    { path: '/notifications', icon: '\u266A', label: 'Notifications' },
    { path: '/rules', icon: '\u2699', label: 'Rules' },
    { path: '/settings', icon: '\u2726', label: 'Settings' },
  ];
  return (
    <div style={{width:260,minHeight:'100vh',background:C.sidebar,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',position:'fixed',left:0,top:0,zIndex:100}}>
      <div style={{padding:'24px 20px',borderBottom:`1px solid ${C.border}`}}>
        <h1 style={{margin:0,fontSize:20,color:C.green,fontWeight:700}}>NoLimitsDisputes</h1>
        <span style={{fontSize:11,color:C.muted}}>Web App</span>
      </div>
      <nav style={{flex:1,padding:'12px 0'}}>
        {links.map(l => {const a=loc.pathname.startsWith(l.path);return(
          <Link key={l.path} to={l.path} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',color:a?C.white:C.muted,background:a?C.green+'20':'transparent',borderLeft:a?`3px solid ${C.green}`:'3px solid transparent',textDecoration:'none',fontSize:14}}>{l.icon} {l.label}</Link>
        );})}
      </nav>
      <div style={{padding:'16px 20px',borderTop:`1px solid ${C.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:C.green,display:'flex',alignItems:'center',justifyContent:'center',color:C.bg,fontWeight:700,fontSize:14}}>{(user?.name||'U')[0]}</div>
          <div><div style={{fontSize:13,color:C.text,fontWeight:500}}>{user?.name}</div><div style={{fontSize:11,color:C.muted}}>{user?.plan||'starter'}</div></div>
        </div>
        <button onClick={onLogout} style={{width:'100%',padding:8,background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,cursor:'pointer',fontSize:12}}>Logout</button>
      </div>
    </div>
  );
}

const Stat = ({label,value,sub,color}) => (<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'20px 24px',flex:1,minWidth:200}}><div style={{fontSize:13,color:C.muted,marginBottom:4}}>{label}</div><div style={{fontSize:28,fontWeight:700,color:color||C.text}}>{value}</div>{sub&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>{sub}</div>}</div>);

const Badge = ({status}) => {const m={auto_refunded:{bg:'#22c55e20',c:'#22c55e',t:'Auto Refunded'},manual_refunded:{bg:'#3b82f620',c:'#3b82f6',t:'Manual Refund'},pending:{bg:'#f59e0b20',c:'#f59e0b',t:'Pending'},ignored:{bg:'#64748b20',c:'#64748b',t:'Ignored'},expired:{bg:'#ef444420',c:'#ef4444',t:'Expired'}};const s=m[status]||m.pending;return<span style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:s.bg,color:s.c}}>{s.t}</span>;};

const NetCard = ({name,active}) => (<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,flex:1,minWidth:180}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><span style={{fontWeight:700,fontSize:16,color:C.text}}>{name}</span><span style={{padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:600,background:active?'#22c55e20':'#ef444420',color:active?'#22c55e':'#ef4444'}}>{active?'ACTIVE':'INACTIVE'}</span></div><button style={{padding:'8px 16px',background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,cursor:'pointer',fontSize:12}}>Configure</button></div>);

function DashboardPage() {
  const [stats,setStats]=useState(null);const [chart,setChart]=useState([]);const [activity,setActivity]=useState([]);const [loading,setLoading]=useState(true);
  useEffect(()=>{Promise.all([api.get('/api/dashboard/stats').then(r=>setStats(r.data)),api.get('/api/dashboard/chart?groupBy=day').then(r=>setChart(r.data)),api.get('/api/dashboard/activity?limit=10').then(r=>setActivity(r.data))]).finally(()=>setLoading(false));},[]);
  if(loading)return<div style={{padding:40,color:C.muted}}>Loading...</div>;
  return(<div>
    <h2 style={{color:C.text,marginBottom:24,fontSize:22}}>Dashboard</h2>
    <div style={{display:'flex',gap:16,marginBottom:24,flexWrap:'wrap'}}><NetCard name="RDR" active={false}/><NetCard name="ETHOCA" active={false}/><NetCard name="CDRN" active={false}/></div>
    <div style={{display:'flex',gap:16,marginBottom:24,flexWrap:'wrap'}}>
      <Stat label="Chargebacks Stopped" value={stats?.prevented||0} sub={`${(stats?.preventionRate||0).toFixed(1)}%`} color={C.green}/>
      <Stat label="Pending Alerts" value={stats?.pending||0} color={C.yellow}/>
      <Stat label="Refunded Value" value={`$${(stats?.totalRefunded||0).toFixed(2)}`} color={C.blue}/>
      <Stat label="Alert Cost" value={`$${(stats?.totalAlertCost||0).toFixed(2)}`} color={C.red}/>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:24}}>
      <h3 style={{color:C.text,marginBottom:16,fontSize:16}}>Alert Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="date" stroke={C.muted} fontSize={11}/><YAxis stroke={C.muted} fontSize={11}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text}}/><Area type="monotone" dataKey="alerts" stroke={C.green} fill={C.green+'30'} name="Total Alerts"/><Area type="monotone" dataKey="prevented" stroke={C.blue} fill={C.blue+'30'} name="Prevented"/></AreaChart>
      </ResponsiveContainer>
    </div>
    {stats?.bySource&&Object.keys(stats.bySource).length>0&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:24}}><h3 style={{color:C.text,marginBottom:16,fontSize:16}}>By Source</h3><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={Object.entries(stats.bySource).map(([n,d])=>({name:n,value:d.total}))} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{Object.keys(stats.bySource).map((_,i)=><Cell key={i} fill={PIE_C[i%PIE_C.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>}
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24}}>
      <h3 style={{color:C.text,marginBottom:16,fontSize:16}}>Recent Activity</h3>
      {activity.length===0?<p style={{color:C.muted}}>No activity yet. Alerts will appear here once your descriptors are enrolled.</p>:activity.map(a=>(<div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${C.border}`}}><span style={{color:C.text,fontSize:13}}>{a.details}</span><span style={{color:C.muted,fontSize:11}}>{new Date(a.createdAt).toLocaleString()}</span></div>))}
    </div>
  </div>);
}

function AlertsPage() {
  const [alerts,setAlerts]=useState([]);const [pagination,setPagination]=useState({});const [filter,setFilter]=useState({status:'',source:'',page:1});const [loading,setLoading]=useState(true);const nav=useNavigate();
  const fetch_=useCallback(async()=>{setLoading(true);const p=new URLSearchParams();if(filter.status)p.set('status',filter.status);if(filter.source)p.set('source',filter.source);p.set('page',filter.page);p.set('limit',25);const{data}=await api.get(`/api/alerts?${p}`);setAlerts(data.alerts);setPagination(data.pagination);setLoading(false);},[filter]);
  useEffect(()=>{fetch_();},[fetch_]);
  const refund=async id=>{if(!window.confirm('Process refund?'))return;await api.post(`/api/alerts/${id}/refund`);fetch_();};
  const ignore=async id=>{await api.post(`/api/alerts/${id}/ignore`);fetch_();};
  return(<div>
    <h2 style={{color:C.text,marginBottom:24,fontSize:22}}>Chargeback Alerts</h2>
    <div style={{display:'flex',gap:16,marginBottom:24,flexWrap:'wrap'}}><NetCard name="RDR" active={false}/><NetCard name="ETHOCA" active={false}/><NetCard name="CDRN" active={false}/></div>
    <div style={{display:'flex',gap:12,marginBottom:16}}>
      <select value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value,page:1})} style={{padding:'8px 16px',background:C.card,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,fontSize:13}}><option value="">All Status</option><option value="pending">Pending</option><option value="auto_refunded">Auto Refunded</option><option value="manual_refunded">Manual Refund</option><option value="ignored">Ignored</option><option value="expired">Expired</option></select>
      <select value={filter.source} onChange={e=>setFilter({...filter,source:e.target.value,page:1})} style={{padding:'8px 16px',background:C.card,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,fontSize:13}}><option value="">All Sources</option><option value="RDR">RDR</option><option value="ETHOCA">Ethoca</option><option value="CDRN">CDRN</option></select>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['Alert ID','Source','Amount','Reason','Status','Date','Actions'].map(h=><th key={h} style={{padding:'12px 16px',textAlign:'left',color:C.muted,fontSize:12,fontWeight:600}}>{h}</th>)}</tr></thead>
      <tbody>{loading?<tr><td colSpan={7} style={{padding:40,textAlign:'center',color:C.muted}}>Loading...</td></tr>:alerts.length===0?<tr><td colSpan={7} style={{padding:40,textAlign:'center',color:C.muted}}>No alerts yet</td></tr>:alerts.map(a=>(
        <tr key={a.id} style={{borderBottom:`1px solid ${C.border}`,cursor:'pointer'}} onClick={()=>nav(`/alerts/${a.id}`)}>
          <td style={{padding:'12px 16px',color:C.text,fontSize:13}}>{(a.externalAlertId||a.id).slice(0,16)}...</td>
          <td style={{padding:'12px 16px'}}><span style={{padding:'3px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:a.source==='RDR'?'#3b82f620':a.source==='ETHOCA'?'#8b5cf620':'#f59e0b20',color:a.source==='RDR'?'#3b82f6':a.source==='ETHOCA'?'#8b5cf6':'#f59e0b'}}>{a.source}</span></td>
          <td style={{padding:'12px 16px',color:C.text,fontWeight:600,fontSize:13}}>${(a.amount||0).toFixed(2)}</td>
          <td style={{padding:'12px 16px',color:C.muted,fontSize:13}}>{a.reasonDescription||a.reasonCode||'\u2014'}</td>
          <td style={{padding:'12px 16px'}}><Badge status={a.status}/></td>
          <td style={{padding:'12px 16px',color:C.muted,fontSize:12}}>{new Date(a.createdAt).toLocaleDateString()}</td>
          <td style={{padding:'12px 16px'}} onClick={e=>e.stopPropagation()}>{a.status==='pending'&&<div style={{display:'flex',gap:6}}><button onClick={()=>refund(a.id)} style={{padding:'4px 10px',background:C.green,color:C.bg,border:'none',borderRadius:4,fontSize:11,cursor:'pointer',fontWeight:600}}>Refund</button><button onClick={()=>ignore(a.id)} style={{padding:'4px 10px',background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:4,fontSize:11,cursor:'pointer'}}>Ignore</button></div>}</td>
        </tr>))}</tbody></table>
      {pagination.pages>1&&<div style={{display:'flex',justifyContent:'center',gap:8,padding:16}}>{Array.from({length:pagination.pages},(_,i)=><button key={i} onClick={()=>setFilter({...filter,page:i+1})} style={{padding:'6px 12px',background:filter.page===i+1?C.green:'transparent',color:filter.page===i+1?C.bg:C.muted,border:`1px solid ${filter.page===i+1?C.green:C.border}`,borderRadius:6,cursor:'pointer',fontSize:12}}>{i+1}</button>)}</div>}
    </div>
  </div>);
}

function DisputesPage() {
  const [alerts,setAlerts]=useState([]);const [tab,setTab]=useState('all');
  useEffect(()=>{api.get('/api/alerts?limit=100').then(r=>setAlerts(r.data.alerts));},[]);
  const filtered=tab==='all'?alerts:tab==='pending'?alerts.filter(a=>a.status==='pending'):alerts.filter(a=>a.source===tab.toUpperCase());
  const tabs=['all','rdr','ethoca','cdrn','pending'];
  return(<div>
    <h2 style={{color:C.text,marginBottom:24,fontSize:22}}>Disputes</h2>
    <div style={{display:'flex',gap:16,marginBottom:24,flexWrap:'wrap'}}>
      <Stat label="Action Needed" value={alerts.filter(a=>a.status==='pending').length} color={C.yellow}/>
      <Stat label="Processing" value={alerts.filter(a=>['auto_refunded','manual_refunded'].includes(a.status)).length} color={C.blue}/>
      <Stat label="Total" value={alerts.length} color={C.text}/>
    </div>
    <div style={{display:'flex',gap:0,marginBottom:16,background:C.card,borderRadius:8,border:`1px solid ${C.border}`,overflow:'hidden',width:'fit-content'}}>{tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'10px 20px',background:tab===t?C.green+'20':'transparent',color:tab===t?C.green:C.muted,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===t?600:400,textTransform:'capitalize'}}>{t==='pending'?'Action Needed':t==='all'?'All Disputes':t.toUpperCase()}</button>)}</div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['Alert ID','Source','Amount','Reason','Status','Date','Deadline'].map(h=><th key={h} style={{padding:'12px 16px',textAlign:'left',color:C.muted,fontSize:12,fontWeight:600}}>{h}</th>)}</tr></thead>
      <tbody>{filtered.length===0?<tr><td colSpan={7} style={{padding:40,textAlign:'center',color:C.muted}}>No disputes</td></tr>:filtered.map(a=>(
        <tr key={a.id} style={{borderBottom:`1px solid ${C.border}`}}><td style={{padding:'12px 16px',color:C.text,fontSize:13}}>{(a.externalAlertId||a.id).slice(0,20)}</td><td style={{padding:'12px 16px',color:C.muted,fontSize:13}}>{a.source}</td><td style={{padding:'12px 16px',color:C.text,fontWeight:600,fontSize:13}}>${(a.amount||0).toFixed(2)}</td><td style={{padding:'12px 16px',color:C.muted,fontSize:13}}>{a.reasonDescription||'\u2014'}</td><td style={{padding:'12px 16px'}}><Badge status={a.status}/></td><td style={{padding:'12px 16px',color:C.muted,fontSize:12}}>{new Date(a.createdAt).toLocaleDateString()}</td><td style={{padding:'12px 16px',color:a.deadline&&new Date(a.deadline)<new Date()?C.red:C.muted,fontSize:12}}>{a.deadline?new Date(a.deadline).toLocaleDateString():'\u2014'}</td></tr>
      ))}</tbody></table>
    </div>
  </div>);
}

function RulesPage() {
  const [rules,setRules]=useState([]);const [showForm,setShowForm]=useState(false);const [editRule,setEditRule]=useState(null);
  const [form,setForm]=useState({name:'',action:'auto_refund',conditions:{maxAmount:'',minAmount:''}});
  const fetchR=useCallback(async()=>{const{data}=await api.get('/api/rules');setRules(data);},[]);
  useEffect(()=>{fetchR();},[fetchR]);
  const save=async()=>{const p={...form,conditions:{...form.conditions,maxAmount:form.conditions.maxAmount?parseFloat(form.conditions.maxAmount):undefined,minAmount:form.conditions.minAmount?parseFloat(form.conditions.minAmount):undefined}};if(editRule)await api.put(`/api/rules/${editRule.id}`,p);else await api.post('/api/rules',p);setShowForm(false);setEditRule(null);setForm({name:'',action:'auto_refund',conditions:{maxAmount:'',minAmount:''}});fetchR();};
  const del=async id=>{if(!window.confirm('Delete this rule?'))return;await api.delete(`/api/rules/${id}`);fetchR();};
  const toggle=async r=>{await api.put(`/api/rules/${r.id}`,{enabled:!r.enabled});fetchR();};
  const IS={width:'100%',padding:'10px 14px',background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,fontSize:14,boxSizing:'border-box'};
  return(<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
      <h2 style={{color:C.text,fontSize:22,margin:0}}>Rules</h2>
      <button onClick={()=>{setShowForm(true);setEditRule(null);setForm({name:'',action:'auto_refund',conditions:{maxAmount:'',minAmount:''}});}} style={{padding:'10px 20px',background:C.green,color:C.bg,border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13}}>+ New Rule</button>
    </div>
    {showForm&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:24}}>
      <h3 style={{color:C.text,marginBottom:16}}>{editRule?'Edit Rule':'New Rule'}</h3>
      <div style={{display:'grid',gap:16}}>
        <div><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>Rule Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Auto-refund small amounts" style={IS}/></div>
        <div><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>Action</label><select value={form.action} onChange={e=>setForm({...form,action:e.target.value})} style={IS}><option value="auto_refund">Auto Refund</option><option value="flag_review">Flag for Review</option><option value="ignore">Ignore</option></select></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>Max Amount ($)</label><input type="number" value={form.conditions.maxAmount} onChange={e=>setForm({...form,conditions:{...form.conditions,maxAmount:e.target.value}})} placeholder="e.g. 50" style={IS}/></div>
          <div><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>Min Amount ($)</label><input type="number" value={form.conditions.minAmount} onChange={e=>setForm({...form,conditions:{...form.conditions,minAmount:e.target.value}})} placeholder="e.g. 0" style={IS}/></div>
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginTop:20}}>
        <button onClick={save} style={{padding:'10px 24px',background:C.green,color:C.bg,border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13}}>Save Rule</button>
        <button onClick={()=>{setShowForm(false);setEditRule(null);}} style={{padding:'10px 24px',background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,cursor:'pointer',fontSize:13}}>Cancel</button>
      </div>
    </div>}
    {rules.length===0?<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:40,textAlign:'center'}}><p style={{color:C.muted}}>No rules configured yet.</p></div>:rules.map((r,i)=>(
      <div key={r.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center',opacity:r.enabled?1:0.5}}>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{color:C.muted,fontSize:12}}>#{r.priority||i+1}</span>
            <span style={{color:C.text,fontWeight:600,fontSize:14}}>{r.name}</span>
            <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:r.action==='auto_refund'?'#22c55e20':r.action==='flag_review'?'#f59e0b20':'#64748b20',color:r.action==='auto_refund'?'#22c55e':r.action==='flag_review'?'#f59e0b':'#64748b'}}>{r.action.replace('_',' ')}</span>
          </div>
          <div style={{fontSize:12,color:C.muted}}>{r.conditions?.maxAmount&&`Max: $${r.conditions.maxAmount}`}{r.conditions?.minAmount&&` | Min: $${r.conditions.minAmount}`}{r.stats?.timesMatched>0&&` | Matched: ${r.stats.timesMatched}x`}</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>toggle(r)} style={{padding:'6px 12px',background:r.enabled?C.green+'20':'transparent',border:`1px solid ${r.enabled?C.green:C.border}`,color:r.enabled?C.green:C.muted,borderRadius:6,cursor:'pointer',fontSize:11}}>{r.enabled?'ON':'OFF'}</button>
          <button onClick={()=>{setEditRule(r);setForm({name:r.name,action:r.action,conditions:{maxAmount:r.conditions?.maxAmount||'',minAmount:r.conditions?.minAmount||''}});setShowForm(true);}} style={{padding:'6px 12px',background:'transparent',border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,cursor:'pointer',fontSize:11}}>Edit</button>
          <button onClick={()=>del(r.id)} style={{padding:'6px 12px',background:'transparent',border:`1px solid ${C.border}`,color:C.red,borderRadius:6,cursor:'pointer',fontSize:11}}>Delete</button>
        </div>
      </div>
    ))}
  </div>);
}

function MIDsPage() {
  const [descs,setDescs]=useState([]);const [val,setVal]=useState('');
  const fetchD=useCallback(async()=>{const{data}=await api.get('/api/merchants/descriptors');setDescs(data);},[]);
  useEffect(()=>{fetchD();},[fetchD]);
  const add=async()=>{if(!val.trim())return;await api.post('/api/merchants/descriptors',{value:val.trim()});setVal('');fetchD();};
  const rm=async id=>{if(!window.confirm('Remove this descriptor?'))return;await api.delete(`/api/merchants/descriptors/${id}`);fetchD();};
  return(<div>
    <h2 style={{color:C.text,marginBottom:24,fontSize:22}}>MIDs / Descriptors</h2>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:24}}>
      <h3 style={{color:C.text,marginBottom:8,fontSize:16}}>Add Descriptor</h3>
      <p style={{color:C.muted,fontSize:13,marginBottom:16}}>Enter the descriptor that appears on your customers' bank statements.</p>
      <div style={{display:'flex',gap:12}}><input value={val} onChange={e=>setVal(e.target.value)} placeholder="e.g. MYSTORE*ORDER" onKeyDown={e=>e.key==='Enter'&&add()} style={{flex:1,padding:'10px 14px',background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,fontSize:14}}/><button onClick={add} style={{padding:'10px 24px',background:C.green,color:C.bg,border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13}}>+ Add MID</button></div>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{['Descriptor','Status','RDR','Ethoca','CDRN','Added',''].map(h=><th key={h} style={{padding:'12px 16px',textAlign:'left',color:C.muted,fontSize:12,fontWeight:600}}>{h}</th>)}</tr></thead>
      <tbody>{descs.length===0?<tr><td colSpan={7} style={{padding:40,textAlign:'center',color:C.muted}}>No descriptors</td></tr>:descs.map(d=>(
        <tr key={d.id} style={{borderBottom:`1px solid ${C.border}`}}><td style={{padding:'12px 16px',color:C.text,fontWeight:600,fontSize:13}}>{d.value}</td><td style={{padding:'12px 16px'}}><span style={{padding:'3px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:'#22c55e20',color:'#22c55e'}}>Active</span></td><td style={{padding:'12px 16px',color:d.networks?.rdr?C.green:C.dark}}>{d.networks?.rdr?'ON':'OFF'}</td><td style={{padding:'12px 16px',color:d.networks?.ethoca?C.green:C.dark}}>{d.networks?.ethoca?'ON':'OFF'}</td><td style={{padding:'12px 16px',color:d.networks?.cdrn?C.green:C.dark}}>{d.networks?.cdrn?'ON':'OFF'}</td><td style={{padding:'12px 16px',color:C.muted,fontSize:12}}>{new Date(d.createdAt).toLocaleDateString()}</td><td style={{padding:'12px 16px'}}><button onClick={()=>rm(d.id)} style={{padding:'4px 10px',background:'transparent',border:`1px solid ${C.border}`,color:C.red,borderRadius:4,fontSize:11,cursor:'pointer'}}>Remove</button></td></tr>
      ))}</tbody></table>
    </div>
  </div>);
}

function NotificationsPage() {
  const [prefs,setPrefs]=useState({});
  useEffect(()=>{api.get('/api/auth/me').then(r=>setPrefs(r.data.notificationPrefs||{}));},[]);
  const toggle=async k=>{const u={...prefs,[k]:!prefs[k]};setPrefs(u);await api.put('/api/auth/profile',{notificationPrefs:u});};
  const notifs=[{key:'emailAlerts',cat:'Alerts',name:'New Alert Received',desc:'Get notified when a new chargeback alert is received'},{key:'autoRefundNotify',cat:'Alerts',name:'Auto-Refund Executed',desc:'Get notified when an auto-refund is processed'},{key:'weeklyReport',cat:'Reports',name:'Weekly Summary Report',desc:'Receive a weekly summary of your chargeback prevention stats'}];
  let cat='';
  return(<div>
    <h2 style={{color:C.text,marginBottom:24,fontSize:22}}>Notifications</h2>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
      {notifs.map(n=>{const sc=n.cat!==cat;cat=n.cat;return(<React.Fragment key={n.key}>
        {sc&&<div style={{padding:'12px 20px',background:C.bg,borderBottom:`1px solid ${C.border}`,color:C.muted,fontSize:12,fontWeight:700,textTransform:'uppercase'}}>{n.cat}</div>}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderBottom:`1px solid ${C.border}`}}>
          <div><div style={{color:C.text,fontSize:14,fontWeight:500}}>{n.name}</div><div style={{color:C.muted,fontSize:12,marginTop:2}}>{n.desc}</div></div>
          <button onClick={()=>toggle(n.key)} style={{width:48,height:26,borderRadius:13,border:'none',background:prefs[n.key]?C.green:C.border,cursor:'pointer',position:'relative',transition:'background .2s'}}><div style={{width:20,height:20,borderRadius:'50%',background:C.white,position:'absolute',top:3,left:prefs[n.key]?25:3,transition:'left .2s'}}/></button>
        </div>
      </React.Fragment>);})}
    </div>
  </div>);
}

function SettingsPage() {
  const [profile,setProfile]=useState({});const [saving,setSaving]=useState(false);const [onb,setOnb]=useState(null);
  useEffect(()=>{api.get('/api/auth/me').then(r=>setProfile(r.data));api.get('/api/merchants/onboarding-status').then(r=>setOnb(r.data));},[]);
  const save=async()=>{setSaving(true);await api.put('/api/auth/profile',{name:profile.name,company:profile.company});setSaving(false);};
  const IS={width:'100%',padding:'10px 14px',background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,fontSize:14,boxSizing:'border-box'};
  return(<div>
    <h2 style={{color:C.text,marginBottom:24,fontSize:22}}>Settings</h2>
    {onb&&!onb.steps.activated&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><h3 style={{color:C.text,margin:0,fontSize:16}}>Getting Started Guide</h3><span style={{color:C.green,fontSize:13,fontWeight:600}}>{onb.completed} of {onb.total} Steps</span></div>
      <div style={{background:C.bg,borderRadius:4,height:6,marginBottom:16}}><div style={{background:C.green,borderRadius:4,height:6,width:`${onb.percentage}%`}}/></div>
      {Object.entries(onb.steps).map(([k,d])=><div key={k} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0'}}><span style={{width:20,height:20,borderRadius:'50%',background:d?C.green:C.border,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:d?C.bg:C.muted}}>{d?'\u2713':''}</span><span style={{color:d?C.text:C.muted,fontSize:13,textTransform:'capitalize'}}>{k.replace(/([A-Z])/g,' $1')}</span></div>)}
    </div>}
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:24}}>
      <h3 style={{color:C.text,marginBottom:16,fontSize:16}}>Profile</h3>
      <div style={{display:'grid',gap:16,maxWidth:500}}>
        <div><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>Name</label><input value={profile.name||''} onChange={e=>setProfile({...profile,name:e.target.value})} style={IS}/></div>
        <div><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>Company</label><input value={profile.company||''} onChange={e=>setProfile({...profile,company:e.target.value})} style={IS}/></div>
        <div><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>Email</label><input value={profile.email||''} disabled style={{...IS,opacity:0.5}}/></div>
        <div><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>Plan</label><input value={profile.plan||'starter'} disabled style={{...IS,opacity:0.5}}/></div>
        <button onClick={save} disabled={saving} style={{padding:'10px 24px',background:C.green,color:C.bg,border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13,width:'fit-content'}}>{saving?'Saving...':'Save Changes'}</button>
      </div>
    </div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24}}>
      <h3 style={{color:C.text,marginBottom:16,fontSize:16}}>Connected Processors</h3>
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>{['stripe','square','paypal'].map(p=>{const cn=(profile.connectedProcessors||[]).find(cp=>cp.type===p);return(<div key={p} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:16,minWidth:180}}><div style={{fontWeight:600,color:C.text,fontSize:14,textTransform:'capitalize',marginBottom:8}}>{p}</div><span style={{padding:'3px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:cn?'#22c55e20':'#64748b20',color:cn?'#22c55e':'#64748b'}}>{cn?'Connected':'Not Connected'}</span></div>);})}</div>
    </div>
  </div>);
}

function LoginPage({onLogin}){const[email,setEmail]=useState('');const[pw,setPw]=useState('');const[err,setErr]=useState('');const[loading,setLoading]=useState(false);
  const submit=async e=>{e.preventDefault();setErr('');setLoading(true);try{await onLogin(email,pw);}catch(e){setErr(e.response?.data?.error||'Login failed');}setLoading(false);};
  return(<div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:40,width:400}}>
      <h1 style={{color:C.green,fontSize:24,marginBottom:8,textAlign:'center'}}>NoLimitsDisputes</h1>
      <p style={{color:C.muted,textAlign:'center',marginBottom:32,fontSize:14}}>Sign in to your account</p>
      {err&&<div style={{background:'#ef444420',border:'1px solid #ef444440',borderRadius:8,padding:12,marginBottom:16,color:C.red,fontSize:13}}>{err}</div>}
      <form onSubmit={submit}>
        <div style={{marginBottom:16}}><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%',padding:'12px 14px',background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,fontSize:14,boxSizing:'border-box'}}/></div>
        <div style={{marginBottom:24}}><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>Password</label><input type="password" value={pw} onChange={e=>setPw(e.target.value)} required style={{width:'100%',padding:'12px 14px',background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,fontSize:14,boxSizing:'border-box'}}/></div>
        <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:C.green,color:C.bg,border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer'}}>{loading?'Signing in...':'Sign In'}</button>
      </form>
      <p style={{textAlign:'center',marginTop:20,color:C.muted,fontSize:13}}>Don't have an account? <Link to="/signup" style={{color:C.green,textDecoration:'none'}}>Sign up</Link></p>
    </div>
  </div>);
}

function SignupPage({onSignup}){const[f,setF]=useState({name:'',email:'',password:'',company:''});const[err,setErr]=useState('');const[loading,setLoading]=useState(false);
  const submit=async e=>{e.preventDefault();setErr('');setLoading(true);try{await onSignup(f.name,f.email,f.password,f.company);}catch(e){setErr(e.response?.data?.error||'Signup failed');}setLoading(false);};
  const IS={width:'100%',padding:'12px 14px',background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,fontSize:14,boxSizing:'border-box'};
  return(<div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:40,width:400}}>
      <h1 style={{color:C.green,fontSize:24,marginBottom:8,textAlign:'center'}}>NoLimitsDisputes</h1>
      <p style={{color:C.muted,textAlign:'center',marginBottom:32,fontSize:14}}>Create your account</p>
      {err&&<div style={{background:'#ef444420',border:'1px solid #ef444440',borderRadius:8,padding:12,marginBottom:16,color:C.red,fontSize:13}}>{err}</div>}
      <form onSubmit={submit}>
        {[{k:'name',l:'Name',t:'text'},{k:'company',l:'Company',t:'text'},{k:'email',l:'Email',t:'email'},{k:'password',l:'Password',t:'password'}].map(x=><div key={x.k} style={{marginBottom:16}}><label style={{color:C.muted,fontSize:12,marginBottom:4,display:'block'}}>{x.l}</label><input type={x.t} value={f[x.k]} onChange={e=>setF({...f,[x.k]:e.target.value})} required={x.k!=='company'} style={IS}/></div>)}
        <button type="submit" disabled={loading} style={{width:'100%',padding:12,background:C.green,color:C.bg,border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer',marginTop:8}}>{loading?'Creating...':'Create Account'}</button>
      </form>
      <p style={{textAlign:'center',marginTop:20,color:C.muted,fontSize:13}}>Already have an account? <Link to="/login" style={{color:C.green,textDecoration:'none'}}>Log in</Link></p>
    </div>
  </div>);
}

function AppLayout({user,onLogout}){return(<div style={{display:'flex',minHeight:'100vh',background:C.bg}}><Sidebar user={user} onLogout={onLogout}/><main style={{flex:1,marginLeft:260,padding:32}}><Routes><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/disputes" element={<DisputesPage/>}/><Route path="/alerts" element={<AlertsPage/>}/><Route path="/mids" element={<MIDsPage/>}/><Route path="/notifications" element={<NotificationsPage/>}/><Route path="/rules" element={<RulesPage/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="*" element={<Navigate to="/dashboard"/>}/></Routes></main></div>);}

function App(){const{user,isAuth,login,signup,logout}=useAuth();return(<BrowserRouter><Routes>{!isAuth?<><Route path="/login" element={<LoginPage onLogin={login}/>}/><Route path="/signup" element={<SignupPage onSignup={signup}/>}/><Route path="*" element={<Navigate to="/login"/>}/></>:<Route path="/*" element={<AppLayout user={user} onLogout={logout}/>}/>}</Routes></BrowserRouter>);}

export default App;
