import type { Metadata } from 'next'
import './globals.css'
import PreventHorizontalScroll from './prevent-scroll'

export const metadata: Metadata = {
  title: 'BaseSystem - RBAC Management',
  description: 'Modern RBAC system with Next.js 15 and Django',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="antialiased">
        <PreventHorizontalScroll />
        {children}
      </body>
    </html>
  )
}
