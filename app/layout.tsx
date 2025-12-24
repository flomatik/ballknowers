import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NFL Pick\'em League',
  description: 'Track your NFL pick\'em league with automatic team record updates',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

