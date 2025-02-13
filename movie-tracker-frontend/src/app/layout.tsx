// src/app/layout.tsx
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/providers/Providers'
import { RootLayoutProvider } from '@/components/layout/RootLayoutProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CineTrack',
  description: 'Track your favorite movies and TV shows',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.className
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <RootLayoutProvider>
              {children}
            </RootLayoutProvider>
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}