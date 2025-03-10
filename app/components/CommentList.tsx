"use client"

import type React from "react"
import { useEffect, useRef, useCallback } from "react"
import type { Comment as CommentType } from "../lib/api"
import Comment from "./Comments"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare } from "lucide-react"
import axios from "axios"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from '../redux/store'
import { setComments, setLoading, setError, increaseVisibleComments,resetCommentState } from "../redux/commentsSlice"
import { useInfiniteScroll } from "../lib/useInfiniteScroll"

interface CommentSectionProps {
    storyId: number
    commentCount?: number
}

const CommentSection: React.FC<CommentSectionProps> = ({ storyId, commentCount = 0 }) => {
    const comments = useSelector((state: RootState) => state.comments.comments)
    const loading = useSelector((state: RootState) => state.comments.loading)
    const error = useSelector((state: RootState) => state.comments.error)
    const visibleComments = useSelector((state: RootState) => state.comments.visibleComments)

    const dispatch = useDispatch<AppDispatch>()

    // track if comments have been loaded
    const commentsLoadedRef = useRef(false)

    const base_url = "https://hacker-news.firebaseio.com/v0"

    const loadMoreComments = useCallback(() => {
        // don't't load more if we're already loading or all comments are visible
        if (!loading && visibleComments < comments.length) {
            dispatch(increaseVisibleComments(10))
        }
    }, [dispatch, loading, visibleComments, comments.length])

    useInfiniteScroll(loadMoreComments, {
        // only enable infinite scrolling when there are more comments to load
        disabled: visibleComments >= comments.length || loading,
        threshold: 300 // load more when within 300px of bottom
    })

    useEffect(() => {
        // Reset state when storyId changes
        if (storyId) {
            dispatch(setLoading(true))
            dispatch(setError(null))
            dispatch(resetCommentState())
            commentsLoadedRef.current = false
        }
    }, [storyId, dispatch])

    useEffect(() => {
        // skip if we've already loaded comments or if storyId is invalid
        if (commentsLoadedRef.current || !storyId) {
            return
        }

    const controller = new AbortController()
    const signal = controller.signal

    const loadComments = async () => {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))


            // fetch the story to get comment IDs
            const storyResponse = await axios.get(`${base_url}/item/${storyId}.json`, { signal })
            const story = storyResponse.data

            if (!story || !story.kids || story.kids.length === 0) {
                dispatch(setComments([]))
                dispatch(setLoading(false))
                commentsLoadedRef.current = true
                return
            }

            const topLevelCommentIds = story.kids.slice(0, 50)

            const commentPromises = topLevelCommentIds.map(async (id: number) => {
                try {
                    const response = await axios.get(`${base_url}/item/${id}.json`, { signal })
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
            dispatch(setComments(topLevelComments))
            commentsLoadedRef.current = true
        }
        } catch (err) {
            if (axios.isCancel(err)) {
                // request was cancelled, ignore
                return
            }
            console.error("Error loading comments:", err)
            dispatch(setError("Failed to load comments. Please try again later."))
        } finally {
            if (!signal.aborted) {
                dispatch(setLoading(false))
            }
        }
    }

    loadComments()

    // cleanup function to abort any in-flight requests when the component unmounts
    return () => {
        controller.abort()
    }
}, [storyId, dispatch]) // only re-run if storyId changes

    if (loading && comments.length === 0) {
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

            {loading && comments.length > 0 && (
                <div className="mt-4 py-4 flex justify-center">
                    <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 bg-muted-foreground/30 rounded-full animate-pulse"></div>
                        <div className="h-4 w-4 bg-muted-foreground/30 rounded-full animate-pulse delay-150"></div>
                        <div className="h-4 w-4 bg-muted-foreground/30 rounded-full animate-pulse delay-300"></div>
                        <span className="text-sm text-muted-foreground ml-2">Loading more comments...</span>
                    </div>
                </div>
            )}

            {visibleComments < comments.length && !loading && (
                <button 
                    onClick={loadMoreComments}
                    className="mt-4 w-full py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors"
                >
                    Load more comments
                </button>
            )}

            {visibleComments >= comments.length && comments.length > 0 && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                    All {commentCount} comments loaded
                </div>
            )}            
        </div>
    )
}

export default CommentSection

