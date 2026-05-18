import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { linkedin_url } = await request.json()
    if (!linkedin_url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const res = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedin_url)}&use_cache=if-present`,
      { headers: { 'Authorization': `Bearer ${process.env.PROXYCURL_API_KEY}` } }
    )

    if (!res.ok) return NextResponse.json({ error: 'Could not fetch profile' }, { status: 400 })
    const data = await res.json()

    return NextResponse.json({
      name: data.full_name || '',
      company: data.experiences?.[0]?.company || '',
      role: data.experiences?.[0]?.title || '',
      headline: data.headline || '',
      summary: data.summary?.slice(0, 500) || '',
      recent_post: data.accomplishment_posts?.[0]?.description?.slice(0, 300) || '',
      skills: data.skills?.slice(0, 8) || [],
    })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
