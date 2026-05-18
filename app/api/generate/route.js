import { NextResponse } from 'next/server'

async function scrapeLinkedIn(linkedinUrl) {
  if (!linkedinUrl || !process.env.PROXYCURL_API_KEY) return null
  try {
    const url = `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}&use_cache=if-present`
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${process.env.PROXYCURL_API_KEY}` }
    })
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch(e) {
    console.error('ProxyCurl error:', e.message)
    return null
  }
}

function buildLinkedInContext(profile) {
  if (!profile) return null
  const parts = []
  if (profile.full_name) parts.push(`Name: ${profile.full_name}`)
  if (profile.headline) parts.push(`Headline: ${profile.headline}`)
  if (profile.summary) parts.push(`Summary: ${profile.summary?.slice(0, 300)}`)
  if (profile.experiences?.[0]) {
    const exp = profile.experiences[0]
    parts.push(`Current role: ${exp.title} at ${exp.company}`)
    if (exp.description) parts.push(`Role description: ${exp.description?.slice(0, 200)}`)
  }
  if (profile.education?.[0]) {
    const edu = profile.education[0]
    parts.push(`Education: ${edu.degree_name} at ${edu.school}`)
  }
  if (profile.accomplishment_posts?.[0]) {
    parts.push(`Recent post: ${profile.accomplishment_posts[0].description?.slice(0, 200)}`)
  }
  if (profile.skills?.length) {
    parts.push(`Skills: ${profile.skills.slice(0, 8).join(', ')}`)
  }
  return parts.join('\n')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { sender_name, sender_role, prospect_name, prospect_company, prospect_role, linkedin_url, linkedin_info, offering, goal, tone, userId } = body

    if (!sender_name || !offering) return NextResponse.json({ error: 'Your name and offering are required' }, { status: 400 })

    // Scrape LinkedIn if URL provided
    let scrapedProfile = null
    let scrapedContext = ''
    let prospectNameFinal = prospect_name
    let prospectCompanyFinal = prospect_company
    let prospectRoleFinal = prospect_role

    if (linkedin_url) {
      scrapedProfile = await scrapeLinkedIn(linkedin_url)
      if (scrapedProfile) {
        scrapedContext = buildLinkedInContext(scrapedProfile)
        // Auto-fill from scraped data if not provided
        if (!prospectNameFinal && scrapedProfile.full_name) prospectNameFinal = scrapedProfile.full_name
        if (!prospectCompanyFinal && scrapedProfile.experiences?.[0]?.company) prospectCompanyFinal = scrapedProfile.experiences[0].company
        if (!prospectRoleFinal && scrapedProfile.experiences?.[0]?.title) prospectRoleFinal = scrapedProfile.experiences[0].title
      }
    }

    if (!prospectNameFinal) return NextResponse.json({ error: 'Prospect name is required (or provide a LinkedIn URL to auto-fill)' }, { status: 400 })

    // Combine scraped context with manual input
    const combinedContext = [scrapedContext, linkedin_info].filter(Boolean).join('\n\n')

    const aiRes = await fetch(`${process.env.AI_API_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({
        task: 'generate_cold_outreach',
        inputs: {
          sender_name,
          sender_role: sender_role || 'Professional',
          prospect_name: prospectNameFinal,
          prospect_company: prospectCompanyFinal || 'their company',
          prospect_role: prospectRoleFinal || 'Decision Maker',
          linkedin_info: combinedContext || 'No additional context provided',
          offering,
          goal: goal || 'Book a call',
          tone: tone || 'Professional'
        }
      })
    })

    const aiData = await aiRes.json()
    if (!aiRes.ok) throw new Error(aiData.error || 'AI failed')
    const result = aiData.data

    // Save to DB
    let itemId = null
    if (userId && process.env.DB_API_URL) {
      try {
        const dbRes = await fetch(`${process.env.DB_API_URL}/db/vectorreach/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_VECTORREACH}` },
          body: JSON.stringify({
            user_id: userId,
            title: `To ${prospectNameFinal}${prospectCompanyFinal ? ' at ' + prospectCompanyFinal : ''}`,
            prospect_name: prospectNameFinal,
            prospect_company: prospectCompanyFinal,
            linkedin_url,
            result_data: result,
            scraped: !!scrapedProfile,
            status: 'complete'
          })
        })
        const dbData = await dbRes.json()
        itemId = dbData.data?.id || null
      } catch(e) {}
    }

    return NextResponse.json({
      itemId,
      result,
      scraped: !!scrapedProfile,
      prospectName: prospectNameFinal,
      prospectCompany: prospectCompanyFinal,
      prospectRole: prospectRoleFinal
    })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
