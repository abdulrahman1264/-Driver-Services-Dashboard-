import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useStore, useTranslation } from '../../store.js'
import toast from 'react-hot-toast'

const NAV_KEYS = [
  { to: '/',            key: 'home',                icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { to: '/drivers',     key: 'drivers',     icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { to: '/documents',   key: 'documents', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { to: '/recruitment', key: 'recruitment',         icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> },
  { to: '/terminated',  key: 'terminated',  icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  { to: '/analytics',   key: 'analytics',           icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { to: '/settings',    key: 'settings',            icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

export default function Layout() {
  const { user, clearAuth, lang } = useStore()
  const t = useTranslation()
  const NAV = NAV_KEYS.map(n => ({ ...n, label: t(n.key) }))
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  function logout() {
    clearAuth()
    navigate('/login')
    toast.success(t('logged_out'))
  }

  return (
    <div className="app-layout" style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f1f5f9' }}>
      {mobileOpen && <div className="sb-overlay open" onClick={()=>setMobileOpen(false)}/>}
      <aside style={{
        width: collapsed ? 64 : 220,
        minWidth: collapsed ? 64 : 220,
        background: 'linear-gradient(180deg,#0f2044 0%,#0a1628 100%)',
        display: 'flex', flexDirection: 'column',
        transition: 'width .25s ease, min-width .25s ease',
        overflow: 'hidden', position: 'relative', zIndex: 10,
        boxShadow: '2px 0 12px rgba(0,0,0,.18)'
      }} className={`sb-sidebar${mobileOpen ? ' open' : ''}`}>
        <div style={{ display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '20px 0' : '20px 16px', borderBottom:'1px solid rgba(255,255,255,.07)', minHeight:72 }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
              <div style={{ width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>DS</div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff', whiteSpace:'nowrap' }}>Driver Services</div>
                <div style={{ fontSize:10.5, color:'rgba(255,255,255,.4)', whiteSpace:'nowrap' }}>Operations Dashboard</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff' }}>DS</div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: 'rgba(255,255,255,.08)', border:'none', borderRadius:6, width:28, height:28,
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,.6)',
            flexShrink:0, marginLeft: collapsed ? 0 : 8, transition:'background .2s'
          }}>
            {collapsed
              ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            }
          </button>
        </div>

        <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto', overflowX:'hidden' }}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              title={collapsed ? t(n.key) : undefined}
              className={({ isActive }) => 'sb-link' + (isActive ? ' active' : '')}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 0' : undefined }}
            >
              <span style={{ flexShrink:0 }}>{n.icon}</span>
              {!collapsed && <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop:'1px solid rgba(255,255,255,.07)', padding:'12px 8px' }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px', marginBottom:4, borderRadius:8, background:'rgba(255,255,255,.05)' }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.username}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.4)' }}>{user?.role}</div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            style={{
              width:'100%', border:'none', background:'none', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'flex-start',
              gap:10, padding: collapsed ? '10px 0' : '9px 10px', borderRadius:8,
              color:'rgba(255,255,255,.5)', fontSize:13, fontWeight:500, transition:'all .2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,.15)'; e.currentTarget.style.color='#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='rgba(255,255,255,.5)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0}}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Mobile topbar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 14px', height:52, background:'#fff', borderBottom:'1px solid #e2e8f0', flexShrink:0 }} className="mob-topbar">
          <button className="mob-menu-btn" onClick={()=>setMobileOpen(o=>!o)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:6, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>DS</div>
            <span style={{ fontSize:13, fontWeight:700, color:'#0f2044' }}>Driver Services</span>
          </div>
          <button onClick={logout} style={{ marginLeft:'auto', background:'none', border:'1.5px solid #e2e8f0', borderRadius:6, padding:'6px 10px', fontSize:12, color:'#64748b', cursor:'pointer' }}>{t('logout')}</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'24px' }} className="main-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  )
}