import { useState, useEffect } from 'react'
import { api } from '../api'
import toast from 'react-hot-toast'

const S = {
  card: { background:'#fff', borderRadius:12, border:'1.5px solid #e2e8f0', padding:'18px 20px' },
}

export default function Terminated() {
  const [drivers, setDrivers]   = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
const [filtering, setFiltering] = useState(false)
  const [page, setPage]         = useState(1)
  const [slicerOpen, setSlicerOpen] = useState(true)
  const [search, setSearch]     = useState('')
  const [filters, setFilters]   = useState({})
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo]     = useState('')
  const LIMIT = 100

  useEffect(() => { load(1, {}, '') }, [])

  async function load(p = 1, f = filters, q = search) {
    setLoading(true)
    try {
      const params = { page: p, limit: LIMIT, status: 'Terminated', ...f }
      if (q) params.search = q
      const res = await api.getDrivers(params)
      setDrivers(res.data); setTotal(res.total); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setFiltering(false) }
  }

  function applyFilter(k, v) {
    const f = { ...filters, [k]: v || undefined }
    Object.keys(f).forEach(k => !f[k] && delete f[k])
    setFilters(f); load(1, f, search)
  }

  function resetAll() {
    setFilters({}); setSearch(''); setYearFrom(''); setYearTo('')
    load(1, {}, '')
  }

  const fmt = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '--'
  const pages = Math.ceil(total / LIMIT)
  const activeFilters = Object.keys(filters).length + (search ? 1 : 0) + (yearFrom ? 1 : 0) + (yearTo ? 1 : 0)

  // client-side year filter on resignation date
  const filteredDrivers = drivers.filter(d => {
    if (!yearFrom && !yearTo) return true
    if (!d.date_of_resignation) return false
    const y = new Date(d.date_of_resignation).getFullYear()
    if (yearFrom && y < parseInt(yearFrom)) return false
    if (yearTo   && y > parseInt(yearTo))   return false
    return true
  })

  // reason breakdown from current page
  const reasonCount = {}
  drivers.forEach(d => {
    const r = d.reason_for_leaving || 'Unknown'
    reasonCount[r] = (reasonCount[r] || 0) + 1
  })
  const topReasons = Object.entries(reasonCount).sort((a,b) => b[1]-a[1]).slice(0, 5)

  const REASON_COLORS = ['#dc2626','#d97706','#7c3aed','#1d4ed8','#059669']

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:10, background:'#fffbeb', color:'#d97706', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:'#0f2044' }}>Terminated Drivers</div>
            <div style={{ fontSize:12, color:'#64748b' }}>{total.toLocaleString()} terminated records</div>
          </div>
        </div>
        <button onClick={() => setSlicerOpen(s => !s)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filters {activeFilters > 0 && <span style={{ background:'#d97706', color:'#fff', borderRadius:99, fontSize:10, padding:'1px 6px' }}>{activeFilters}</span>}
        </button>
      </div>

      {/* Slicers */}
      {slicerOpen && (
        <div style={{ background:'#fff', borderRadius:12, border:'1.5px solid #e2e8f0', padding:'14px 18px', display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
          {/* Search */}
          <div style={{ position:'relative', flex:'1', minWidth:180 }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && load(1, filters, search)}
              placeholder="Search name or RTA ID..." style={{ width:'100%', paddingLeft:32, paddingRight:10, height:34, border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', boxSizing:'border-box' }}/>
          </div>
          {/* Dropdowns */}
          {[
            ['Depot','depot',['Al Awir','Al Quoz','Jebel Ali','Al Ruwayah','Al Khawaneej','Qusais','Etisalat Depot']],
            ['Nationality','nationality',['India','Pakistan','Philippines','Sri Lanka','Egypt','Nepal','Bangladesh','Sudan','Syrian']],
            ['Contractor','contractor',['Omnix','Reach','Expert plus','Ultimate1','Ultimate2','Alsundus','Okool']],
            ['Reason','reason_for_leaving',['Absence','Resignation','Retirement','Alcohol Usage','Black Points - 24','Security Rejection','Contract Non Renewal']],
          ].map(([lbl, key, opts]) => (
            <select key={key} value={filters[key]||''} onChange={e => applyFilter(key, e.target.value)}
              style={{ height:34, border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, padding:'0 10px', background:'#fff', color:'#374151', cursor:'pointer', outline:'none' }}>
              <option value="">All {lbl}</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {/* Year range */}
          <select value={yearFrom} onChange={e => { setYearFrom(e.target.value) }}
            style={{ height:34, border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, padding:'0 10px', background:'#fff', color:'#374151', cursor:'pointer', outline:'none' }}>
            <option value="">From Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={yearTo} onChange={e => { setYearTo(e.target.value) }}
            style={{ height:34, border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, padding:'0 10px', background:'#fff', color:'#374151', cursor:'pointer', outline:'none' }}>
            <option value="">To Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={resetAll} style={{ height:34, padding:'0 14px', borderRadius:7, border:'1.5px solid #e2e8f0', background:'#f8fafc', fontSize:13, fontWeight:600, color:'#64748b', cursor:'pointer' }}>Reset</button>
        </div>
      )}

      {/* KPI + Reason breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1.5fr', gap:12 }}>
        {[
          ['Total Terminated', total,  '#d97706','#fffbeb'],
          ['This Page',        filteredDrivers.length, '#1d4ed8','#eff6ff'],
          ['Unique Reasons',   Object.keys(reasonCount).length, '#7c3aed','#f5f3ff'],
        ].map(([l,v,c,bg]) => (
          <div key={l} style={{ ...S.card, borderTop:`3px solid ${c}` }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:.6, marginBottom:6 }}>{l}</div>
            <div style={{ fontSize:28, fontWeight:800, color:c }}>{typeof v==='number' ? v.toLocaleString() : v}</div>
          </div>
        ))}
        {/* Reason breakdown mini chart */}
        <div style={{ ...S.card, borderTop:'3px solid #dc2626' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.6, marginBottom:10 }}>Top Reasons (this page)</div>
          {topReasons.map(([reason, count], i) => (
            <div key={reason} style={{ marginBottom:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#374151', marginBottom:2 }}>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>{reason}</span>
                <span style={{ fontWeight:700, color:REASON_COLORS[i] }}>{count}</span>
              </div>
              <div style={{ height:4, background:'#f1f5f9', borderRadius:99 }}>
                <div style={{ height:4, borderRadius:99, background:REASON_COLORS[i], width:`${(count/drivers.length)*100}%` }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...S.card, padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1.5px solid #f1f5f9' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f2044' }}>Terminated Records</div>
          <div style={{ fontSize:12, fontWeight:600, color:'#64748b', background:'#f1f5f9', padding:'3px 10px', borderRadius:99 }}>{filteredDrivers.length.toLocaleString()} records</div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['#','RTA ID','Name','Nationality','Depot','Contractor','Date Left','Reason'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, borderBottom:'1.5px solid #f1f5f9', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Loading...</td></tr>
              ) : filteredDrivers.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>No terminated records found</td></tr>
              ) : filteredDrivers.map((d, i) => (
                <tr key={d.id} style={{ borderBottom:'1px solid #f8fafc' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background=''}
                >
                  <td style={{ padding:'10px 14px', color:'#94a3b8', fontSize:12 }}>{(page-1)*LIMIT+i+1}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:'#0f2044' }}>{d.rta_id||'--'}</td>
                  <td style={{ padding:'10px 14px', fontWeight:500, color:'#0f2044' }}>{d.full_name||'--'}</td>
                  <td style={{ padding:'10px 14px', color:'#374151' }}>{d.nationality||'--'}</td>
                  <td style={{ padding:'10px 14px', color:'#374151', whiteSpace:'nowrap' }}>{d.depot||'--'}</td>
                  <td style={{ padding:'10px 14px', color:'#374151', whiteSpace:'nowrap' }}>{d.contractor||'--'}</td>
                  <td style={{ padding:'10px 14px', color:'#374151', whiteSpace:'nowrap' }}>{fmt(d.date_of_resignation)}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ background:'#fef2f2', color:'#dc2626', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600 }}>{d.reason_for_leaving||'--'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderTop:'1.5px solid #f1f5f9' }}>
          <span style={{ fontSize:12, color:'#94a3b8' }}>Showing {Math.min((page-1)*LIMIT+1,total)}–{Math.min(page*LIMIT,total)} of {total.toLocaleString()}</span>
          <div style={{ display:'flex', gap:4 }}>
            {page>1 && <button onClick={() => load(page-1)} style={{ padding:'4px 10px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>‹</button>}
            {Array.from({length:Math.min(5,pages)}, (_, i) => { const p=Math.max(1,Math.min(page-2,pages-4))+i; return (
              <button key={p} onClick={() => load(p)} style={{ padding:'4px 10px', borderRadius:6, border:'1.5px solid #e2e8f0', background:p===page?'#0f2044':'#fff', color:p===page?'#fff':'#374151', cursor:'pointer', fontSize:13, fontWeight:p===page?700:400 }}>{p}</button>
            )})}
            {page<pages && <button onClick={() => load(page+1)} style={{ padding:'4px 10px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>›</button>}
          </div>
        </div>
      </div>

    </div>
  )
}