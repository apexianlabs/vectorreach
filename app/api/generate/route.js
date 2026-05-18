import { NextResponse } from 'next/server'

const AI_API_URL = process.env.AI_API_URL
const AI_API_KEY = process.env.AI_API_KEY
const DB_API_URL = process.env.DB_API_URL
const DB_API_KEY = process.env.DB_API_KEY_VECTORREACH

export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, sender_name, sender_role, prospect_name, prospect_company, prospect_role, linkedin_url, linkedin_info, offering, goal, tone, ...inputs } = body

    // Call AI API
    const aiRes = await fetch(`${AI_API_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ task: 'generate_cold_outreach', inputs })
    })
    const aiData = await aiRes.json()
    if (!aiRes.ok) throw new Error(aiData.error || 'AI generation failed')

    const result = aiData.data

    // Save to DB
    let itemId = null
    if (userId && DB_API_URL) {
      try {
        const dbRes = await fetch(`${DB_API_URL}/db/vectorreach/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DB_API_KEY}` },
          body: JSON.stringify({ user_id: userId, title: `To ${prospect_name} at ${prospect_company || "?"}`, prospect_name, prospect_company, result_data: result, status: 'complete' })
        })
        const dbData = await dbRes.json()
        console.error('DB response:', JSON.stringify(dbData))
        itemId = dbData.data?.id || null
      } catch(e) { console.error('DB save failed:', e.message, e.response?.data) }
    }

    return NextResponse.json({ itemId, result })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
