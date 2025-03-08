"use client"

import React, {useEffect, useState} from 'react'
import HackerNewsAPI, {Story} from '../lib/api'
import StoryList from '../components/StoryList'
import { useLocalStorage } from '../lib/localStorage'

export default function StarredPage() {
    // state to store story data
    const [starredStories, setStarredStories] = useState<Story[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    // load read/starred states from local storage
    const [readStoryIds] = useLocalStorage<number[]>('readStories', [])
    const [starredStoryIds, setStarredStoryIds] = useLocalStorage<number[]>('starredStories', [])
    const [hiddenStories, setHiddenStories] = useLocalStorage<number[]>('hiddenStories', [])


    // get starred stories on component mount and when starred story id changes
    useEffect(() => {
        fetchStarredStories()
      }, [])

    // get all starred stories
    const fetchStarredStories = async () => {
        if (starredStoryIds.length === 0) {
            setStarredStories([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)

            // get each starred story 
            const storiesPromises = starredStoryIds.map(id => HackerNewsAPI.getStory(id))
            const fetchedStories = await Promise.all(storiesPromises)

            // remove null stories and mark as read/starred
            const validStories = fetchedStories.filter(story => story !== null) as Story[]

            // mark stories as read or starred according to local storage
            const processedStories = validStories.map(story => ({
                ...story,
                isRead: readStoryIds.includes(story.id),
                isStarred: true 
            }))

            setStarredStories(processedStories)
        } catch (error) {
            setError('Failed to fetch starred stories. Please try again later.')
            console.error('Error fetching starred stories:', error)
        } finally {
            setLoading(false)
        }
    }

    // marking story as read
    const handleReadStory = (storyId: number) => {
        // update the story in state
        setStarredStories(prevStories => 
          prevStories.map(story => 
            story.id === storyId ? { ...story, isRead: true } : story
          )
        )
        
        // Update localStorage
        if (!readStoryIds.includes(storyId)) {
          const newReadStories = [...readStoryIds, storyId]
          localStorage.setItem('readStories', JSON.stringify(newReadStories))
        }
    }

    // starring or unstarring a story
    const handleToggleStar = (storyId: number) => {
        // remove from starred stories
        setStarredStoryIds(starredStoryIds.filter(id => id !== storyId))
        
        // remove from the displayed list
        setStarredStories(prevStories => 
          prevStories.filter(story => story.id !== storyId)
        )
    }

    // hide story
    const handleHideStory = (storyId: number) => {
        // remove from current displayed stories
        setStarredStories(prevStories => 
            prevStories.filter(story => story.id !== storyId)
        )
        
        // add to hidden stories in local storage
        setHiddenStories([...hiddenStories, storyId])
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Starred Stories</h2>
            
            {/* show error message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            
            {/* display stories */}
            {!loading && starredStories.length === 0 ? (
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <p className="text-gray-600 dark:text-gray-400">
                        No starred stories yet. Click the star icon on stories to save them here.
                    </p>
                </div>
            ) : (
                <StoryList 
                    stories={starredStories} 
                    onReadStory={handleReadStory}
                    onToggleStar={handleToggleStar}
                    onHideStory={handleHideStory}
                />
            )}
            
            {/* loading indicator */}
            {loading && (
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            )}
        </div>
    )
}