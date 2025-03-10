import React, { useMemo } from 'react'
import {Comment as CommentType} from '../lib/api'
import { cn } from '../lib/utils'
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { useDispatch, useSelector } from "react-redux"
import { RootState } from '../redux/store'
import { createSelector } from '@reduxjs/toolkit';
import { toggleCommentExpansion } from '../redux/commentsSlice';

interface CommentProps {
    comment: CommentType;
    depth?: number
}

const selectExpandedComments = (state: RootState) => state.comments.expandedComments

const Comment: React.FC<CommentProps> = ({comment, depth = 0}) => {
    const dispatch = useDispatch()

    const selectThisCommentExpanded = useMemo(
        () => createSelector(
            [selectExpandedComments],
            (expandedComments) => expandedComments[comment.id] !== false // default to expanded if not set
        ),
        [comment.id] // only recreate when comment.id changes
    )

    const expanded = useSelector(selectThisCommentExpanded)

    const formatDate = (timestamp: number) => {
        const now = new Date()
        const commentDate = new Date(timestamp * 1000)

        // if less than 24 hours, show relative time
        const diffMs = now.getTime() - commentDate.getTime()
        const diffHrs = diffMs / (1000 * 60 * 60)

        if (diffHrs < 24) {
            if (diffHrs < 1) {
                const diffMins = Math.floor(diffMs / (1000 * 60))
                return `${diffMins}m`
            }
            return `${Math.floor(diffHrs)}h`
        }

        const diffDays = Math.floor(diffHrs / 24)
        if (diffDays < 30) {
            return `${diffDays}d`
        }

        const diffMonths = Math.floor(diffDays / 30)
        if (diffMonths < 12) {
            return `${diffMonths}mo`
        }

        return commentDate.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    }

    // render html safely
    const createMarkup = (html: string) => {
        return {__html: html}
    }

    const toggleExpanded = () => {
        dispatch(toggleCommentExpansion(comment.id))
    }

    const maxIndent = 5
    const indentLevel = depth > maxIndent ? maxIndent : depth

    // calculate indentation padding based on depth
    const getIndentClass = (level: number) => {
        const indentClasses = [
        "ml-0", // level 0
        "ml-4", // level 1
        "ml-8", // level 2
        "ml-12", // level 3
        "ml-16", // level 4
        "ml-20", // level 5
        ]
        return indentClasses[level] || indentClasses[maxIndent]
    }

    // color for the comment thread line based on depth
    const getThreadLineColor = (level: number) => {
        const colors = [
        "border-primary/70", // level 0
        "border-primary/70", // level 1
        "border-primary/70", // level 2
        "border-primary/70", // level 3
        "border-primary/70", // level 4
        "border-primary/70", // level 5
        ]
        return colors[level % colors.length]
    }

    const getReplyCount = (comment: CommentType): number => {
        if (!comment.replies || comment.replies.length === 0) return 0

        let count = comment.replies.length
        for (const reply of comment.replies) {
        count += getReplyCount(reply)
        }
        return count
    }

    const replyCount = getReplyCount(comment)

    // deleted or empty comments
    if (comment.deleted || (!comment.text && !comment.by)) {
        return (
        <div className={cn("relative group transition-all duration-200", getIndentClass(indentLevel))}>
            <div className={cn("border-l-2 pl-5 py-3", "border-muted")}>
                <div className="text-sm italic text-muted-foreground">[comment deleted]</div>
            </div>
        </div>
        )
    }


    return (
        <div className={cn("relative group", getIndentClass(indentLevel))}>
            <div className={cn("border-l pl-6 py-2", getThreadLineColor(indentLevel), !expanded && "opacity-75")}>
                {/* comment header */}
                <div className="flex items-center gap-x-2 text-sm mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />

                    <Link
                        href={`/user/${comment.by}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {comment.by}
                    </Link>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(comment.time)}</span>
                    </div>

                    {!expanded && replyCount > 0 && (
                        <button onClick={toggleExpanded} className="text-xs text-muted-foreground hover:underline ml-1">
                        ({replyCount} more {replyCount === 1 ? "reply" : "replies"})
                        </button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 ml-auto text-xs text-muted-foreground"
                        onClick={toggleExpanded}
                        aria-expanded={expanded}
                        aria-label={expanded ? "Collapse comment" : "Expand comment"}
                    >
                        {expanded ? <ChevronUp className="h-3.5 w-3.5 mr-1" /> : <ChevronDown className="h-3.5 w-3.5 mr-1" />}
                        {expanded ? "Collapse" : "Expand"}
                    </Button>
                </div>
                
                {/* comment content */}
                {expanded ? (
                    <div
                        className="text-[15px] leading-relaxed text-foreground/90  prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-a:text-primary"
                        dangerouslySetInnerHTML={comment.text ? createMarkup(comment.text) : { __html: "<em>No content</em>" }}
                    />
                        ) : (
                        <div className="text-sm text-muted-foreground italic">
                            {comment.text ? (
                            <div className="line-clamp-1">{comment.text.replace(/<[^>]*>/g, "")}</div>
                            ) : (
                            <span>No content</span>
                            )}
                    </div>
                )}

                
                {/* nested replies */}
                {expanded && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 space-y-3">
                        {comment.replies.map((reply) => (
                        <Comment key={reply.id} comment={reply} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Comment