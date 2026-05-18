import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { prospect_name, prospect_company } = await request.json()
    if (!prospect_name || !prospect_company) {
      return NextResponse.json({ error: 'Name and company required' }, { status: 400 })
    }

    // Strip domain to just the domain part if full URL provided
    const domain = prospect_company
      .replace(/https?:\/\//,'')
      .replace(/www\./,'')
      .split('/')[0]
      .trim()

    const params = new URLSearchParams({
      name: prospect_name,
      employer_website: domain.includes('.') ? domain : `${domain}.com`
    })

    const res = await fetch(
      `https://nubela.co/api/v1/employee/profile?${params}`,
      { headers: { 'Authorization': `Bearer ${process.env.PROXYCURL_API_KEY}` } }
    )

    if (!res.ok) return NextResponse.json({ enriched: false })
    const data = await res.json()

    return NextResponse.json({
      enriched: true,
      name: data.full_name || prospect_name,
      role: data.current_role || data.headline || '',
      company: data.current_employer || prospect_company,
      summary: data.summary?.slice(0, 400) || '',
      skills: data.skills?.slice(0, 8) || [],
    })
  } catch(err) {
    return NextResponse.json({ enriched: false })
  }
}
