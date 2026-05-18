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

    // Split name into first/last
    const nameParts = prospect_name.trim().split(' ')
    const first_name = nameParts[0]
    const last_name = nameParts.slice(1).join(' ')

    const params = new URLSearchParams({
      first_name,
      ...(last_name && { last_name }),
      employer_website: domain.includes('.') ? domain : `${domain}.com`
    })

    const res = await fetch(
      `https://nubela.co/api/v1/employee/profile?${params}`,
      { headers: { 'Authorization': `Bearer ${process.env.PROXYCURL_API_KEY}` } }
    )

    if (!res.ok) return NextResponse.json({ enriched: false })
    const data = await res.json()

    const currentJob = data.work_experience?.find(w => w.is_current) || data.work_experience?.[0]

    return NextResponse.json({
      enriched: true,
      name: data.full_name || prospect_name,
      role: currentJob?.role || '',
      company: currentJob?.company_name || prospect_company,
      location: data.location_display || '',
      bio: data.bio || '',
      follower_count: data.follower_count || 0,
      personal_website: data.personal_website || '',
    })
  } catch(err) {
    return NextResponse.json({ enriched: false })
  }
}
