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
import { cn } from '../../lib/utils'

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
            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8 overflow-x-clip">
                <Button variant="ghost" size="sm" asChild className="mb-2 sm:mb-4 -ml-2">
                    <Link href="/" className="flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to stories</span>
                    </Link>
                </Button>
        
                <Card>
                    <CardHeader className="space-y-2 px-4 py-4 sm:px-6 sm:py-6">
                        <Skeleton className="h-6 sm:h-8 w-3/4" />
                        <div className="flex gap-2">
                            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                        <Skeleton className="h-3 sm:h-4 w-full" />
                        <Skeleton className="h-3 sm:h-4 w-2/3 mt-2" />
                    </CardContent>
                </Card>
        
                <div className="space-y-3 sm:space-y-4">
                    <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
                    <div className="space-y-3 sm:space-y-4">
                        <Skeleton className="h-20 sm:h-24 w-full rounded-lg" />
                        <Skeleton className="h-20 sm:h-24 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !story) {
        return (
            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8 overflow-x-clip">
                <Button variant="ghost" size="sm" asChild className="mb-2 sm:mb-4 -ml-2">
                    <Link href="/" className="flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to stories</span>
                    </Link>
                </Button>
        
                <div className="bg-destructive/10 border border-destructive text-destructive px-3 sm:px-4 py-2 sm:py-3 rounded-md text-sm sm:text-base">
                    {error || "Story not found"}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8 overflow-x-clip">
            <Button variant="ghost" size="sm" asChild className="mb-2 sm:mb-4 -ml-2">
                <Link href="/" className="flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to stories</span>
                </Link>
            </Button>
    
            <Card>
                <CardHeader className = "px-4 py-4 sm:px-6 sm:py-6">
                    <CardTitle className="text-xl sm:text-2xl leading-tight">{story.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-2">
                        {story.url && (
                            <div className="flex items-center gap-1 sm:gap-1.5">
                                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <a
                                    href={story.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary hover:underline transition-colors truncate max-w-[120px] sm:max-w-[180px] md:max-w-none break-all"
                                >
                                    {formatUrl(story.url)}
                                </a>
                            </div>
                        )}
        
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <Link href={`/user/${story.by}`} className="hover:text-primary hover:underline transition-colors">
                            {story.by}
                        </Link>
                    </div>
    
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>{formatDate(story.time)}</span>
                    </div>
    
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>{story.descendants || 0} comments</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                {story.text && (
                    <div
                        className={cn(
                            "prose dark:prose-invert max-w-none",
                            "prose-sm sm:prose-base",
                            "prose-headings:text-base sm:prose-headings:text-lg prose-headings:font-medium",
                            "prose-pre:text-xs prose-pre:p-2 sm:prose-pre:p-3 prose-pre:my-2 sm:prose-pre:my-3 prose-pre:overflow-auto",
                            "prose-code:text-xs prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-muted",
                            "prose-ul:pl-5 prose-ol:pl-5 sm:prose-ul:pl-6 sm:prose-ol:pl-6",
                            "prose-li:my-0.5 sm:prose-li:my-1",
                            "prose-a:text-primary prose-a:break-words",
                        )}
                    dangerouslySetInnerHTML={{ __html: story.text }}
                />
            )}
            </CardContent>
        </Card>
    
        <CommentSection storyId={story.id} commentCount={story.descendants} />
        
    </div>
    )
}
