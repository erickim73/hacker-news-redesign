import React from 'react'
import type {Story} from '../lib/api'
import Link from 'next/link';

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
    // format timestamp to easy to read format
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

    // format URL for display
    const formatUrl = (url?: string) => {
        if (!url) return 'self'
        try {
            const urlObj = new URL(url)
            return urlObj.hostname.replace('www.', '')
        } catch (error) {
            return 'link'
            console.error("Error getting URL: ", error)
        }
    }

    // handle clicking on story
    const handleClick = () => {
        onReadStory(story.id)

        // open story url in new tab
        if (story.url) {
            window.open(story.url, '_blank')
        }
    }

    // handle clicking on star
    const handleStarClick = (e: React.MouseEvent) => {
        // prevent click from bubbling up to parent, opening story
        e.stopPropagation()

        // toggle star
        onToggleStar(story.id)
    }

    // handle hiding a story
    const handleHideStory = (e: React.MouseEvent) => {
        // prevent click from bubbling up to parent, opening story
        e.stopPropagation()

        // hide
        onHideStory(story.id)
    }

    // prevent propagation when clicking on user or comments links
  const handleInternalLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

    return (
        <div 
            className={`p-4 rounded-lg shadow-md cursor-pointer transition hover:shadow-lg
                ${story.isRead ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}
                ${story.isRead ? 'border-l-4 border-gray-400' : 'border-l-4 border-orange-500'}`}
            onClick={handleClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className={`text-lg font-medium mb-1 ${story.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {story.title}
                    </h3>
                
                <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
                    {/* show domain if url exists */}
                    {story.url && (
                        <span className="inline-block">
                            ({formatUrl(story.url)})
                        </span>
                    )}
                    <span>{story.score} points</span>
                    <span>by</span>
                    <Link 
                            href={`/user/${story.by}`}
                            className="hover:underline"
                            onClick={handleInternalLinkClick}
                        >
                            {story.by}
                    </Link>
                    <span>{formatDate(story.time)}</span>
                    {story.descendants !== undefined && (
                            <Link 
                                href={`/story/${story.id}`}
                                className="hover:underline"
                                onClick={handleInternalLinkClick}
                            >
                                {story.descendants} {story.descendants === 1 ? 'comment' : 'comments'}
                            </Link>
                    )}
                    <button 
                        onClick={handleHideStory}
                        className="hover:underline"
                    >
                        hide
                    </button>
                </div>
            </div>
                
                {/* star button */}
                <button 
                    onClick={handleStarClick}
                    className="ml-2 text-yellow-500 hover:text-yellow-600 focus:outline-none"
                    aria-label={story.isStarred ? "Unstar this story" : "Star this story"}
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-6 w-6" 
                        fill={story.isStarred ? "currentColor" : "none"} 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1.5} 
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                        />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default StoryItem