import { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '../api'
import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { useStore } from '../store'
import toast from 'react-hot-toast'

Chart.register(...registerables, ChartDataLabels)

const PAL = ['#1d4ed8','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#374151','#4f46e5','#0d9488']
const DEPOTS = ['All','Al Awir','Al Quoz','Jebel Ali','Al Ruwayah','Al Khawaneej','Qusais','Etisalat Depot']
const NATIONALITIES = ['All','India','Pakistan','Philippines','Sri Lanka','Egypt','Nepal','Bangladesh','Sudan','Syrian']
const YEAR_OPTIONS = ['All','2019','2020','2021','2022','2023','2024','2025']

function ChartBox({ id, type, labels, data, title, sub, height=240, horiz=false }) {
  const ref = useRef(); const inst = useRef()
  useEffect(() => {
    if (!ref.current || !labels?.length) return
    if (inst.current) inst.current.destroy()
    const ring = type==='doughnut'||type==='pie'
    const isLine = type==='line'
    inst.current = new Chart(ref.current, {
      type,
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ring ? PAL : isLine ? 'rgba(29,78,216,.1)' : PAL,
          borderColor: isLine ? '#1d4ed8' : ring ? '#fff' : PAL,
          borderWidth: ring ? 2 : isLine ? 2.5 : 0,
          borderRadius: ring||isLine ? 0 : 6,
          fill: isLine, tension: isLine ? 0.4 : 0,
          pointBackgroundColor: isLine ? '#1d4ed8' : undefined,
          pointRadius: isLine ? 4 : undefined,
          hoverOffset: ring ? 8 : 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 500 },
        indexAxis: horiz ? 'y' : 'x',
        plugins: {
          legend: { display: ring, position:'bottom', labels:{ boxWidth:10, padding:14, font:{size:10.5} } },
          tooltip: { backgroundColor:'#0f2044', titleColor:'#fff', bodyColor:'rgba(255,255,255,.75)', cornerRadius:10, padding:12 },
          datalabels: !isLine ? {
            display: ctx => {
              if (ring) { const t=ctx.dataset.data.reduce((a,b)=>a+b,0); return t>0&&ctx.dataset.data[ctx.dataIndex]/t>0.05 }
              const v=ctx.dataset.data[ctx.dataIndex], mx=Math.max(...ctx.dataset.data.filter(Number))
              return v>0&&mx>0&&v/mx>=0.07
            },
            color: ctx => ring?'#fff':'#334155',
            backgroundColor: ctx => ring?'rgba(0,0,0,.3)':'transparent',
            borderRadius: 3,
            padding: ctx => ring?{top:2,bottom:2,left:5,right:5}:0,
            font: { size: ring?10:10.5, weight:'700' },
            formatter: v => v>=1000?(v/1000).toFixed(1)+'k':v,
            anchor: ring?'center':horiz?'end':'end',
            align: ring?'center':horiz?'right':'top',
            clamp: true
          } : false
        },
        scales: ring ? {} : {
          x: { grid:{color:'#f8fafc'}, ticks:{font:{size:10.5},color:'#94a3b8',maxRotation:35}, border:{display:false} },
          y: { grid:{color:'#f1f5f9'}, beginAtZero:true, ticks:{font:{size:10.5},color:'#94a3b8'}, border:{display:false} }
        }
      }
    })
    return () => inst.current?.destroy()
  }, [labels, data])

  return (
    <div className="chart-card">
      <div className="cc-header"><div><div className="cc-title">{title}</div>{sub&&<div className="cc-sub">{sub}</div>}</div></div>
      <div className="chart-wrap" style={{height}}><canvas ref={ref}/></div>
    </div>
  )
}

function Slicer({ label, value, options, onChange }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <span style={{fontSize:12,color:'#64748b',whiteSpace:'nowrap'}}>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{fontSize:12,padding:'4px 8px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:'#1e293b',cursor:'pointer'}}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function Analytics() {
  const { t } = useStore()
  const [raw, setRaw]           = useState(null)
  const [filtered, setFiltered] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [depot, setDepot]       = useState('All')
  const [nationality, setNationality] = useState('All')
  const [year, setYear]         = useState('All')

  useEffect(() => {
    api.getAnalytics()
      .then(d => { setRaw(d); setFiltered(d); setLoading(false) })
      .catch(e => { toast.error(e.message); setLoading(false) })
  }, [])

  async function applyServerFilter(d, n, y) {
    setFiltering(true)
    try {
      const params = { limit: 9999 }
      if (d !== 'All') params.depot = d
      if (n !== 'All') params.nationality = n
      const res = await api.getDrivers(params)
      const rows = res.data
      const grp = field => rows.reduce((acc, r) => {
        const k = r[field]||'Unknown'; acc[k]=(acc[k]||0)+1; return acc
      }, {})
      const hireGrp = rows.reduce((acc, r) => {
        if (!r.date_of_hire) return acc
        const yr = new Date(r.date_of_hire).getFullYear()
        if (y !== 'All' && yr !== parseInt(y)) return acc
        acc[yr] = (acc[yr]||0)+1; return acc
      }, {})
      setFiltered(prev => ({
        ...prev,
        drivers: {
          ...prev.drivers,
          status: grp('real_time_status'),
          depot: grp('depot'),
          nationality: grp('nationality'),
          contractor: grp('contractor'),
          idCard: grp('id_card_status'),
          hireByYear: hireGrp,
          total: rows.length
        }
      }))
    } catch(e) { toast.error(e.message) }
    finally { setFiltering(false) }
  }

  const resetSlicers = useCallback(() => {
    setDepot('All'); setNationality('All'); setYear('All')
    setFiltered(raw)
  }, [raw])

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',padding:60}}><div className="spinner dark" style={{width:32,height:32}}/></div>
  if (!raw) return <div style={{padding:40,color:'#64748b'}}>Failed to load analytics.</div>

  const { recruitment } = raw
  const drivers = filtered?.drivers || raw.drivers
  const docs = raw.documents || {}
  const hireYears  = Object.keys(drivers.hireByYear||{}).sort().map(String)
  const hireValues = hireYears.map(k => drivers.hireByYear[k])
  const anyActive = depot!=='All'||nationality!=='All'||year!=='All'

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="dash-header">
        <div className="dh-left">
          <div className="dh-icon" style={{background:'#f5f3ff',color:'#7c3aed'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div><div className="dh-title">{t('analytics_title')}</div><div className="dh-sub">{t('live_data')}</div></div>
        </div>
        <div className="dh-actions" style={{display:'flex',gap:8,alignItems:'center'}}>
          <label style={{cursor:'pointer'}}>
            <input type="file" accept=".csv" style={{display:'none'}} onChange={async e=>{
              const file = e.target.files[0]; if(!file) return
              const text = await file.text()
              const toastId = toast.loading('Importing CSV...')
              try {
                const token = localStorage.getItem('ds_token')
                const res = await fetch('https://driver-services-dashboard.onrender.com/api/upload/csv', {
                  method:'POST',
                  headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
                  body: JSON.stringify({ type:'payroll', csvData: text })
                })
                const d = await res.json()
                if(!res.ok) throw new Error(d.error)
                toast.success(`Imported ${d.inserted} rows, skipped ${d.skipped}`, {id:toastId})
                // refresh analytics after import
                const fresh = await api.getAnalytics()
                setRaw(fresh); setFiltered(fresh)
              } catch(err) { toast.error(err.message, {id:toastId}) }
              e.target.value = ''
            }}/>
            <span className="btn btn-ghost" style={{pointerEvents:'none'}}>⬆ {t('import_csv')}</span>
          </label>
          <button className="btn btn-ghost" onClick={()=>window.print()}>{t('print')}</button>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:16,padding:'10px 24px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',flexWrap:'wrap'}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        <Slicer label={t('depot')} value={depot} options={DEPOTS} onChange={v=>{setDepot(v);applyServerFilter(v,nationality,year)}}/>
        <Slicer label={t('nationality')} value={nationality} options={NATIONALITIES} onChange={v=>{setNationality(v);applyServerFilter(depot,v,year)}}/>
        <Slicer label={t('hire_trend')} value={year} options={YEAR_OPTIONS} onChange={v=>{setYear(v);applyServerFilter(depot,nationality,v)}}/>
        {anyActive && <button onClick={resetSlicers} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',cursor:'pointer'}}>✕ Reset</button>}
        {anyActive && <span style={{fontSize:11,color:'#7c3aed',fontWeight:600}}>{t('filtered_view')}</span>}
        {filtering && <div className="spinner dark" style={{width:16,height:16}}/>}
      </div>

      <div className="page-body">
        <div className="kpi-grid c4">
          {[
            [t('kpi_total')+' '+t('drivers'), drivers.total||0,               '#1d4ed8','#eff6ff'],
            [t('kpi_active'),                 drivers.status?.Active||0,       '#059669','#f0fdf4'],
            [t('kpi_terminated'),             drivers.status?.Terminated||0,   '#dc2626','#fef2f2'],
            [t('kpi_recruitment'),            recruitment.total||0,            '#7c3aed','#f5f3ff'],
          ].map(([l,v,c,bg])=>(
            <div key={l} className="kpi" style={{'--kc':c,'--kc-bg':bg}}>
              <div className="kpi-accent"/>
              <div className="kpi-label">{l}</div>
              <div className="kpi-value">{Number(v).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="chart-grid c1">
          <ChartBox type="line" labels={hireYears} data={hireValues} title={t('hire_trend')} sub={t('live_data')} height={260}/>
        </div>

        <div className="chart-grid c2">
          <ChartBox type="bar"  labels={Object.keys(drivers.depot||{})}        data={Object.values(drivers.depot||{})}        title={t('drivers_by_depot')}  height={260}/>
          <ChartBox type="bar"  labels={Object.keys(drivers.nationality||{})}  data={Object.values(drivers.nationality||{})}  title={t('top_nationalities')} height={260} horiz/>
        </div>

        <div className="chart-grid c3">
          <ChartBox type="doughnut" labels={Object.keys(drivers.contractor||{})} data={Object.values(drivers.contractor||{})} title={t('by_contractor')}       height={220}/>
          <ChartBox type="doughnut" labels={Object.keys(drivers.idCard||{})}     data={Object.values(drivers.idCard||{})}     title={t('id_card_status')}      height={220}/>
          <ChartBox type="doughnut" labels={Object.keys(recruitment.status||{})} data={Object.values(recruitment.status||{})} title={t('recruitment_status')}  height={220}/>
        </div>

        <div className="chart-grid c2">
          <ChartBox type="doughnut"
            labels={['Pass','Fail']}
            data={[(recruitment.roadTest?.pass||0)+(recruitment.roadTest?.Pass||0),(recruitment.roadTest?.fail||0)+(recruitment.roadTest?.Fail||0)]}
            title={t('road_test')} height={220}/>
          <ChartBox type="bar"
            labels={[t('license'),t('passport'),t('visa'),t('medical')]}
            data={[docs.lic_expired||0,docs.pass_expired||0,docs.visa_expired||0,docs.med_expired||0]}
            title={t('expired_docs')} height={220}/>
        </div>
      </div>
    </div>
  )
}