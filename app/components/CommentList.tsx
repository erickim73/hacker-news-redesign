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

    // track if comments have been loaded
    const commentsLoadedRef = useRef(false)

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

            const baseUrl = "https://hacker-news.firebaseio.com/v0"

            // fetch the story to get comment IDs
            const storyResponse = await axios.get(`${baseUrl}/item/${storyId}.json`, { signal })
            const story = storyResponse.data

            if (!story || !story.kids || story.kids.length === 0) {
                setComments([])
                setLoading(false)
                commentsLoadedRef.current = true
                return
            }

        // function to fetch a comment by ID
        const fetchComment = async (id: number): Promise<CommentType | null> => {
            try {
                const response = await axios.get(`${baseUrl}/item/${id}.json`, { signal })
                return response.data
            } catch (error) {
                if (axios.isCancel(error)) {
                    // request was cancelled, ignore
                    return null
                }
                console.error(`Error fetching comment ${id}:`, error)
                return null
            }
        }

        // fetch comments with a maximum depth
        const fetchCommentTree = async (ids: number[], depth = 0, maxDepth = 2): Promise<CommentType[]> => {
            if (depth > maxDepth || !ids || ids.length === 0) return []

            const commentPromises = ids.map(async (id) => {
                const comment = await fetchComment(id)

                if (!comment || comment.deleted || comment.dead) return null

                // if we haven't reached max depth and the comment has children, fetch them
                if (depth < maxDepth && comment.kids && comment.kids.length > 0) {
                    const childComments = await fetchCommentTree(comment.kids, depth + 1, maxDepth)
                return { ...comment, replies: childComments }
            }

            return comment
        })

            const comments = await Promise.all(commentPromises)
            return comments.filter(Boolean) as CommentType[]
        }

        // limit to first 30 top-level comments for performance
        const topLevelCommentIds = story.kids.slice(0, 30)
        const loadedComments = await fetchCommentTree(topLevelCommentIds)

        // only update state if the component is still mounted
        if (!signal.aborted) {
            setComments(loadedComments)
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

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Comments ({commentCount || comments.length})</h2>
            <div className="space-y-4">
                {comments.map((comment) => (
                <Comment key={comment.id} comment={comment} />
                ))}
            </div>

            {commentCount > comments.length && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                Showing {comments.length} of {commentCount} comments
                </div>
            )}
        </div>
    )
}

export default CommentSection

