import Link from 'next/link'
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hacker News Redesign",
  description: "A modern redesign of Hacker News",
};

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
        <html lang="en">
            <body className="bg-gray-100 dark:bg-gray-900 min-h-screen">
                <header className="bg-orange-500 text-white p-4 shadow-md">
                    <div className="container mx-auto flex justify-between items-center">
                        <h1 className="text-xl font-bold">Hacker News Redesign</h1>
                        <nav>
                            <ul className="flex space-x-4">
                                <li><Link href="/" className="hover:underline">Top</Link></li>
                                <li><Link href="/new" className="hover:underline">New</Link></li>
                                <li><Link href="/best" className="hover:underline">Best</Link></li>
                                <li><Link href="/starred" className="hover:underline">Starred</Link></li>
                            </ul>
                        </nav>
                    </div>
                </header>
                <main className="container mx-auto py-6 px-4">{children}</main>
                <footer className="bg-gray-200 dark:bg-gray-800 p-4 text-center text-gray-600 dark:text-gray-400">
                    <div className="container mx-auto">
                    <p>Hacker News Redesign &copy; {new Date().getFullYear()}</p>
                    </div>
                </footer>
            </body>
        </html>
    )
}
