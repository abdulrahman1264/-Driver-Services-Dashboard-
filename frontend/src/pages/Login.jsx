import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [fails, setFails]       = useState(0)
  const { setAuth } = useStore()
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    if (fails >= 5) return setError('Account locked. Refresh to retry.')
    setLoading(true); setError('')
    try {
      const res = await api.login(username, password)
      setAuth(res.user, res.token)
      toast.success('Welcome back, ' + res.user.username)
      navigate('/')
    } catch (err) {
      setFails(f => f + 1)
      const rem = 5 - fails - 1
      setError(err.message + (rem > 0 ? ` (${rem} attempts left)` : ' — Account locked.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display:'flex', height:'100vh', background:'#0f2044' }}>
      {/* Left */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px', position:'relative', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:64 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Driver Services</div>
            <div style={{ fontSize:11.5, color:'rgba(255,255,255,.4)' }}>Operations Dashboard</div>
          </div>
        </div>
        <h1 style={{ fontSize:38, fontWeight:800, color:'#fff', lineHeight:1.15, letterSpacing:'-.8px', marginBottom:16 }}>
          Manage drivers.<br/>Track compliance.<br/><span style={{ color:'#60a5fa' }}>Stay ahead.</span>
        </h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,.5)', lineHeight:1.7, maxWidth:380, marginBottom:48 }}>
          A centralised dashboard for driver profiles, document compliance, recruitment pipeline and payroll data.
        </p>
        <div style={{ display:'flex', gap:36 }}>
          {[['3,727','Driver Records'],['7','Depots'],['1,267','Recruitment Cases']].map(([v,l]) => (
            <div key={l}>
              <div style={{ fontSize:26, fontWeight:800, color:'#fff' }}>{v}</div>
              <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'rgba(255,255,255,.35)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ width:460, display:'flex', alignItems:'center', justifyContent:'center', padding:40, background:'#fff' }}>
        <div style={{ width:'100%', maxWidth:360 }}>
          <div style={{ fontSize:26, fontWeight:800, color:'#0f2044', marginBottom:4, letterSpacing:'-.5px' }}>Welcome back</div>
          <div style={{ fontSize:13.5, color:'#64748b', marginBottom:32 }}>Sign in to access the dashboard</div>

          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, padding:'10px 14px', fontSize:12.5, color:'#dc2626', marginBottom:16 }}>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Username</label>
              <input
                className="form-input" style={{ width:'100%' }}
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username" autoComplete="username" required
              />
            </div>
            <div style={{ marginBottom:22 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  className="form-input" style={{ width:'100%', paddingRight:42 }}
                  type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" autoComplete="current-password" required
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', display:'flex' }}>
                  {showPw
                    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:13, fontSize:14 }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width:16, height:16 }}></div> Signing in...</> : 'Sign In'}
            </button>
          </form>
          <div style={{ marginTop:20, fontSize:11.5, color:'#94a3b8', display:'flex', alignItems:'center', gap:6 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Accounts lock after 5 failed attempts
          </div>
        </div>
      </div>
    </div>
  )
}