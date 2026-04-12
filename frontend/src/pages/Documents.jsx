import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore, useTranslation } from '../store'
import toast from 'react-hot-toast'

function DocCard({ title, data, color, severity, onClick, active, t }) {
  const total = (data.expired||0)+(data.d30||0)+(data.d90||0)+(data.valid||0)
  const pct = total ? Math.round((data.expired||0)/total*100) : 0
  return (
    <div className="doc-card" style={{'--dc':color, border: active?`2px solid ${color}`:'1.5px solid #e2e8f0'}} onClick={onClick}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.6,color:'#64748b'}}>{title}</div>
        <div style={{padding:'3px 9px',borderRadius:99,fontSize:10.5,fontWeight:700,background:severity==='CRITICAL'?'#fef2f2':'#fffbeb',color:severity==='CRITICAL'?'#dc2626':'#d97706'}}>{severity}</div>
      </div>
      <div style={{fontSize:28,fontWeight:800,color}}>{(data.expired||0).toLocaleString()}</div>
      <div style={{fontSize:11.5,color:'#64748b',marginBottom:10}}>{t('expired')}</div>
      <div className="doc-meter"><div className="doc-fill" style={{width:pct+'%',background:color}}/></div>
      <div className="doc-stats">
        {[[(data.expired||0),t('expired'),'#dc2626'],[(data.d30||0),'<30d','#d97706'],[(data.d90||0),'<90d','#d97706'],[(data.valid||0),t('valid'),'#059669']].map(([v,l,c])=>(
          <div key={l} className="doc-stat-item"><div className="doc-stat-val" style={{color:c}}>{Number(v).toLocaleString()}</div><div className="doc-stat-lbl">{l}</div></div>
        ))}
      </div>
    </div>
  )
}

export default function Documents() {
  const { isAdmin, t, lang } = useStore()
  const [analytics, setAnalytics] = useState(null)
  const [drivers, setDrivers]     = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [activeDoc, setActiveDoc] = useState(null)
  const [docStatus, setDocStatus] = useState('')
  const [depot, setDepot]         = useState('')
  const [slicerOpen, setSlicerOpen] = useState(false)
  const [page, setPage]           = useState(1)
  const fileRef = useRef()
  const LIMIT = 100

  useEffect(() => {
    api.getAnalytics().then(d => setAnalytics(d)).catch(()=>{})
    loadTable(1)
  }, [])

  async function reloadAnalytics(depotVal) {
    try {
      const params = depotVal ? { depot: depotVal } : {}
      const res = await api.getDrivers({ ...params, limit: 9999 })
      const rows = res.data
      const exp = (field) => rows.filter(d => d[field] && new Date(d[field]) < new Date()).length
      const d30 = (field) => rows.filter(d => { if (!d[field]) return false; const n = Math.round((new Date(d[field])-new Date())/86400000); return n>=0&&n<=30 }).length
      const d90 = (field) => rows.filter(d => { if (!d[field]) return false; const n = Math.round((new Date(d[field])-new Date())/86400000); return n>30&&n<=90 }).length
      const val = (field) => rows.filter(d => d[field] && new Date(d[field]) > new Date(Date.now()+90*86400000)).length
      setAnalytics(prev => ({
        ...prev,
        documents: {
          lic_expired: exp('license_expired'), lic_30: d30('license_expired'), lic_90: d90('license_expired'), lic_valid: val('license_expired'),
          pass_expired: exp('passport_expired'), pass_30: d30('passport_expired'), pass_90: d90('passport_expired'), pass_valid: val('passport_expired'),
          visa_expired: exp('visa_expired'), visa_30: d30('visa_expired'), visa_90: d90('visa_expired'), visa_valid: val('visa_expired'),
          med_expired: exp('medical_expired'), med_30: d30('medical_expired'), med_90: d90('medical_expired'), med_valid: val('medical_expired'),
        }
      }))
    } catch(e) {}
  }

  async function loadTable(p=1, depotVal=depot, docKey=activeDoc, statusVal=docStatus) {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT }
      if (depotVal) params.depot = depotVal
      if (docKey && statusVal) {
        const fieldMap = { lic:'license', pass:'passport', visa:'visa', med:'medical' }
        const field = fieldMap[docKey]
        if (field) params[`${field}_status`] = statusVal
      }
      const res = await api.getDrivers(params)
      setDrivers(res.data); setTotal(res.total); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function handleCSV(e) {
    const file = e.target.files[0]; if (!file) return
    const text = await file.text()
    toast.loading('Uploading payroll CSV...')
    try {
      const res = await api.uploadCSV('payroll', text)
      toast.dismiss(); toast.success(`Imported ${res.inserted} records`)
      api.getAnalytics().then(d=>setAnalytics(d)).catch(()=>{})
      loadTable(1)
    } catch(err) { toast.dismiss(); toast.error(err.message) }
    e.target.value=''
  }

  const docs = analytics?.documents || {}
  const docCards = [
    { key:'lic',  title:t('license'),             color:'#dc2626', severity:t('critical'), data:{ expired:docs.lic_expired,  d30:docs.lic_30,  d90:docs.lic_90,  valid:docs.lic_valid  }},
    { key:'pass', title:t('passport'),            color:'#d97706', severity:t('warning'),  data:{ expired:docs.pass_expired, d30:docs.pass_30, d90:0,            valid:docs.pass_valid }},
    { key:'visa', title:t('visa'),                color:'#dc2626', severity:t('critical'), data:{ expired:docs.visa_expired, d30:docs.visa_30, d90:0,            valid:docs.visa_valid }},
    { key:'med',  title:t('medical'),             color:'#dc2626', severity:t('critical'), data:{ expired:docs.med_expired,  d30:docs.med_30,  d90:0,            valid:docs.med_valid  }},
  ]

  function expTag(dateStr) {
    if (!dateStr) return <span className="tag tag-gray">--</span>
    const d = Math.round((new Date(dateStr)-new Date())/86400000)
    if (d<0)   return <span className="tag tag-red">Expired</span>
    if (d<=30) return <span className="tag tag-amber">{d}d</span>
    if (d<=90) return <span className="tag tag-amber">{d}d</span>
    return <span className="tag tag-green">Valid</span>
  }
  const fmt = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '--'

  const filteredDrivers = drivers

  const pages = Math.ceil(total/LIMIT)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{background:'#fef2f2',color:'#dc2626'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div><div className="dh-title">{t('doc_title')}</div><div className="dh-sub">{t('doc_sub')}</div></div>
        </div>
        <div className="dh-actions">
          <button className="btn btn-ghost" onClick={()=>setSlicerOpen(s=>!s)}>{t('slicers')}</button>
          {isAdmin() && <>
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV}/>
            <button className="btn btn-ghost" onClick={()=>fileRef.current.click()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              {t('import_csv')}
            </button>
          </>}
        </div>
      </div>

      <div className={`slicer-bar ${slicerOpen?'open':''}`}>
        <span className="slicer-label">{t('slicers')}</span>
        <select className="slicer-select" value={depot} onChange={e=>{setDepot(e.target.value);loadTable(1,e.target.value,activeDoc,docStatus);reloadAnalytics(e.target.value)}}>
          <option value="">{t('all')} {t('depot')}s</option>
          {['Al Awir','Al Quoz','Jebel Ali','Al Ruwayah','Al Khawaneej','Qusais','Etisalat Depot'].map(d=><option key={d}>{d}</option>)}
        </select>
        <select className="slicer-select" value={docStatus} onChange={e=>{setDocStatus(e.target.value);loadTable(1,depot,activeDoc,e.target.value)}}>
          <option value="">{t('all')}</option>
          <option value="expired">{t('expired')}</option>
          <option value="soon30">{t('expiring_soon')}</option>
          <option value="soon90">{t('expiring_soon')}</option>
          <option value="valid">{t('valid')}</option>
        </select>
        <button className="slicer-reset" onClick={()=>{setDepot('');setDocStatus('');setActiveDoc(null);loadTable(1,'',null,'');reloadAnalytics('')}}>{t('reset')}</button>
        <button className="slicer-close" onClick={()=>setSlicerOpen(false)}>✕</button>
      </div>

      <div className="page-body">
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
          {docCards.map(c=>(
            <DocCard
              key={c.key}
              title={c.title}
              color={c.color}
              severity={c.severity}
              data={c.data}
              active={activeDoc===c.key}
              onClick={()=>{const k=activeDoc===c.key?null:c.key;setActiveDoc(k);loadTable(1,depot,k,docStatus)}}
              t={t}
            />
          ))}
        </div>

        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">{t('compliance_records')}</div>
            <div className="tt-badge">{filteredDrivers.length.toLocaleString()} {t('records')}</div>
            {activeDoc && <div className="tt-badge" style={{background:'#fef2f2',color:'#dc2626',cursor:'pointer'}} onClick={()=>{setActiveDoc(null);loadTable(1,depot,null,docStatus)}}>
              {docCards.find(c=>c.key===activeDoc)?.title} ✕
            </div>}
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>{t('full_name')}</th><th>{t('depot')}</th><th>{t('license')}</th><th>{t('passport')}</th><th>{t('visa')}</th><th>{t('medical')}</th><th>{t('id_card')}</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{textAlign:'center',padding:40}}><div className="spinner dark" style={{margin:'0 auto'}}/></td></tr>
                ) : filteredDrivers.length===0 ? (
                  <tr><td colSpan={8}><div className="tbl-empty"><div className="tbl-empty-icon">📄</div><div className="tbl-empty-title">{t('no_data')}</div><div className="tbl-empty-sub">{t('import_csv')}</div></div></td></tr>
                ) : filteredDrivers.map((d,i)=>(
                  <tr key={d.id}>
                    <td>{i+1}</td>
                    <td style={{fontWeight:500}}>{d.full_name||'--'}</td>
                    <td>{d.depot||'--'}</td>
                    <td><div style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>{expTag(d.license_expired)}<span style={{fontSize:11,color:'#94a3b8'}}>{fmt(d.license_expired)}</span></div></td>
                    <td><div style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>{expTag(d.passport_expired)}<span style={{fontSize:11,color:'#94a3b8'}}>{fmt(d.passport_expired)}</span></div></td>
                    <td><div style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>{expTag(d.visa_expired)}<span style={{fontSize:11,color:'#94a3b8'}}>{fmt(d.visa_expired)}</span></div></td>
                    <td><div style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>{expTag(d.medical_expired)}<span style={{fontSize:11,color:'#94a3b8'}}>{fmt(d.medical_expired)}</span></div></td>
                    <td>{d.id_card_status||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="tf-info">{t('showing')} {Math.min((page-1)*LIMIT+1,total)}–{Math.min(page*LIMIT,total)} {t('of')} {total.toLocaleString()}</span>
            <div className="pager">
              {page>1&&<button onClick={()=>loadTable(page-1)}>‹</button>}
              {Array.from({length:Math.min(5,pages)},(_,i)=>{const p=Math.max(1,Math.min(page-2,pages-4))+i;return<button key={p} className={p===page?'active':''} onClick={()=>loadTable(p)}>{p}</button>})}
              {page<pages&&<button onClick={()=>loadTable(page+1)}>›</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}