"use client"

import React, { useEffect, useState } from 'react'
import HackerNewsAPI, { User, Story } from '../../lib/api'
import StoryList from '../../components/StoryList'
import { useLocalStorage } from '../../lib/localStorage'
import { useParams } from 'next/navigation';

interface UserPage   {
    params: {
        id: string;
    }
}

export default function UserPage() {
    // get username from route params
    const params = useParams(); 
    const username = params?.id as string; // unwrap params safely
    
    // state for user profile
    const [user, setUser] = useState<User | null>(null)
    const [userStories, setUserStories] = useState<Story[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    
    // local storage for read/starred states
    const [readStories, setReadStories] = useLocalStorage<number[]>('readStories', [])
    const [starredStories, setStarredStories] = useLocalStorage<number[]>('starredStories', [])
    const [hiddenStories, setHiddenStories] = useLocalStorage<number[]>('hiddenStories', [])

    // add ref to track initial load
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);
    
    // get user data and submissions
    useEffect(() => {
        if (!username) return

        const fetchUserData = async () => {
            setLoading(true)
            setError(null)
            
            try {
                // get user profile
                const userData = await HackerNewsAPI.getUser(username)
                if (!userData) {
                    setError(`User ${username} not found`)
                    setLoading(false)
                    return;
                }
                
                setUser(userData);
                
                // get user submissions; limit to recent 30
                if (userData.submitted && userData.submitted.length > 0) {
                    const storyIds = userData.submitted.slice(0, 30)
                    const stories = await HackerNewsAPI.getStoriesByIds(storyIds)
                    
                    // filter out comments 
                    const userStories = stories.filter(item => item.title)

                    // filter out hidden stories
                    const visibleStories = userStories.filter(story => !hiddenStories.includes(story.id))
                    
                    // add read/starred status to stories
                    const storiesWithStatus = visibleStories.map(story => ({
                        ...story,
                        isRead: readStories.includes(story.id),
                        isStarred: starredStories.includes(story.id),
                    }))
                    
                    setUserStories(storiesWithStatus)
                    setInitialDataLoaded(true)
                }
            } catch (error) {
                console.error("Error fetching user data:", error)
                setError("Failed to load user data. Please try again later.")
            } finally {
                setLoading(false)
            }
        }
        
        fetchUserData();
    }, [username, readStories, starredStories])
    
    // marks story as read
    const handleReadStory = (storyId: number) => {
        // update story in state
        setUserStories(prevStories =>
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
        setUserStories(prevStories => 
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
        setUserStories(prevStories => 
            prevStories.filter(story => story.id !== storyId)
        )

        // update local storage
        if (!hiddenStories.includes(storyId)) {
            setHiddenStories([...hiddenStories, storyId]);
        }
    };

    // format timestamp to readable date
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
        })
    }
  
    // calculate account age
    const calculateAccountAge = (timestamp: number) => {
        const now = new Date()
        const created = new Date(timestamp * 1000)
        const diffTime = Math.abs(now.getTime() - created.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const years = Math.floor(diffDays / 365)
        const months = Math.floor((diffDays % 365) / 30)
        
        if (years > 0) {
            return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? `, ${months} month${months !== 1 ? 's' : ''}` : ''}`
        }
        return `${months} month${months !== 1 ? 's' : ''}`
    }
  
    // render HTML in about section safely
    const createMarkup = (html: string) => {
        return {__html: html}
    }
  
    return (
        <div className="space-y-6">
            {/* page header */}
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                User Profile: {username}
            </h2>
            
            {/* error message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            
            {/* loading state */}
            {loading && !initialDataLoaded ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <>
                {/* user profile card */}
                {user && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user.id}</h3>
                            <div className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100 rounded-full text-sm">
                                {user.karma} karma
                            </div>
                        </div>
                            
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>Account created: {formatDate(user.created)} ({calculateAccountAge(user.created)} ago)</p>
                            <p>Submissions: {user.submitted?.length || 0}</p>
                        </div>
                            
                        {user.about && (
                            <div className="mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">About</h4>
                                <div 
                                className="text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={createMarkup(user.about)}
                                />
                            </div>
                            )}
                        </div>
                    </div>
                )}
                    
                {/* user submissions */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Submissions
                    </h3>
                    
                    {userStories.length > 0 ? (
                        <StoryList 
                            stories={userStories} 
                            onReadStory={handleReadStory}
                            onToggleStar={handleToggleStar}
                            onHideStory={handleHideStory}
                        />
                        ) : (
                        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                            No stories found from this user.
                        </div>
                    )}
                </div>
            </>
        )}
    </div>
)}