'use client'

import React, { useEffect, useState } from 'react'
import HackerNewsAPI, { Story, Comment as CommentType } from '../../lib/api'
import { useLocalStorage } from '../../lib/localStorage'
import Comment from '../../components/Comments'
import Link from 'next/link'

interface StoryDetailPageProps {
    params: {
        id: string
    }
}

export default function StoryDetailPage({ params }: StoryDetailPageProps) {
    const storyId = parseInt(params.id)
    
    // state for story and comments
    const [story, setStory] = useState<Story | null>(null)
    const [comments, setComments] = useState<CommentType[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    
    // load read and starred states from localStorage
    const [readStories, setReadStories] = useLocalStorage<number[]>('readStories', [])
    const [starredStories, setStarredStories] = useLocalStorage<number[]>('starredStories', [])
    
    // get  story and comments on component mount
    useEffect(() => {
        if (isNaN(storyId)) {
            setError('Invalid story ID')
            setLoading(false)
            return
        }
        
        fetchStoryAndComments()
        
        // mark as read 
        if (!readStories.includes(storyId)) {
            setReadStories([...readStories, storyId])
        }
    }, [storyId])
    
    // get story and its comments
    const fetchStoryAndComments = async () => {
        try {
            setLoading(true)
            
            // get story
            const fetchedStory = await HackerNewsAPI.getStory(storyId)
            
            if (!fetchedStory) {
                setError('Story not found')
                return
            }
        
            // add read and starred status to the story
            const processedStory = {
                ...fetchedStory,
                isRead: true, 
                isStarred: starredStories.includes(storyId)
            }
        
            setStory(processedStory)
            
            // get comments
            if (fetchedStory.kids && fetchedStory.kids.length > 0) {
                const fetchedComments = await HackerNewsAPI.getCommentsForStory(storyId)
                setComments(fetchedComments)
            }
            } catch (error) {
                setError('Failed to fetch story details. Please try again later.')
                console.error('Error fetching story details:', error)
            } finally {
                setLoading(false)
        }
    }
  
    // handler for starring or unstarring a story
    const handleToggleStar = () => {
        if (!story) return
        
        const isCurrentlyStarred = starredStories.includes(storyId)
        
        // update story in state
        setStory({
            ...story,
            isStarred: !isCurrentlyStarred
        })
        
        // update localStorage
        if (isCurrentlyStarred) {
            // remove from starred stories
            setStarredStories(starredStories.filter(id => id !== storyId))
        } else {
            // add to starred stories
            setStarredStories([...starredStories, storyId])
        }
    }
    
    // format timestamp to a readable date
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000)
        return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
        })
    }
    
    // render loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        )
    }
    
    // render error state
    if (error || !story) {
        return (
            <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
                <p className="text-gray-700 dark:text-gray-300">{error || 'Story not found'}</p>
                <Link href="/" className="mt-4 inline-block bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded">
                    Return to Home
                </Link>
            </div>
        )
    }
  
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* story header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {story.title}
                        </h1>
                        
                        {/* story link */}
                        {story.url && (
                        <Link
                            href={story.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
                        >
                            {new URL(story.url).hostname.replace('www.', '')}
                        </Link>
                        )}
                        
                        {/* story metadata */}
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 flex flex-wrap gap-2">
                            <span>{story.score} points</span>
                            <span>by {story.by}</span>
                            <span>{formatDate(story.time)}</span>
                            <span>{story.descendants} comments</span>
                        </div>
                    </div>
                
                    {/* star button */}
                    <button 
                        onClick={handleToggleStar}
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
                
                {/* story text content */}
                {story.text && (
                    <div 
                        className="mt-4 text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: story.text }}
                    />
                    )}
            </div>
            
            {/* comments section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Comments ({story.descendants || 0})
                </h2>
                
                {/* display comments */}
                {comments.length > 0 ? (
                <div className="space-y-4">
                    {comments.map(comment => (
                    <Comment key={comment.id} comment={comment} />
                    ))}
                </div>
                ) : (<p className="text-gray-600 dark:text-gray-400">No comments yet.</p>)}
            </div>
        </div>
    )
}