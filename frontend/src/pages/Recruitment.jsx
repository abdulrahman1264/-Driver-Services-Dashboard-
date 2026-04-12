import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  const cls = (l==='on board'||l==='pass') ? 'tag-green'
    : (l==='not shortlisted'||l==='fail'||l==='security rejected') ? 'tag-red'
    : (l==='shortlisted'||l==='pipeline') ? 'tag-blue'
    : (l==='upcoming interview') ? 'tag-amber' : 'tag-gray'
  return <span className={`tag ${cls}`}>{v}</span>
}

const S = { // inline style helpers
  card: { background:'#fff', borderRadius:12, border:'1.5px solid #e2e8f0', padding:'18px 20px' },
  label: { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.8, color:'#64748b', marginBottom:8 },
}

function EditModal({ rec, onClose, onSave, t }) {
  const [form, setForm] = useState({ ...rec })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  async function save() {
    setSaving(true)
    try { await onSave(form); onClose() }
    catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{t('edit')} — {rec.full_name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">{t('full_name')}</label><input className="form-input" value={form.full_name||''} onChange={e=>set('full_name',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">{t('nationality')}</label><input className="form-input" value={form.nationality||''} onChange={e=>set('nationality',e.target.value)}/></div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">{t('company')}</label>
              <select className="form-select" value={form.company||''} onChange={e=>set('company',e.target.value)}>
                {['Reach','Omnix','Expert plus','Okool PB','Ultimate1','Ultimate2','Alsundus'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t('status')}</label>
              <select className="form-select" value={form.status||''} onChange={e=>set('status',e.target.value)}>
                {['On Board','Not Shortlisted','Shortlisted','Not Interested','Security Rejected','Pipeline','Upcoming Interview','Road Test Fail'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">{t('road_test')}</label>
              <select className="form-select" value={form.road_test_result||''} onChange={e=>set('road_test_result',e.target.value)}>
                <option value="">--</option><option>pass</option><option>fail</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">{t('interview')}</label>
              <select className="form-select" value={form.interview_result||''} onChange={e=>set('interview_result',e.target.value)}>
                <option value="">--</option><option>pass</option><option>fail</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">{t('reason')}</label><input className="form-input" value={form.remarks||''} onChange={e=>set('remarks',e.target.value)}/></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?t('saving'):t('save')}</button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onClose, t }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{maxWidth:400}}>
        <div className="modal-header">
          <div className="modal-title">{t('confirm_delete')}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body"><p style={{margin:0,color:'#475569'}}>{message}</p></div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" style={{background:'#dc2626',borderColor:'#dc2626'}} disabled={busy} onClick={async()=>{setBusy(true);await onConfirm();setBusy(false)}}>
            {busy?t('deleting'):t('delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Recruitment() {
  const { isAdmin, t } = useStore()
  const [recs, setRecs]           = useState([])
  const [total, setTotal]         = useState(0)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [filters, setFilters]     = useState({})
  const [slicerOpen, setSlicerOpen] = useState(true)
  const [editRec, setEditRec]     = useState(null)
  const [deleteRec, setDeleteRec] = useState(null)
  const fileRef = useRef()
  const LIMIT = 100

  useEffect(() => {
    api.getAnalytics().then(d => setAnalytics(d)).catch(() => {})
    load(1, {})
  }, [])

  async function load(p = 1, f = filters, q = search) {
    setLoading(true)
    try {
      const params = { page: p, limit: LIMIT, ...f }
      if (q) params.search = q
      const res = await api.getRecruitment(params)
      setRecs(res.data); setTotal(res.total); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function applyFilter(k, v) {
    const f = { ...filters, [k]: v || undefined }
    Object.keys(f).forEach(k => !f[k] && delete f[k])
    setFilters(f); load(1, f, search)
  }

  function resetAll() {
    setFilters({}); setSearch(''); load(1, {}, '')
  }

  async function handleEdit(data) {
    const updated = await api.updateRecruitment(data.id, data)
    setRecs(prev => prev.map(r => r.id===updated.id ? updated : r))
    toast.success(t('candidate_records'))
  }

  async function handleDelete(rec) {
    await api.deleteRecruitment(rec.id)
    setRecs(prev => prev.filter(r => r.id !== rec.id))
    setTotal(t => t-1)
    setDeleteRec(null)
    toast.success(t('delete')+' OK')
  }

  async function handleCSV(e) {
    const file = e.target.files[0]; if (!file) return
    const text = await file.text()
    toast.loading('Uploading recruitment CSV...')
    try {
      const res = await api.uploadCSV('recruitment', text)
      toast.dismiss(); toast.success(`Imported ${res.inserted} candidates`)
      api.getAnalytics().then(d => setAnalytics(d)).catch(() => {})
      load(1, {}, '')
    } catch(err) { toast.dismiss(); toast.error(err.message) }
    e.target.value = ''
  }

  const rec        = analytics?.recruitment || {}
  const statusData = rec.status || {}
  const pages      = Math.ceil(total / LIMIT)
  const grandTotal = Object.keys(filters).length || search ? total : (rec.total || total)

  // compute KPIs from current page records when filtered, else use analytics
  const isFiltered = Object.keys(filters).length > 0 || !!search
  const onboard   = isFiltered ? recs.filter(r=>(r.status||'').toLowerCase()==='on board').length   : (statusData['On Board']||0)
  const shortlist = isFiltered ? recs.filter(r=>(r.status||'').toLowerCase()==='shortlisted').length : (statusData['Shortlisted']||0)
  const notShort  = isFiltered ? recs.filter(r=>(r.status||'').toLowerCase()==='not shortlisted').length : (statusData['Not Shortlisted']||0)
  const rtPass    = isFiltered
    ? recs.filter(r=>['pass','Pass'].includes(r.road_test_result)).length
    : ((rec.roadTest?.pass||0)+(rec.roadTest?.Pass||0))
  const interviewPass = isFiltered
    ? recs.filter(r=>['pass','Pass'].includes(r.interview_result)).length
    : (Object.values(statusData).reduce((a,b)=>a+b,0) - (statusData['Not Shortlisted']||0) - (statusData['Shortlisted']||0))

  const activeFilters = Object.keys(filters).length + (search ? 1 : 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:10, background:'#f0fdf4', color:'#059669', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:'#0f2044' }}>{t('rec_title')}</div>
            <div style={{ fontSize:12, color:'#64748b' }}>{grandTotal.toLocaleString()} {t('candidates_tracked')}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => setSlicerOpen(s => !s)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            {t('filters')} {activeFilters > 0 && <span style={{ background:'#1d4ed8', color:'#fff', borderRadius:99, fontSize:10, padding:'1px 6px' }}>{activeFilters}</span>}
          </button>
          {isAdmin() && <>
            <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleCSV}/>
            <button onClick={() => fileRef.current.click()} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              {t('import_csv')}
            </button>
          </>}
        </div>
      </div>

      {/* Slicers */}
      {slicerOpen && (
        <div style={{ background:'#fff', borderRadius:12, border:'1.5px solid #e2e8f0', padding:'14px 18px', display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
          {/* Search */}
          <div style={{ position:'relative', flex:'1', minWidth:180 }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && load(1, filters, search)}
              placeholder={t('search_placeholder')} style={{ width:'100%', paddingLeft:32, paddingRight:10, height:34, border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', boxSizing:'border-box' }}/>
          </div>
          {[
            ['Status','status',['On Board','Not Shortlisted','Shortlisted','Not Interested','Security Rejected','Pipeline','Upcoming Interview','Road Test Fail']],
            ['Company','company',['Reach','Omnix','Expert plus','Okool PB','Ultimate1','Ultimate2','Alsundus']],
            ['Road Test','road_test',['pass','fail']],
          ].map(([lbl, key, opts]) => (
            <select key={key} value={filters[key]||''} onChange={e => applyFilter(key, e.target.value)}
              style={{ height:34, border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, padding:'0 10px', background:'#fff', color:'#374151', cursor:'pointer', outline:'none' }}>
              <option value="">{t('all')} {lbl}</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <button onClick={resetAll} style={{ height:34, padding:'0 14px', borderRadius:7, border:'1.5px solid #e2e8f0', background:'#f8fafc', fontSize:13, fontWeight:600, color:'#64748b', cursor:'pointer' }}>{t('reset')}</button>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          [t('on_board'),       onboard,    '#059669', '#f0fdf4'],
          [t('shortlisted'),    shortlist,  '#1d4ed8', '#eff6ff'],
          [t('road_test_pass'), rtPass,     '#d97706', '#fffbeb'],
          [t('not_shortlisted'),notShort,   '#dc2626', '#fef2f2'],
        ].map(([l,v,c,bg]) => (
          <div key={l} style={{ ...S.card, borderTop:`3px solid ${c}` }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:.6, marginBottom:6 }}>{l}</div>
            <div style={{ fontSize:28, fontWeight:800, color:c }}>{Number(v||0).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Pipeline flow */}
      <div style={{ ...S.card }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#0f2044', marginBottom:20 }}>{t('pipeline_flow')}</div>
        <div style={{ display:'flex', alignItems:'center', gap:0, overflowX:'auto' }}>
          {[
            [t('total_applied'),   grandTotal,      '#1d4ed8', '#eff6ff'],
            [t('shortlisted'),     shortlist,        '#059669', '#f0fdf4'],
            [t('road_test_pass'),  rtPass,           '#d97706', '#fffbeb'],
            [t('interview_pass'),  interviewPass,    '#7c3aed', '#f5f3ff'],
            [t('on_board'),        onboard,          '#059669', '#dcfce7'],
          ].map(([lbl, val, c, bg], i, arr) => (
            <div key={lbl} style={{ display:'flex', alignItems:'center', flex:1, minWidth:0 }}>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:bg, border:`2px solid ${c}22`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', flexDirection:'column' }}>
                  <div style={{ fontSize:15, fontWeight:800, color:c }}>{Number(val||0).toLocaleString()}</div>
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textAlign:'center', lineHeight:1.3 }}>{lbl}</div>
              </div>
              {i < arr.length-1 && (
                <div style={{ color:'#cbd5e1', fontSize:20, flexShrink:0, padding:'0 4px' }}>›</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...S.card, padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1.5px solid #f1f5f9' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f2044' }}>{t('candidate_records')}</div>
          <div style={{ fontSize:12, fontWeight:600, color:'#64748b', background:'#f1f5f9', padding:'3px 10px', borderRadius:99 }}>{total.toLocaleString()} {t('candidates')}</div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['#',t('full_name'),t('nationality'),t('company'),t('road_test'),t('interview'),t('status'), ...(isAdmin()?[t('actions')]:[])].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, borderBottom:'1.5px solid #f1f5f9', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>{t('loading')}</td></tr>
              ) : recs.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>{t('no_data')}</td></tr>
              ) : recs.map((r, i) => (
                <tr key={r.id} style={{ borderBottom:'1px solid #f8fafc' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background=''}
                >
                  <td style={{ padding:'10px 14px', color:'#94a3b8', fontSize:12 }}>{(page-1)*LIMIT+i+1}</td>
                  <td style={{ padding:'10px 14px', fontWeight:600, color:'#0f2044' }}>{r.full_name||'--'}</td>
                  <td style={{ padding:'10px 14px', color:'#374151' }}>{r.nationality||'--'}</td>
                  <td style={{ padding:'10px 14px', color:'#374151' }}>{r.company||'--'}</td>
                  <td style={{ padding:'10px 14px' }}><Tag v={r.road_test_result}/></td>
                  <td style={{ padding:'10px 14px' }}><Tag v={r.interview_result}/></td>
                  <td style={{ padding:'10px 14px' }}><Tag v={r.status}/></td>
                  {isAdmin() && (
                    <td style={{ padding:'10px 14px', whiteSpace:'nowrap' }} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>setEditRec(r)} style={{fontSize:11,padding:'3px 8px',borderRadius:5,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#334155',cursor:'pointer',marginRight:4}}>{t('edit')}</button>
                      <button onClick={()=>setDeleteRec(r)} style={{fontSize:11,padding:'3px 8px',borderRadius:5,border:'1px solid #fecaca',background:'#fff5f5',color:'#dc2626',cursor:'pointer'}}>{t('delete')}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderTop:'1.5px solid #f1f5f9' }}>
          <span style={{ fontSize:12, color:'#94a3b8' }}>{t('showing')} {Math.min((page-1)*LIMIT+1,total)}–{Math.min(page*LIMIT,total)} {t('of')} {total.toLocaleString()}</span>
          <div style={{ display:'flex', gap:4 }}>
            {page>1 && <button onClick={() => load(page-1)} style={{ padding:'4px 10px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>‹</button>}
            {Array.from({length:Math.min(5,pages)}, (_,i) => { const p=Math.max(1,Math.min(page-2,pages-4))+i; return (
              <button key={p} onClick={() => load(p)} style={{ padding:'4px 10px', borderRadius:6, border:'1.5px solid #e2e8f0', background:p===page?'#0f2044':'#fff', color:p===page?'#fff':'#374151', cursor:'pointer', fontSize:13, fontWeight:p===page?700:400 }}>{p}</button>
            )})}
            {page<pages && <button onClick={() => load(page+1)} style={{ padding:'4px 10px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>›</button>}
          </div>
        </div>
      </div>

    </div>
  )
}