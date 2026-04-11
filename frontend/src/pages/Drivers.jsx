import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useStore } from '../store'
import toast from 'react-hot-toast'

function Tag({ v }) {
  if (!v) return <span className="tag tag-gray">--</span>
  const l = v.toLowerCase()
  const cls = l==='active'||l==='pass'||l==='renewed' ? 'tag-green'
    : l==='terminated'||l==='fail'||l==='expired' ? 'tag-red'
    : l==='applied' ? 'tag-blue' : 'tag-gray'
  return <span className={`tag ${cls}`}>{v}</span>
}

function EditModal({ driver, onClose, onSave }) {
  const [form, setForm] = useState({ ...driver })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const fmt = d => d ? new Date(d).toISOString().slice(0,10) : ''

  async function save() {
    if (!form.full_name) return toast.error('Full name is required')
    setSaving(true)
    try { await onSave(form); onClose() }
    catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Edit Driver — {driver.full_name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">RTA ID</label><input className="form-input" value={form.rta_id||''} onChange={e=>set('rta_id',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.full_name||''} onChange={e=>set('full_name',e.target.value)}/></div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" value={form.nationality||''} onChange={e=>set('nationality',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Depot</label>
              <select className="form-select" value={form.depot||''} onChange={e=>set('depot',e.target.value)}>
                {['Al Awir','Al Quoz','Jebel Ali','Al Ruwayah','Al Khawaneej','Qusais','Etisalat Depot'].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">Contractor</label>
              <select className="form-select" value={form.contractor||''} onChange={e=>set('contractor',e.target.value)}>
                {['Reach','Omnix','Expert plus','Ultimate1','AlSahra','AlSundus','Ultimate2'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={form.real_time_status||''} onChange={e=>set('real_time_status',e.target.value)}>
                <option>Active</option><option>Terminated</option>
              </select>
            </div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">Date of Hire</label><input className="form-input" type="date" value={fmt(form.date_of_hire)} onChange={e=>set('date_of_hire',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-input" type="date" value={fmt(form.date_of_birth)} onChange={e=>set('date_of_birth',e.target.value)}/></div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">License Number</label><input className="form-input" value={form.license_number||''} onChange={e=>set('license_number',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">License Expiry</label><input className="form-input" type="date" value={fmt(form.license_expired)} onChange={e=>set('license_expired',e.target.value)}/></div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">Passport Expiry</label><input className="form-input" type="date" value={fmt(form.passport_expired)} onChange={e=>set('passport_expired',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Visa Expiry</label><input className="form-input" type="date" value={fmt(form.visa_expired)} onChange={e=>set('visa_expired',e.target.value)}/></div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">Medical Expiry</label><input className="form-input" type="date" value={fmt(form.medical_expired)} onChange={e=>set('medical_expired',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Contact</label><input className="form-input" value={form.contact||''} onChange={e=>set('contact',e.target.value)}/></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}

function Detail({ driver, onClose, onEdit, onDelete, isAdmin }) {
  if (!driver) return null
  const days = (d) => { if (!d) return null; return Math.round((new Date(d) - new Date()) / 86400000) }
  const expTag = (d) => {
    const n = days(d)
    if (n === null) return <span className="tag tag-gray">--</span>
    if (n < 0)   return <span className="tag tag-red">Expired {Math.abs(n)}d ago</span>
    if (n <= 30) return <span className="tag tag-amber">{n}d left</span>
    if (n <= 90) return <span className="tag tag-amber">{n}d left</span>
    return <span className="tag tag-green">Valid</span>
  }
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '--'

  return (
    <div className="detail-overlay open" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="detail-backdrop" onClick={onClose}/>
      <div className="detail-panel slide-in" style={{transform:'translateX(0)'}}>
        <div className="dp-header">
          <div className="avatar lg" style={{background:'#2563eb'}}>{driver.full_name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="dp-name">{driver.full_name}</div>
            <div className="dp-id">RTA ID: {driver.rta_id || '--'}</div>
          </div>
          <button className="dp-close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="dp-body">
          <div className="dp-section">
            <div className="dp-section-title">Employment</div>
            {[['Depot',driver.depot],['Contractor',driver.contractor],['Status',driver.real_time_status],['Date of Hire',fmt(driver.date_of_hire)],['ID Card',driver.id_card_status]].map(([k,v])=>(
              <div className="dp-row" key={k}><span className="dp-key">{k}</span><span className="dp-val">{k==='Status'?<Tag v={v}/>:v||'--'}</span></div>
            ))}
          </div>
          <div className="dp-section">
            <div className="dp-section-title">Document Expiry</div>
            {[['License Expired',driver.license_expired],['Passport Expired',driver.passport_expired],['Visa Expired',driver.visa_expired],['Medical Expired',driver.medical_expired]].map(([k,d])=>(
              <div className="dp-row" key={k}><span className="dp-key">{k}</span><span className="dp-val" style={{display:'flex',gap:6,alignItems:'center',justifyContent:'flex-end'}}>{expTag(d)} <span style={{fontSize:11,color:'#94a3b8'}}>{fmt(d)}</span></span></div>
            ))}
          </div>
          <div className="dp-section">
            <div className="dp-section-title">Personal Info</div>
            {[['Nationality',driver.nationality],['Date of Birth',fmt(driver.date_of_birth)],['Contact',driver.contact],['License No.',driver.license_number],['License Class',driver.license_class]].map(([k,v])=>(
              <div className="dp-row" key={k}><span className="dp-key">{k}</span><span className="dp-val">{v||'--'}</span></div>
            ))}
          </div>
          {driver.real_time_status==='Terminated' && (
            <div className="dp-section">
              <div className="dp-section-title">Termination</div>
              {[['Date Left',fmt(driver.date_of_resignation)],['Reason',driver.reason_for_leaving]].map(([k,v])=>(
                <div className="dp-row" key={k}><span className="dp-key">{k}</span><span className="dp-val">{v||'--'}</span></div>
              ))}
            </div>
          )}
        </div>
        {isAdmin && (
          <div style={{padding:'14px 20px',borderTop:'1px solid #f1f5f9',display:'flex',gap:8}}>
            <button className="btn btn-ghost" style={{flex:1,justifyContent:'center'}} onClick={()=>onEdit(driver)}>Edit</button>
            <button className="btn btn-ghost" style={{flex:1,justifyContent:'center',color:'#dc2626',borderColor:'#fecaca'}} onClick={()=>onDelete(driver)}>Delete</button>
          </div>
        )}
      </div>
    </div>
  )
}

function AddModal({ onClose, onSave }) {
  const [form, setForm] = useState({ real_time_status:'Active', depot:'Al Awir', contractor:'Reach' })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  async function save() {
    if (!form.full_name) return toast.error('Full name is required')
    setSaving(true)
    try { await onSave(form); onClose() }
    catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Add New Driver</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">RTA ID</label><input className="form-input" placeholder="e.g. 33083" onChange={e=>set('rta_id',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="Full name" onChange={e=>set('full_name',e.target.value)}/></div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" placeholder="e.g. Pakistan" onChange={e=>set('nationality',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Depot</label>
              <select className="form-select" onChange={e=>set('depot',e.target.value)}>
                {['Al Awir','Al Quoz','Jebel Ali','Al Ruwayah','Al Khawaneej','Qusais','Etisalat Depot'].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">Contractor</label>
              <select className="form-select" onChange={e=>set('contractor',e.target.value)}>
                {['Reach','Omnix','Expert plus','Ultimate1','AlSahra','AlSundus','Ultimate2'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" onChange={e=>set('real_time_status',e.target.value)}>
                <option>Active</option><option>Terminated</option>
              </select>
            </div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">Date of Hire</label><input className="form-input" type="date" onChange={e=>set('date_of_hire',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-input" type="date" onChange={e=>set('date_of_birth',e.target.value)}/></div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">License Number</label><input className="form-input" onChange={e=>set('license_number',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">License Expiry</label><input className="form-input" type="date" onChange={e=>set('license_expired',e.target.value)}/></div>
          </div>
          <div className="form-row c2">
            <div className="form-group"><label className="form-label">Passport Expiry</label><input className="form-input" type="date" onChange={e=>set('passport_expired',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Visa Expiry</label><input className="form-input" type="date" onChange={e=>set('visa_expired',e.target.value)}/></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save Driver'}</button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{maxWidth:400}}>
        <div className="modal-header">
          <div className="modal-title">Confirm Delete</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body"><p style={{margin:0,color:'#475569'}}>{message}</p></div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{background:'#dc2626',borderColor:'#dc2626'}} disabled={busy} onClick={async()=>{setBusy(true);await onConfirm();setBusy(false)}}>
            {busy?'Deleting...':'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Drivers() {
  const { isAdmin } = useStore()
  const [drivers, setDrivers]   = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editDriver, setEditDriver] = useState(null)
  const [deleteDriver, setDeleteDriver] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [slicerOpen, setSlicerOpen] = useState(false)
  const [filters, setFilters]   = useState({})
  const fileRef = useRef()
  const LIMIT = 100

  async function load(p=1, f=filters, s=search) {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT, ...f }
      if (s) params.search = s
      const res = await api.getDrivers(params)
      setDrivers(res.data); setTotal(res.total); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false); setFiltering(false) }
  }

  useEffect(() => { load() }, [])

  function applyFilter(k, v) {
    const f = { ...filters, [k]: v || undefined }
    Object.keys(f).forEach(k => !f[k] && delete f[k])
    setFilters(f); load(1, f, search)
  }

  function reset() { setFilters({}); setSearch(''); load(1,{},'') }

  async function handleAdd(data) {
    const d = await api.addDriver(data)
    setDrivers(prev => [d, ...prev])
    setTotal(t => t+1)
    toast.success('Driver added')
  }

  async function handleEdit(data) {
    const updated = await api.updateDriver(data.id, data)
    setDrivers(prev => prev.map(d => d.id===updated.id ? updated : d))
    if (selected?.id === updated.id) setSelected(updated)
    toast.success('Driver updated')
  }

  async function handleDelete(driver) {
    await api.deleteDriver(driver.id)
    setDrivers(prev => prev.filter(d => d.id !== driver.id))
    setTotal(t => t-1)
    setDeleteDriver(null)
    setSelected(null)
    toast.success('Driver deleted')
  }

  async function handleCSV(e) {
    const file = e.target.files[0]; if (!file) return
    toast.loading('Uploading... this may take 30-60s for large files', { id: 'csv' })
    try {
      const text = await file.text()
      const res = await api.uploadCSV('payroll', text)
      toast.dismiss('csv'); toast.success(`Imported ${res.inserted} drivers (${res.skipped} skipped)`)
      load(1)
    } catch(err) { toast.dismiss(); toast.error(err.message) }
    e.target.value = ''
  }

  const pages = Math.ceil(total / LIMIT)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{background:'#eff6ff',color:'#1d4ed8'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <div className="dh-title">Drivers Profile</div>
            <div className="dh-sub">{total.toLocaleString()} total records</div>
          </div>
        </div>
        <div className="dh-actions">
          <button className="btn btn-ghost" onClick={()=>setSlicerOpen(s=>!s)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Slicers
          </button>
          {isAdmin() && <>
            <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV}/>
            <button className="btn btn-ghost" onClick={()=>fileRef.current.click()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              Import CSV
            </button>
            <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Add Driver</button>
          </>}
        </div>
      </div>

      <div className={`slicer-bar ${slicerOpen?'open':''}`}>
        <span className="slicer-label">Slicers</span>
        {[['Status','status',['Active','Terminated']],['Depot','depot',['Al Awir','Al Quoz','Jebel Ali','Al Ruwayah','Al Khawaneej','Qusais','Etisalat Depot']],['Nationality','nationality',['India','Pakistan','Philippines','Sri Lanka','Egypt','Nepal','Sudan','Kenya']],['Contractor','contractor',['Reach','Omnix','Expert plus','Ultimate1','AlSahra','AlSundus','Ultimate2']]].map(([label,key,opts])=>(
          <select key={key} className="slicer-select" value={filters[key]||''} onChange={e=>applyFilter(key,e.target.value)}>
            <option value="">All {label}s</option>
            {opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
        <button className="slicer-reset" onClick={reset}>Reset</button>
        <button className="slicer-close" onClick={()=>setSlicerOpen(false)}>✕</button>
      </div>

      <div className="page-body">
        <div className="kpi-grid c4">
          {[
            ['Total',      total,                                                          '#1d4ed8','#eff6ff'],
            ['Active',     drivers.filter(d=>d.real_time_status==='Active').length,        '#059669','#f0fdf4'],
            ['Terminated', drivers.filter(d=>d.real_time_status==='Terminated').length,    '#dc2626','#fef2f2'],
            ['This Page',  drivers.length,                                                 '#7c3aed','#f5f3ff'],
          ].map(([l,v,c,bg])=>(
            <div key={l} className="kpi" style={{'--kc':c,'--kc-bg':bg}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">{l}</div>
              <div className="kpi-value">{Number(v).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="table-card">
          <div className="table-toolbar">
            <div className="tt-title">Driver Records</div>
            <div className="tt-badge">{total.toLocaleString()} drivers</div>
            <div className="tt-right">
              <div className="search-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input placeholder="Search name or RTA ID..." value={search}
                  onChange={e=>setSearch(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&load(1,filters,search)}/>
              </div>
              <button className="btn btn-ghost" onClick={()=>load(1,filters,search)}>Search</button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>#</th><th>RTA ID</th><th>Full Name</th><th>Nationality</th>
                <th>Depot</th><th>Contractor</th><th>Status</th><th>ID Card</th>
                {isAdmin() && <th style={{width:90}}>Actions</th>}
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin()?9:8} style={{textAlign:'center',padding:40}}><div className="spinner dark" style={{margin:'0 auto'}}/></td></tr>
                ) : drivers.length === 0 ? (
                  <tr><td colSpan={isAdmin()?9:8}><div className="tbl-empty"><div className="tbl-empty-icon">📋</div><div className="tbl-empty-title">No drivers found</div><div className="tbl-empty-sub">Import a Payroll CSV to load records</div></div></td></tr>
                ) : drivers.map((d,i)=>(
                  <tr key={d.id} onClick={()=>setSelected(d)} style={{cursor:'pointer'}}>
                    <td>{(page-1)*LIMIT+i+1}</td>
                    <td><span style={{fontWeight:600,color:'#0f2044'}}>{d.rta_id||'--'}</span></td>
                    <td style={{fontWeight:500}}>{d.full_name||'--'}</td>
                    <td>{d.nationality||'--'}</td>
                    <td>{d.depot||'--'}</td>
                    <td>{d.contractor||'--'}</td>
                    <td><Tag v={d.real_time_status}/></td>
                    <td><Tag v={d.id_card_status}/></td>
                    {isAdmin() && (
                      <td onClick={e=>e.stopPropagation()} style={{whiteSpace:'nowrap'}}>
                        <button
                          onClick={()=>setEditDriver(d)}
                          style={{fontSize:11,padding:'3px 8px',borderRadius:5,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#334155',cursor:'pointer',marginRight:4}}
                        >Edit</button>
                        <button
                          onClick={()=>setDeleteDriver(d)}
                          style={{fontSize:11,padding:'3px 8px',borderRadius:5,border:'1px solid #fecaca',background:'#fff5f5',color:'#dc2626',cursor:'pointer'}}
                        >Del</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="tf-info">Showing {Math.min((page-1)*LIMIT+1,total)}–{Math.min(page*LIMIT,total)} of {total.toLocaleString()}</span>
            <div className="pager">
              {page>1 && <button onClick={()=>load(page-1)}>‹</button>}
              {Array.from({length:Math.min(5,pages)},(_,i)=>{
                const p = Math.max(1,Math.min(page-2,pages-4))+i
                return <button key={p} className={p===page?'active':''} onClick={()=>load(p)}>{p}</button>
              })}
              {page<pages && <button onClick={()=>load(page+1)}>›</button>}
            </div>
          </div>
        </div>
      </div>

      {selected && !editDriver && (
        <Detail
          driver={selected}
          onClose={()=>setSelected(null)}
          onEdit={d=>{setEditDriver(d);setSelected(null)}}
          onDelete={d=>setDeleteDriver(d)}
          isAdmin={isAdmin()}
        />
      )}
      {editDriver && <EditModal driver={editDriver} onClose={()=>setEditDriver(null)} onSave={handleEdit}/>}
      {deleteDriver && (
        <ConfirmModal
          message={`Delete "${deleteDriver.full_name}"? This cannot be undone.`}
          onConfirm={()=>handleDelete(deleteDriver)}
          onClose={()=>setDeleteDriver(null)}
        />
      )}
      {showAdd && <AddModal onClose={()=>setShowAdd(false)} onSave={handleAdd}/>}
    </div>
  )
}