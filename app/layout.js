export const metadata = {
  title: 'VectorReach — Fill in the prospect details and get a personalised, research-backed cold outreach message instantly.',
  description: 'Fill in the prospect details and get a personalised, research-backed cold outreach message instantly.',
}
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      </head>
      <body style={{margin:0,padding:0,fontFamily:'Inter,sans-serif'}}>{children}</body>
    </html>
  )
}
