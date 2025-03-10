'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import HackerNewsAPI from '../../lib/api'
import CommentSection from '../../components/CommentList'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, CalendarDays, ExternalLink, MessageSquare, User } from "lucide-react"
import Link from 'next/link'
import story from '../../redux/store'
import { fetchStoryStart, fetchStorySuccess, fetchStoryFailure, markAsRead } from '../../redux/storiesSlice'

interface StoryProps {
    storyId: string;
}

// type for redux state
type RootState = ReturnType<typeof story.getState>;

export default function StoryDetail({ storyId }: StoryProps) {   
    const storyIdNumber = Number(storyId)

    const dispatch = useDispatch()
    const { currentStory: story, loading, error, readStories, starredStories } = useSelector((state: RootState) => state.stories)

    // fetch story data when component mounts or dependencies change
    useEffect(() => {
        const fetchStory = async () => {
            if (!storyIdNumber) return
        
            dispatch(fetchStoryStart())
        
            try {
                const storyData = await HackerNewsAPI.getStory(storyIdNumber)
        
                if (!storyData) {
                    dispatch(fetchStoryFailure("Story not found"))
                    return
                }
        
                // mark as read
                if (!readStories.includes(storyIdNumber)) {
                    dispatch(markAsRead(storyIdNumber))
                }
        
                dispatch(fetchStorySuccess({
                    ...storyData,
                    isRead: true,
                    isStarred: starredStories.includes(storyIdNumber),
                }))
            } catch (err) {
                console.error("Error fetching story:", err)
                dispatch(fetchStoryFailure("Failed to load story. Please try again later."))
            } 
        }
    
        fetchStory()
    }, [storyIdNumber, readStories, starredStories, dispatch])

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

    // loading skeletons while story data is being fetched
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
