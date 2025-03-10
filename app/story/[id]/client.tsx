'use client'

import { useEffect, useState } from 'react'
import HackerNewsAPI, { type Story } from '../../lib/api'
import { useLocalStorage } from '../../lib/localStorage'
import CommentSection from '../../components/CommentList'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, CalendarDays, ExternalLink, MessageSquare, User } from "lucide-react"
import Link from 'next/link'

interface StoryProps {
    storyId: string;
}

export default function StoryDetail({ storyId }: StoryProps) {   
    const storyIdNumber = Number(storyId)

    const [story, setStory] = useState<Story | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // local storage for read/starred states
    const [readStories, setReadStories] = useLocalStorage<number[]>("readStories", [])
    const [starredStories, setStarredStories] = useLocalStorage<number[]>("starredStories", [])

    const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false)

    useEffect(() => {
        const fetchStory = async () => {
            if (!storyIdNumber) return
        
            setLoading(true)
            setError(null)
        
            try {
                const storyData = await HackerNewsAPI.getStory(storyIdNumber)
        
                if (!storyData) {
                    setError("Story not found")
                    setLoading(false)
                    return
                }
        
                // mark as read
                if (!readStories.includes(storyIdNumber) && !hasMarkedAsRead) {
                    setReadStories([...readStories, storyIdNumber]);
                    setHasMarkedAsRead(true);
                }
        
                setStory({
                    ...storyData,
                    isRead: true,
                    isStarred: starredStories.includes(storyIdNumber),
                })
            } catch (err) {
                console.error("Error fetching story:", err)
                setError("Failed to load story. Please try again later.")
            } finally {
                setLoading(false)
            }
        }
    
    fetchStory()
    }, [storyIdNumber, readStories, starredStories, hasMarkedAsRead])

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        })
    }

    const formatUrl = (url?: string) => {
        if (!url) return "self"
        try {
        const urlObj = new URL(url)
        return urlObj.hostname.replace("www.", "")
        } catch (error) {
        console.error("Error getting URL: ", error)
        return "link"
        }
    }

    const handleToggleStar = () => {
        if (!story) return

            const isCurrentlyStarred = starredStories.includes(story.id)

            // update story in state
            setStory({
            ...story,
            isStarred: !isCurrentlyStarred,
            })

            // update local storage
            if (isCurrentlyStarred) {
            setStarredStories(starredStories.filter((id) => id !== story.id))
            } else {
            setStarredStories([...starredStories, story.id])
        }
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/" className="flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to stories</span>
                    </Link>
                </Button>
        
                <Card>
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-8 w-3/4" />
                        <div className="flex gap-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                </Card>
        
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !story) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link href="/" className="flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to stories</span>
                </Link>
                </Button>
        
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
                    {error || "Story not found"}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link href="/" className="flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to stories</span>
                </Link>
            </Button>
    
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{story.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-2">
                        {story.url && (
                        <div className="flex items-center gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" />
                            <a
                                href={story.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary hover:underline transition-colors"
                            >
                                {formatUrl(story.url)}
                            </a>
                        </div>
                        )}
        
                    <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <Link href={`/user/${story.by}`} className="hover:text-primary hover:underline transition-colors">
                            {story.by}
                        </Link>
                    </div>
    
                    <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{formatDate(story.time)}</span>
                    </div>
    
                    <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{story.descendants || 0} comments</span>
                    </div>
    
                    <Button variant="ghost" size="sm" className="h-7 px-2 ml-auto" onClick={handleToggleStar}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill={story.isStarred ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                        </svg>
                        <span className="ml-1.5">{story.isStarred ? "Starred" : "Star"}</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {story.text && (
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: story.text }} />
                )}
            </CardContent>
        </Card>
    
        <CommentSection storyId={story.id} commentCount={story.descendants} />
    </div>
    )
}
