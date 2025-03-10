import React from 'react'
import type {Story} from '../lib/api'
import Link from 'next/link'
import { CalendarDays, ExternalLink, MessageSquare, EyeOff, User } from "lucide-react"
import { cn } from "../lib/utils"

interface StoryItemProps {
    story: Story;
    onReadStory: (storyId: number) => void
    onToggleStar: (storyId: number) => void
    onHideStory: (storyId: number) => void
}

// render one single story
const StoryItem: React.FC<StoryItemProps> = ({
    story,
    onReadStory,
    onToggleStar,
    onHideStory
}) => {
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatUrl = (url?: string) => {
        if (!url) return 'self'
        try {
            const urlObj = new URL(url)
            return urlObj.hostname.replace('www.', '')
        } catch (error) {
            console.error("Error getting URL: ", error)
            return 'link'
        }
    }

    const handleClick = () => {
        onReadStory(story.id)

        // open story url in new tab
        if (story.url) {
            window.open(story.url, '_blank')
        }
    }

    const handleStarClick = (e: React.MouseEvent) => {
        // prevent click from bubbling up to parent, opening story
        e.stopPropagation()

        onToggleStar(story.id)
    }

    const handleHideStory = (e: React.MouseEvent) => {
        // prevent click from bubbling up to parent, opening story
        e.stopPropagation()

        onHideStory(story.id)
    }

    // prevent propagation when clicking on user or comments links
    const handleInternalLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div 
            className={cn(
                "group p-5 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md",
                story.isRead
                ? "bg-secondary/40 border-muted" // change stories that are read
                : "bg-card border-l-4 border-l-primary border-y-border border-r-border hover:border-l-primary/80", //highlighted left border for unread stories
            )}
            onClick={handleClick}
        >
            <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                    <div className = 'flex items-start justify-between gap-2'>
                        <h3 className={cn("text-lg font-medium leading-tight",story.isRead ? "text-muted-foreground" : "text-foreground",)}>
                            {story.title}
                        </h3>

                        {/* star button */}
                        <button
                            onClick={handleStarClick}
                            className={cn(
                                "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                                story.isStarred
                                ? "text-yellow-500 hover:text-yellow-600" // highlight yellow if starred
                                : "text-muted-foreground hover:text-yellow-500",
                            )}
                            aria-label={story.isStarred ? "Unstar this story" : "Star this story"}
                        >
                            {/* star icon */}
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
                        </button>
                    </div>

                    {/* story metadata */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        {story.url && (
                            <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs font-medium">
                                <ExternalLink className="h-3 w-3" />
                                <span>{formatUrl(story.url)}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1">
                            <span className="font-medium text-primary">{story.score}</span>
                            <span>points</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <Link
                                href={`/user/${story.by}`}
                                className="hover:text-primary hover:underline transition-colors"
                                onClick={handleInternalLinkClick}
                            >
                                {story.by}
                            </Link>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formatDate(story.time)}</span>
                        </div>

                        {story.descendants !== undefined && (
                            <Link
                                href={`/story/${story.id}`}
                                className="flex items-center gap-1.5 hover:text-primary hover:underline transition-colors"
                                onClick={handleInternalLinkClick}
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>
                                {story.descendants} {story.descendants === 1 ? "comment" : "comments"}
                                </span>
                            </Link>
                        )}

                        <button
                            onClick={handleHideStory}
                            className="flex items-center gap-1.5 hover:text-primary hover:underline transition-colors"
                            aria-label="Hide this story"
                            >
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>hide</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StoryItem