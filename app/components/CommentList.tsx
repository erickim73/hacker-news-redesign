"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { Comment as CommentType } from "../lib/api"
import Comment from "./Comments"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare } from "lucide-react"
import axios from "axios"

interface CommentSectionProps {
  storyId: number
  commentCount?: number
}

const CommentSection: React.FC<CommentSectionProps> = ({ storyId, commentCount = 0 }) => {
    const [comments, setComments] = useState<CommentType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [visibleComments, setVisibleComments] = useState<number>(10)

    // track if comments have been loaded
    const commentsLoadedRef = useRef(false)

    const BASE_URL = "https://hacker-news.firebaseio.com/v0"

    const loadMoreComments = () => {
        setVisibleComments(prev => prev + 10) 
    }

    useEffect(() => {
        // Reset state when storyId changes
        if (storyId) {
            setLoading(true)
            setError(null)
            commentsLoadedRef.current = false
            setVisibleComments(10)
        }
    }, [storyId])

    useEffect(() => {
        // skip if we've already loaded comments or if storyId is invalid
        if (commentsLoadedRef.current || !storyId) {
            return
        }

    const controller = new AbortController()
    const signal = controller.signal

    const loadComments = async () => {
        try {
            setLoading(true)
            setError(null)


            // fetch the story to get comment IDs
            const storyResponse = await axios.get(`${BASE_URL}/item/${storyId}.json`, { signal })
            const story = storyResponse.data

            if (!story || !story.kids || story.kids.length === 0) {
                setComments([])
                setLoading(false)
                commentsLoadedRef.current = true
                return
            }

            const topLevelCommentIds = story.kids.slice(0, 30)

            const commentPromises = topLevelCommentIds.map(async (id: number) => {
                try {
                    const response = await axios.get(`${BASE_URL}/item/${id}.json`, { signal })
                    const comment = response.data
                    
                    if (!comment || comment.deleted || comment.dead) return null
                    
                    return { 
                        ...comment, 
                        replies: comment.kids && comment.kids.length > 0 ? [] : null,
                        hasUnloadedReplies: comment.kids && comment.kids.length > 0
                    }
                } catch (error) {
                    if (axios.isCancel(error)) return null
                    console.error(`Error fetching comment ${id}:`, error)
                    return null
                }
            })

        

        const topLevelComments = (await Promise.all(commentPromises)).filter(Boolean) as CommentType[]

        // only update state if the component is still mounted
        if (!signal.aborted) {
            setComments(topLevelComments)
            commentsLoadedRef.current = true
        }
        } catch (err) {
            if (axios.isCancel(err)) {
                // request was cancelled, ignore
                return
            }
            console.error("Error loading comments:", err)
            setError("Failed to load comments. Please try again later.")
        } finally {
            if (!signal.aborted) {
            setLoading(false)
            }
        }
    }

    loadComments()

    // cleanup function to abort any in-flight requests when the component unmounts
    return () => {
        controller.abort()
    }
}, [storyId]) // only re-run if storyId changes

    if (loading) {
    return (
        <div className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">Comments</h2>
            {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-16 w-full" />
                </div>
            ))}
        </div>
        )
    }

    if (error) {
        return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">{error}</div>
        </div>
        )
    }

    if (comments.length === 0) {
        return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">No comments yet</h3>
                <p className="text-sm max-w-md">Be the first to comment on this story.</p>
            </div>
        </div>
        )
    }

    const displayedComments = comments.slice(0, visibleComments)

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Comments ({commentCount || comments.length})</h2>
            <div className="space-y-4">
                {displayedComments.map((comment) => (
                    <Comment key={comment.id} comment={comment} />
                ))}
            </div>

            {visibleComments < comments.length && (
                <button 
                    onClick={loadMoreComments}
                    className="mt-4 w-full py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors"
                >
                    Load more comments
                </button>
            )}

            {commentCount > comments.length && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                Showing {comments.length} of {commentCount} comments
                </div>
            )}
        </div>
    )
}

export default CommentSection

