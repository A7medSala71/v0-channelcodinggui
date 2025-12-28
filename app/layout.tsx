import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Signal Invader v2.1 | Channel Coding Simulator",
  description:
    "Advanced bit error rate (BER) simulation engine for testing channel coding protocols like Hamming and Repetition in AWGN and Rayleigh environments.",
  generator: "v0.app",
  keywords: ["Signal Invader", "Channel Coding", "BER Simulation", "Hamming Code", "Communication Theory"],
  authors: [{ name: "v0" }],
  openGraph: {
    title: "Signal Invader v2.1",
    description: "Interactive Channel Coding & BER Simulator",
    type: "website",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
