import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import BottomNav from "./components/BottomNav"
import TopNav from "./components/TopNav"
import IncomingRequest from "./components/IncomingRequest"
import ServiceWorkerRegister from "./components/ServiceWorkerRegister"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CodeMap",
  description: "Find your people, not their coordinates",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CodeMap",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "CodeMap",
    description: "Find your people, not their coordinates",
  },
}

export const viewport: Viewport = {
  themeColor: "#6366F1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* iOS PWA icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />

        {/* iOS splash / standalone feel */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CodeMap" />

        {/* Favicon */}
        <link rel="icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} antialiased bg-white`}>
        {/* Register service worker */}
        <ServiceWorkerRegister />

        <div className="relative mx-auto min-h-screen max-w-sm bg-white shadow-xl">
          <TopNav />
          {children}
          <BottomNav />
          <IncomingRequest />
        </div>
      </body>
    </html>
  )
}