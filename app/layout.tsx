import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from './components/theme-provider'
import { Newspaper } from "lucide-react"
import Link from 'next/link'
import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] })

// metadata for website
export const metadata: Metadata = {
    title: "Hacker News Redesign",
    description: "A modern redesign of Hacker News",
}

// root layout component
export default function RootLayout({
    children,
}: {
    children: React.ReactNode; // define expected prop type
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            {/* apply inter font globally */}
            <body className={inter.className}>

                {/* wrap entire layout in themeprovider to enable dark/light mode support */}
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    {/* main container with flexible height layout */}
                    <div className="min-h-dvh flex flex-col">
                        {/* sticky header */}
                        <header className="border-b sticky top-0 z-10 bg-background">
                            {/* container for nav bar */}
                            <div className="max-w-4xl mx-auto flex items-center justify-between h-16 px-4">
                                {/* logo and site name */}
                                <Link href="/" className="flex items-center gap-2">
                                    <Newspaper className="h-6 w-6 text-primary" />
                                    <span className="font-bold text-lg">Hacker News</span>
                                </Link>
                            </div>
                        </header>

                        {/* main content area with child components */}
                        <main className="flex-1 bg-background">
                            {children}
                        </main>

                        {/* footer with copyright */}
                        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
                            <div className="max-w-4xl mx-auto px-4">
                                <p>© {new Date().getFullYear()} Hacker News Redesigned</p>
                            </div>
                        </footer>
                    </div>
                    
                </ThemeProvider>
            </body>
        </html>
    )
}
