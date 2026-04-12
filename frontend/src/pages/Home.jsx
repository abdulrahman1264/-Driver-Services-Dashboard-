import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useEffect, useState } from 'react'
import { api } from '../api'

// v2
export default function Home() {
  const { user, t } = useStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Driver Services Dashboard'
    api.getAnalytics().then(d => { setStats(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const h = new Date().getHours()
  const greeting = h < 12 ? t('good_morning') : h < 17 ? t('good_afternoon') : t('good_evening')
  const now = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  const total  = stats ? Object.values(stats.drivers?.status || {}).reduce((a,b)=>a+b,0) : '--'
  const active = stats?.drivers?.status?.Active ?? '--'
  const term   = stats?.drivers?.status?.Terminated ?? '--'
  const recTot = stats?.recruitment?.total ?? '--'
  const doc    = stats?.documents || {}

  const licExp  = doc.lic_expired  || 0
  const visaExp = doc.visa_expired || 0
  const medExp  = doc.med_expired  || 0
  const passExp = doc.pass_expired || 0
  const lic30   = doc.lic_30  || 0
  const visa30  = doc.visa_30 || 0
  const med30   = doc.med_30  || 0
  const pass30  = doc.pass_30 || 0

  const MODULES = [
    {
      to:'/drivers', color:'#1d4ed8', bg:'#eff6ff',
      title:t('drivers'), desc:t('home_drivers_desc'),
      count: stats?.drivers?.total ?? '--', lbl:t('kpi_total')+' '+t('drivers').toLowerCase(),
      icon:<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    {
      to:'/documents', color:'#dc2626', bg:'#fef2f2',
      title:t('documents'), desc:t('home_docs_desc'),
      count: licExp.toLocaleString(), lbl:t('expired')+' '+t('license').toLowerCase(),
      icon:<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    },
    {
      to:'/recruitment', color:'#059669', bg:'#f0fdf4',
      title:t('rec_title'), desc:t('home_rec_desc'),
      count: recTot.toLocaleString?.() ?? recTot, lbl:t('kpi_total')+' '+t('candidates'),
      icon:<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
    },
    {
      to:'/terminated', color:'#d97706', bg:'#fffbeb',
      title:t('terminated'), desc:t('home_term_desc'),
      count: typeof term === 'number' ? term.toLocaleString() : term, lbl:t('term_records'),
      icon:<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
    },
    {
      to:'/analytics', color:'#7c3aed', bg:'#f5f3ff',
      title:t('analytics_title'), desc:t('home_analytics_desc'),
      count:'6+', lbl:t('home_chart_modules'),
      icon:<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    },
  ]

  const ALERTS = [
    { label:t('license')+' '+t('expired'),  value:licExp,  sub:`+${lic30} ${t('expiring_soon')}`,  color:'#dc2626', bg:'#fef2f2', to:'/documents' },
    { label:t('visa')+' '+t('expired'),     value:visaExp, sub:`+${visa30} ${t('expiring_soon')}`, color:'#dc2626', bg:'#fef2f2', to:'/documents' },
    { label:t('medical')+' '+t('expired'),  value:medExp,  sub:`+${med30} ${t('expiring_soon')}`,  color:'#d97706', bg:'#fffbeb', to:'/documents' },
    { label:t('passport')+' '+t('expired'), value:passExp, sub:`+${pass30} ${t('expiring_soon')}`, color:'#d97706', bg:'#fffbeb', to:'/documents' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Hero banner */}
      <div style={{ background:'linear-gradient(135deg,#0f2044 0%,#1e3a8a 60%,#1d4ed8 100%)', borderRadius:14, padding:'28px 32px', color:'#fff', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>
        <div style={{ position:'absolute', bottom:-60, right:80, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,.03)' }}/>
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:1.2, color:'rgba(255,255,255,.4)', marginBottom:4 }}>{greeting}, {user?.username} · {now}</div>
          <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-.4px', marginBottom:6 }}>{t('home_banner_title')}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:24, maxWidth:500, lineHeight:1.6 }}>
            {t('home_banner_sub')}
          </div>
          <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
            {[
              [t('kpi_total')+' '+t('drivers'), typeof total==='number' ? total.toLocaleString() : total, '#60a5fa'],
              [t('kpi_active'),  typeof active==='number'? active.toLocaleString(): active, '#34d399'],
              [t('kpi_terminated'), typeof term==='number'  ? term.toLocaleString()  : term,   '#f87171'],
              [t('kpi_recruitment'), typeof recTot==='number'? recTot.toLocaleString(): recTot, '#a78bfa'],
            ].map(([l,v,c]) => (
              <div key={l}>
                <div style={{ fontSize:28, fontWeight:800, color:c }}>{loading ? '...' : v}</div>
                <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:.8, color:'rgba(255,255,255,.35)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance alerts */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#94a3b8', marginBottom:10 }}>⚠ {t('compliance_alerts')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {ALERTS.map(a => (
            <div key={a.label} onClick={() => navigate(a.to)}
              style={{ background:'#fff', borderRadius:10, border:`1.5px solid ${a.color}22`, padding:'14px 16px', cursor:'pointer', transition:'all .18s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 20px ${a.color}18` }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
            >
              <div style={{ fontSize:11, fontWeight:600, color:'#64748b', marginBottom:6 }}>{a.label}</div>
              <div style={{ fontSize:26, fontWeight:800, color:a.color }}>{loading ? '...' : a.value.toLocaleString()}</div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{a.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Module cards */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#94a3b8', marginBottom:10 }}>{t('home_modules')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {MODULES.map(m => (
            <div key={m.to} onClick={() => navigate(m.to)}
              style={{ background:'#fff', borderRadius:12, border:'1.5px solid #e2e8f0', padding:20, cursor:'pointer', transition:'all .18s', position:'relative', overflow:'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=m.color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 10px 24px ${m.color}15` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:m.color, borderRadius:'12px 12px 0 0' }}/>
              <div style={{ width:38, height:38, borderRadius:9, background:m.bg, display:'flex', alignItems:'center', justifyContent:'center', color:m.color, marginBottom:12 }}>
                {m.icon}
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'#0f2044', marginBottom:5 }}>{m.title}</div>
              <div style={{ fontSize:12, color:'#64748b', lineHeight:1.55, marginBottom:16 }}>{m.desc}</div>
              <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:m.color }}>{loading ? '...' : m.count}</div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{m.lbl}</div>
                </div>
                <div style={{ width:26, height:26, borderRadius:'50%', background:m.bg, display:'flex', alignItems:'center', justifyContent:'center', color:m.color, fontSize:16, fontWeight:700 }}>›</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}