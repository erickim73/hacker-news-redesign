"use client"

import type React from "react"
import { Provider } from 'react-redux';
import { IBM_Plex_Sans } from "next/font/google"
import { ThemeProvider } from './components/theme-provider'
import { Newspaper } from "lucide-react"
import Link from 'next/link'
import store from "./redux/store";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] })

export default function RootLayout({
    children,
}: {
    children: React.ReactNode; 
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={plexSans.className}>
                <Provider store={store}>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        <div className="min-h-dvh flex flex-col">
                            
                            <header className="border-b sticky top-0 z-10 bg-background">
                                <div className="max-w-4xl mx-auto flex items-center justify-between h-16 px-4">
                                    <Link href="/" className="flex items-center gap-2">
                                        <Newspaper className="h-6 w-6 text-primary" />
                                        <span className="font-bold text-lg">Hacker News</span>
                                    </Link>
                                </div>
                            </header>

                            <main className="flex-1 bg-background">
                                {children}
                                <Analytics />
                            </main>

                            <footer className="border-t py-6 text-center text-sm text-muted-foreground bg-background">
                                <div className="max-w-4xl mx-auto px-4">
                                    <p>© {new Date().getFullYear()} Hacker News Redesigned</p>
                                </div>
                            </footer>

                        </div>
                    </ThemeProvider>
                </Provider>
            </body>
        </html>
    )
}
