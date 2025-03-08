import React from "react"
import {Story} from '../lib/api'
import StoryItem from "./StoryItem"

interface StoryListProps {
    stories: Story[]
    onReadStory: (storyId: number) => void
    onToggleStar: (storyId: number) => void
    onHideStory: (storyId: number) => void
}

// render list of stories
const StoryList: React.FC<StoryListProps> = ({
    stories, 
    onReadStory,
    onToggleStar,
    onHideStory,
}) => {
    // no stories
    if (stories.length === 0) {
        return (
            <div className="text-center p-8 text-gray-600 dark:text-gray-400">
                No stories to display.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {stories.map(story => (
                <StoryItem 
                key={story.id} 
                story={story} 
                onReadStory={onReadStory}
                onToggleStar={onToggleStar}
                onHideStory={onHideStory}
                />
            ))}
        </div>
    )
}

export default StoryList