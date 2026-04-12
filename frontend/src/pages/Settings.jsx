import { useState, useEffect } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, isAdmin, lang, setLang, t } = useStore()
  const [tab, setTab]     = useState('general')
  const [users, setUsers] = useState([])
  const [form, setForm]   = useState({ username:'', email:'', password:'', role:'Viewer' })

  useEffect(() => {
    if (isAdmin()) api.getUsers().then(setUsers).catch(()=>{})
  }, [])

  async function addUser() {
    if (!form.username || !form.password) return toast.error('Username and password required')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    try {
      const u = await api.addUser(form)
      setUsers(prev => [...prev, u])
      setForm({ username:'', email:'', password:'', role:'Viewer' })
      toast.success('User added')
    } catch(e) { toast.error(e.message) }
  }

  async function removeUser(id, name) {
    if (!confirm(`Remove user "${name}"?`)) return
    try {
      await api.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success('User removed')
    } catch(e) { toast.error(e.message) }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{background:'#f1f5f9',color:'#475569'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <div><div className="dh-title">{t('settings_title')}</div><div className="dh-sub">{t('language_label')}</div></div>
        </div>
      </div>

      <div className="page-body">
        <div style={{background:'#fff',borderRadius:12,border:'1.5px solid #e2e8f0',overflow:'hidden'}}>
          <div className="stabs" style={{padding:'0 24px'}}>
            {[['general','General','عام'],['users','Users','المستخدمون'],['security','Security','الأمان'],['language','Language','اللغة']].map(([key,en,ar])=>(
              <button key={key} className={`stab ${tab===key?'active':''}`} onClick={()=>setTab(key)}>
                {lang==='ar' ? ar : en}
              </button>
            ))}
          </div>
          <div style={{padding:24}}>

            {tab==='general' && (
              <div>
                <div className="form-row c2">
                  <div className="form-group"><label className="form-label">Dashboard Name</label><input className="form-input" defaultValue="Driver Services Dashboard"/></div>
                  <div className="form-group"><label className="form-label">Organisation</label><input className="form-input" defaultValue="Roads & Transport Authority"/></div>
                </div>
                <div className="form-row c2">
                  <div className="form-group"><label className="form-label">{t('username')}</label><input className="form-input" value={user?.username} readOnly style={{background:'#f8fafc'}}/></div>
                  <div className="form-group"><label className="form-label">{t('role')}</label><input className="form-input" value={user?.role} readOnly style={{background:'#f8fafc'}}/></div>
                </div>
              </div>
            )}

            {tab==='users' && (
              <div>
                <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'12px 16px',marginBottom:20,fontSize:13,color:'#1e3a8a'}}>
                  <strong>Roles:</strong> Administrators have full access. Viewers can browse only — no import, export or editing.
                </div>

                {isAdmin() && (
                  <div style={{background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0',padding:18,marginBottom:20}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#0f2044',marginBottom:14}}>{t('add_user')}</div>
                    <div className="form-row c2">
                      <div className="form-group"><label className="form-label">{t('username')}</label><input className="form-input" placeholder="username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/></div>
                      <div className="form-group"><label className="form-label">{t('password')}</label><input className="form-input" type="email" placeholder="email@domain.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
                    </div>
                    <div className="form-row c2" style={{marginBottom:0}}>
                      <div className="form-group"><label className="form-label">{t('password')}</label><input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/></div>
                      <div className="form-group"><label className="form-label">{t('role')}</label>
                        <select className="form-select" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                          <option>{t('administrator')}</option><option>{t('viewer')}</option>
                        </select>
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{marginTop:14}} onClick={addUser}>{t('add_user')}</button>
                  </div>
                )}

                <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.6,color:'#94a3b8',marginBottom:12}}>Active Users</div>
                {users.map(u=>(
                  <div key={u.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #f1f5f9'}}>
                    <div className="avatar">{u.username?.[0]?.toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13.5,fontWeight:600}}>{u.username}</div>
                      <div style={{fontSize:12,color:'#64748b'}}>{u.email||'—'}</div>
                      {u.role!=='Administrator' && <div style={{marginTop:4}}><span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:600,background:'#f1f5f9',color:'#475569'}}>Read-only access</span></div>}
                    </div>
                    <span style={{padding:'3px 10px',borderRadius:99,fontSize:11,fontWeight:600,background:u.role==='Administrator'?'#eff6ff':'#f1f5f9',color:u.role==='Administrator'?'#1d4ed8':'#475569'}}>{u.role}</span>
                    {isAdmin() && u.username !== 'admin' && (
                      <button className="btn btn-ghost" style={{padding:'5px 10px',fontSize:12,color:'#dc2626',borderColor:'#fca5a5'}} onClick={()=>removeUser(u.id,u.username)}>{t('delete')}</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab==='language' && (
              <div>
                <div style={{marginBottom:24}}>
                  <div style={{fontSize:14,fontWeight:700,color:'#0f2044',marginBottom:6}}>{t('language_label')}</div>
                  <div style={{fontSize:13,color:'#64748b',marginBottom:20}}>{lang==='ar' ? 'اختر لغة الواجهة' : 'Choose the interface language. The page will switch instantly.'}</div>
                  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                    {[['en','English 🇬🇧'],['ar','العربية 🇦🇪']].map(([code,label])=>(
                      <button key={code} onClick={()=>setLang(code)} style={{
                        padding:'14px 28px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer',
                        border: lang===code ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                        background: lang===code ? '#eff6ff' : '#fff',
                        color: lang===code ? '#1d4ed8' : '#374151',
                        transition:'all .15s', minWidth:140, textAlign:'center'
                      }}>
                        {label}
                        {lang===code && <div style={{fontSize:11,fontWeight:600,color:'#2563eb',marginTop:4}}>{lang==='ar'?'✓ مفعّل':'✓ Active'}</div>}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{padding:14,background:'#f0fdf4',borderRadius:8,fontSize:13,color:'#166534',border:'1px solid #bbf7d0'}}>
                  {lang==='ar' ? '✓ اللغة العربية مفعّلة — الواجهة تعمل من اليمين إلى اليسار' : '✓ Language change applies instantly across all pages.'}
                </div>
              </div>
            )}

            {tab==='security' && (
              <div>
                <div className="form-row c2">
                  <div className="form-group"><label className="form-label">Session Timeout</label><select className="form-select"><option>1 Hour</option><option>4 Hours</option><option>8 Hours</option></select></div>
                  <div className="form-group"><label className="form-label">Login Lockout After</label><select className="form-select" defaultValue="5 Attempts"><option>3 Attempts</option><option>5 Attempts</option><option>10 Attempts</option></select></div>
                </div>
                <div style={{padding:14,background:'#fef2f2',borderRadius:8,fontSize:13,color:'#dc2626',marginTop:8}}>
                  JWT tokens expire after 8 hours. Users must re-login after expiry.
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}