'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const TONES = ['Professional','Friendly','Casual','Direct','Consultative']

export default function GeneratePage() {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [enriched, setEnriched]   = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState(null)
  const [form, setForm]           = useState({
    sender_name:'', sender_role:'', prospect_name:'', prospect_company:'',
    prospect_role:'', linkedin_info:'', offering:'', goal:'Book a call', tone:'Professional'
  })

  useEffect(() => {
    try {
      const match = document.cookie.match(/vec_user=([^;]+)/)
      if (match) setUser(JSON.parse(decodeURIComponent(match[1])))
    } catch(e) {}
  }, [])

  const handleEnrich = async () => {
    if (!form.prospect_name || !form.prospect_company) return
    setEnriching(true)
    try {
      const token = document.cookie.match(/vec_token=([^;]+)/)?.[1] || ''
      const res = await fetch('/api/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prospect_name: form.prospect_name, prospect_company: form.prospect_company })
      })
      const data = await res.json()
      if (data.enriched) {
        setForm(f => ({
          ...f,
          prospect_role: f.prospect_role || data.role || '',
          linkedin_info: [data.summary, data.skills?.length ? `Skills: ${data.skills.join(', ')}` : ''].filter(Boolean).join('\n') || f.linkedin_info
        }))
        setEnriched(true)
      }
    } catch(e) {}
    setEnriching(false)
  }

  const handleSubmit = async () => {
    if (!form.sender_name || !form.offering) return setError('Your name and offering are required.')
    if (!form.prospect_name) return setError('Prospect name is required.')
    setLoading(true); setError(''); setResult(null)
    try {
      const token = document.cookie.match(/vec_token=([^;]+)/)?.[1] || ''
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, userId: user?.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.result)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const inputStyle = { width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, color:'#0f172a', background:'#fff', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }
  const labelStyle = { fontSize:11, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:5 }

  if (result) return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,sans-serif'}}>
      <nav style={{background:'#fff',borderBottom:'1px solid #e2e8f0',height:56,display:'flex',alignItems:'center',padding:'0 24px',gap:16}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:28,height:28,borderRadius:7,background:'#059669',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>V</div>
          <span style={{fontWeight:700,color:'#0f172a',fontSize:15}}>VectorReach</span>
        </Link>
        <div style={{flex:1}}/>
        {user ? <Link href="/dashboard" style={{fontSize:13,color:'#64748b',textDecoration:'none'}}>Dashboard</Link>
               : <Link href="/login" style={{fontSize:13,color:'#059669',fontWeight:600,textDecoration:'none'}}>Sign in</Link>}
      </nav>
      <div style={{maxWidth:720,margin:'0 auto',padding:'32px 24px',display:'flex',flexDirection:'column',gap:14}}>
        <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:20}}>
          <p style={{fontSize:11,fontWeight:700,color:'#059669',textTransform:'uppercase',marginBottom:4}}>
            ✅ Outreach Generated
            {enriched && <span style={{background:'#059669',color:'#fff',fontSize:9,padding:'2px 8px',borderRadius:8,marginLeft:8,fontWeight:700}}>AI-enriched</span>}
          </p>
          <p style={{fontSize:18,fontWeight:800,color:'#0f172a'}}>To: {form.prospect_name}{form.prospect_company ? ` at ${form.prospect_company}` : ''}</p>
        </div>

        {(result.subject || result.email_subject) && (
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
            <p style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',marginBottom:8}}>📧 Subject Line</p>
            <p style={{fontSize:15,fontWeight:600,color:'#0f172a'}}>{result.subject || result.email_subject}</p>
          </div>
        )}

        {(result.message || result.email_body || result.body) && (
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <p style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase'}}>✉️ Message</p>
              <button onClick={() => navigator.clipboard.writeText(result.message || result.email_body || result.body)}
                style={{fontSize:11,color:'#059669',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:600}}>
                Copy
              </button>
            </div>
            <p style={{fontSize:13,color:'#374151',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{result.message || result.email_body || result.body}</p>
          </div>
        )}

        {result.follow_up && (
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:20}}>
            <p style={{fontSize:11,fontWeight:700,color:'#059669',textTransform:'uppercase',marginBottom:8}}>📅 Suggested Follow-up</p>
            <p style={{fontSize:13,color:'#374151',lineHeight:1.7}}>{result.follow_up}</p>
          </div>
        )}

        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button onClick={() => { setResult(null); setEnriched(false); setForm({...form, prospect_name:'', prospect_company:'', prospect_role:'', linkedin_info:''}) }}
            style={{flex:1,minWidth:120,padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',fontSize:13,fontWeight:600,color:'#475569',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            New prospect
          </button>
          {user ? <Link href="/dashboard" style={{flex:1,minWidth:120,padding:'10px',borderRadius:8,border:'none',background:'#059669',color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none',textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center'}}>View dashboard →</Link>
                : <Link href="/login" style={{flex:1,minWidth:120,padding:'10px',borderRadius:8,border:'none',background:'#059669',color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none',textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center'}}>Save messages →</Link>}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,sans-serif'}}>
      <nav style={{background:'#fff',borderBottom:'1px solid #e2e8f0',height:56,display:'flex',alignItems:'center',padding:'0 24px',gap:16}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:28,height:28,borderRadius:7,background:'#059669',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>V</div>
          <span style={{fontWeight:700,color:'#0f172a',fontSize:15}}>VectorReach</span>
        </Link>
        <div style={{flex:1}}/>
        {user ? <Link href="/dashboard" style={{fontSize:13,color:'#64748b',textDecoration:'none'}}>Dashboard</Link>
               : <Link href="/login" style={{fontSize:13,color:'#059669',fontWeight:600,textDecoration:'none'}}>Sign in</Link>}
      </nav>
      <div style={{maxWidth:680,margin:'0 auto',padding:'40px 24px'}}>
        <h1 style={{fontSize:26,fontWeight:800,color:'#0f172a',marginBottom:6}}>Generate cold outreach</h1>
        <p style={{fontSize:14,color:'#64748b',marginBottom:28}}>Enter prospect details and click Enrich to auto-pull their profile, or fill in manually.</p>
        {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'12px 16px',fontSize:13,color:'#dc2626',marginBottom:20}}>{error}</div>}
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:28}}>

          <p style={{fontSize:12,fontWeight:700,color:'#059669',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>About you</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
            <div><label style={labelStyle}>Your name *</label><input value={form.sender_name} onChange={e => setForm({...form,sender_name:e.target.value})} placeholder="Jane Smith" style={inputStyle}/></div>
            <div><label style={labelStyle}>Your role</label><input value={form.sender_role} onChange={e => setForm({...form,sender_role:e.target.value})} placeholder="Founder, Sales Director..." style={inputStyle}/></div>
          </div>
          <div style={{marginBottom:20}}>
            <label style={labelStyle}>What you're offering *</label>
            <input value={form.offering} onChange={e => setForm({...form,offering:e.target.value})} placeholder="e.g. AI-powered cold outreach tool for B2B sales teams" style={inputStyle}/>
          </div>

          <p style={{fontSize:12,fontWeight:700,color:'#059669',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>About your prospect</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div><label style={labelStyle}>Prospect name *</label><input value={form.prospect_name} onChange={e => setForm({...form,prospect_name:e.target.value})} placeholder="John Doe" style={inputStyle}/></div>
            <div><label style={labelStyle}>Their company / domain</label><input value={form.prospect_company} onChange={e => setForm({...form,prospect_company:e.target.value})} placeholder="acme.com or Acme Corp" style={inputStyle}/></div>
          </div>

          {/* Enrich button */}
          {form.prospect_name && form.prospect_company && !enriched && (
            <button onClick={handleEnrich} disabled={enriching}
              style={{width:'100%',padding:'10px',borderRadius:8,border:'1px solid #bbf7d0',background:'#f0fdf4',fontSize:13,fontWeight:600,color:'#059669',cursor:enriching?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {enriching ? '⏳ Enriching profile...' : '✨ Auto-enrich prospect profile'}
            </button>
          )}
          {enriched && (
            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'10px 14px',marginBottom:14,display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:16}}>✅</span>
              <p style={{fontSize:12,color:'#059669',fontWeight:600}}>Profile enriched — role and context auto-filled from public data</p>
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div><label style={labelStyle}>Their role</label><input value={form.prospect_role} onChange={e => setForm({...form,prospect_role:e.target.value})} placeholder="Head of Sales" style={{...inputStyle, background: enriched && form.prospect_role ? '#f0fdf4' : '#fff'}}/></div>
            <div><label style={labelStyle}>Goal</label>
              <select value={form.goal} onChange={e => setForm({...form,goal:e.target.value})} style={{...inputStyle,background:'#fff'}}>
                {['Book a call','Get a reply','Demo request','Partnership','Referral'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div><label style={labelStyle}>Tone</label>
              <select value={form.tone} onChange={e => setForm({...form,tone:e.target.value})} style={{...inputStyle,background:'#fff'}}>
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:24}}>
            <label style={labelStyle}>Additional context</label>
            <textarea value={form.linkedin_info} onChange={e => setForm({...form,linkedin_info:e.target.value})}
              placeholder={enriched ? 'Auto-filled from public profile data — edit or add more context...' : 'Any extra context — recent company news, mutual connections, pain points...'}
              rows={3} style={{...inputStyle,resize:'vertical', background: enriched && form.linkedin_info ? '#f0fdf4' : '#fff'}}/>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            style={{width:'100%',padding:'13px',borderRadius:10,border:'none',background:loading?'#6ee7b7':'#059669',color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif'}}>
            {loading ? '✍️ Writing your message...' : 'Generate outreach →'}
          </button>
        </div>
      </div>
    </div>
  )
}
