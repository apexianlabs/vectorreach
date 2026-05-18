import { NextResponse } from 'next/server'
export async function POST(request) {
  try {
    const body = await request.json()
    const { sender_name, sender_role, prospect_name, prospect_company, prospect_role, linkedin_url, linkedin_info, offering, goal, tone, userId } = body
    if (!sender_name || !prospect_name || !offering) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    const aiRes = await fetch(`${process.env.AI_API_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ task: 'generate_cold_outreach', inputs: { sender_name, sender_role: sender_role||'Professional', prospect_name, prospect_company: prospect_company||'their company', prospect_role: prospect_role||'Decision Maker', linkedin_info: [linkedin_url ? `LinkedIn: ${linkedin_url}` : '', linkedin_info||''].filter(Boolean).join(' | ') || 'No additional info', offering, goal: goal||'Book a call', tone: tone||'Professional' } })
    })
    const aiData = await aiRes.json()
    if (!aiRes.ok) throw new Error(aiData.error || 'AI failed')
    const result = aiData.data
    let itemId = null
    if (userId && process.env.DB_API_URL) {
      try {
        const dbRes = await fetch(`${process.env.DB_API_URL}/db/vectorreach/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_VECTORREACH}` },
          body: JSON.stringify({ user_id: userId, title: `To ${prospect_name} at ${prospect_company||'?'}`, prospect_name, prospect_company, result_data: result, status: 'complete' })
        })
        const dbData = await dbRes.json()
        itemId = dbData.data?.id || null
      } catch(e) {}
    }
    return NextResponse.json({ itemId, result })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
