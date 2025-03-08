"use client"

import React, {useEffect, useState, useCallback} from 'react'
import HackerNewsAPI, {Story} from './lib/api'
import StoryList from './components/StoryList'
import { useLocalStorage } from './lib/localStorage'
import { useInfiniteScroll } from './lib/useInfiniteScroll'

export default function HomePage() {
    // state to store story data
    const [stories, setStories] = useState<Story[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState<number>(1)
    const [hasMore, setHasMore] = useState<boolean>(true)
    const [storyIds, setStoryIds] = useState<number[]>([]) 

    // load read/starred states from local storage
    const [readStories, setReadStories] = useLocalStorage<number[]>('readStories', [])
    const [starredStories, setStarredStories] = useLocalStorage<number[]>('starredStories', [])
    const [hiddenStories, setHiddenStories] = useLocalStorage<number[]>('hiddenStories', [])

    const items_per_page = 30

    // get stories on component mount
    useEffect(() => {
        const fetchStoryIds = async () => {
            try {
                const ids = await HackerNewsAPI.getTopStoryIds()
                setStoryIds(ids)
                setHasMore(ids.length > 0)
            } catch (error) {
                setError("Failed to load stories.")
                console.error("Error fetching stories:", error)
            }
        }
        fetchStoryIds()
    }, [])

    // function to fetch stories with pages
    const fetchStories = useCallback(async () => {
        // skip fetching if already loading or no more stories
        if (loading || !hasMore || storyIds.length === 0) return
        
        setLoading(true)
        setError(null)

        try {
            // calculate start and end indices for pages
            const start = (page - 1) * items_per_page
            const end = start + items_per_page

            // check if there are more stories to load
            if (start >= storyIds.length) {
                setHasMore(false)
                return
            }

            // get stories for current page
            const currentPageIds = storyIds.slice(start, end)
            const fetchedStories = await HackerNewsAPI.getStoriesByIds(currentPageIds)

            // use functional update to avoid stale state
            setStories(prevStories => {
                const existingIds = new Set(prevStories.map(story => story.id))
                const newStories = fetchedStories
                    .filter(story => !existingIds.has(story.id))
                    .filter(story => !hiddenStories.includes(story.id))
                    .map(story => ({
                        ...story,
                        isRead: readStories.includes(story.id),
                        isStarred: starredStories.includes(story.id),
                    }))
                return [...prevStories, ...newStories]
            })

            setPage(prevPage => prevPage + 1)
            setHasMore(end < storyIds.length)

        } catch (error) {
            setError("Failed to fetch stories. Please try again later.")
            console.error("Error fetching stories:", error)
        } finally {
            setLoading(false)
        }
    }, [page, loading, hasMore, storyIds, readStories, starredStories, hiddenStories])

    // trigger initial fetch after storyIds are loaded
    useEffect(() => {
        if (storyIds.length > 0) {
            fetchStories()
        }
    }, [storyIds, fetchStories]) // fetch when storyIds change

    useEffect(() => {
        if (hiddenStories.length > 0) {
            setStories(prevStories => 
                prevStories.filter(story => !hiddenStories.includes(story.id))
            )
        }
    }, [hiddenStories])

    // use infinite scroll hook
    useInfiniteScroll(fetchStories, {
        threshold: 300,
        disabled: loading || !hasMore,
    })

    // marks story as read
    const handleReadStory = (storyId: number) => {
        // update story in state
        setStories(prevStories =>
            prevStories.map(story => 
                story.id === storyId ? {...story, isRead: true} : story
            )
        )

        // update local storage
        if (!readStories.includes(storyId)) {
            setReadStories([...readStories, storyId])
        }
    }

    // star or unstar story
    const handleToggleStar = (storyId: number) => {
        // check if story is already starred
        const isCurrentlyStarred = starredStories.includes(storyId)

        // update story in state
        setStories(prevStories => 
            prevStories.map(story => 
                story.id === storyId
                    ? {...story, isStarred: !isCurrentlyStarred} : story
            )
        )
        // update local storage
        if (isCurrentlyStarred) {
            // remove from starred stories
            setStarredStories(starredStories.filter(id => id !== storyId))
        } else {
            // add to starred stories
        setStarredStories([...starredStories, storyId])
        }
    }

    // hide story
    const handleHideStory = (storyId: number) => {
        // Remove from current displayed stories
        setStories(prevStories => 
            prevStories.filter(story => story.id !== storyId)
        )
        
        // add to hidden stories in local storage
        setHiddenStories([...hiddenStories, storyId])
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Top Stories</h2>
            
            {/* show error message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            
            {/* show stories */}
            <StoryList 
                stories={stories} 
                onReadStory={handleReadStory}
                onToggleStar={handleToggleStar}
                onHideStory={handleHideStory}
            />
            
            {/* loading indicator */}
            {(loading ) && (
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
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