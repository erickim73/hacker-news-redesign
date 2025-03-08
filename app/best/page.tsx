'use client'

import React, { useEffect, useState } from 'react'
import HackerNewsAPI, { Story } from '../lib/api'
import StoryList from '../components/StoryList'
import { useLocalStorage } from '../lib/localStorage'

export default function NewStoriesPage() {
    // state to store story data
    const [stories, setStories] = useState<Story[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState<number>(1)
    const [hasMore, setHasMore] = useState<boolean>(true)
    
    // load read/starred states from local storage
    const [readStories, setReadStories] = useLocalStorage<number[]>('readStories', [])
    const [starredStories, setStarredStories] = useLocalStorage<number[]>('starredStories', [])
    
    const items_per_page = 30

    // get stories on component mount
    useEffect(() => {
        fetchStories()
    }, [])

    // get stories with pages
    const fetchStories = async () => {
        try {
        setLoading(true)
        
        // get all story ids
        const storyIds = await HackerNewsAPI.getNewStoryIds()
        
        // calculate start and end indices for pages
        const start = (page - 1) * items_per_page
        const end = start + items_per_page
        
        // check if there are more stories to load
        setHasMore(end < storyIds.length)
        
        // get stories for current page
        const fetchedStories = await HackerNewsAPI.getStoriesByIds(storyIds, start, end)
        
            // mark stories as read or starred according to local storage
            const processedStories = fetchedStories.map(story => ({
                ...story,
                isRead: readStories.includes(story.id),
                isStarred: starredStories.includes(story.id)
            }))
        
        setStories(prevStories => [...prevStories, ...processedStories])
        setPage(prevPage => prevPage + 1)

        } catch (err) {
        setError('Failed to fetch new stories. Please try again later.')
        console.error('Error fetching new stories:', err)

        } finally {
        setLoading(false)
        }
    }
    
    // mark story as read
    const handleReadStory = (storyId: number) => {
        // update story in state
        setStories(prevStories => 
            prevStories.map(story => 
                story.id === storyId ? { ...story, isRead: true } : story
            )
        )
        
        // update localStorage
        if (!readStories.includes(storyId)) {
            setReadStories([...readStories, storyId])
        }
    }
    
    // starring/unstarring a story
    const handleToggleStar = (storyId: number) => {
        // check if the story is already starred
        const isCurrentlyStarred = starredStories.includes(storyId)
        
        // update story in state
        setStories(prevStories => 
            prevStories.map(story => 
                story.id === storyId 
                ? { ...story, isStarred: !isCurrentlyStarred } 
                : story
            )
        )
        
        // update localStorage
        if (isCurrentlyStarred) {
            // remove from starred stories
            setStarredStories(starredStories.filter(id => id !== storyId))
        } else {
            // add to starred stories
            setStarredStories([...starredStories, storyId])
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Best Stories</h2>
            
            {/* show error message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            
            {/* display stories */}
            <StoryList 
                stories={stories} 
                onReadStory={handleReadStory}
                onToggleStar={handleToggleStar}
            />
            
            {/* loading indicator */}
            {loading && (
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            )}
            
            {/* show more button */}
            {!loading && hasMore && (
                <div className="flex justify-center">
                    <button
                        onClick={fetchStories}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                    >
                        Show More
                    </button>
                </div>
            )}
            
            {/* no more stories message */}
            {!loading && !hasMore && stories.length > 0 && (
                <div className="text-center text-gray-600 dark:text-gray-400">
                    No more stories to load.
                </div>
            )}
        </div>
    )
}