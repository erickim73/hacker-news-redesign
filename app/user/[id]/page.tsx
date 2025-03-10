"use client"

import { useEffect } from 'react'
import HackerNewsAPI from '../../lib/api'
import StoryList from '../../components/StoryList'
import { useParams } from 'next/navigation';
import { CalendarDays, FileText, Award, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setUserStories, setLoading, setError, setInitialDataLoaded } from '../../redux/userSlice'
import { setReadStories, setStarredStories, setHiddenStories } from '../../redux/storiesSlice'
import user from '../../redux/store'


type RootState = ReturnType<typeof user.getState>;


export default function UserPage() {
    // get username from route params
    const params = useParams(); 
    const username = params?.id as string; 

    const dispatch = useDispatch()

    const { user, userStories, loading, error, initialDataLoaded } = useSelector((state: RootState) => state.user)

    const { readStories, starredStories, hiddenStories } = useSelector((state: RootState) => state.stories)
    
    // get user data and submissions
    useEffect(() => {
        if (!username) return

        const fetchUserData = async () => {
            dispatch(setLoading(true))
            dispatch(setError(null))
            
            try {
                // get user profile
                const userData = await HackerNewsAPI.getUser(username)
                if (!userData) {
                    dispatch(setError(`User ${username} not found`))
                    dispatch(setLoading(false))
                    return;
                }
                
                dispatch(setUser(userData))
                
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
                    
                    dispatch(setUserStories(storiesWithStatus))
                    dispatch(setInitialDataLoaded(true))
                }
            } catch (error) {
                console.error("Error fetching user data:", error)
                dispatch(setError("Failed to load user data. Please try again later."))
            } finally {
                dispatch(setLoading(false))
            }
        }
        
        fetchUserData();
    }, [username, readStories, starredStories, hiddenStories, dispatch])
    
    // marks story as read
    const handleReadStory = (storyId: number) => {
        // update story in state
        dispatch(setUserStories(
            userStories.map(story => 
                story.id === storyId ? {...story, isRead: true} : story
            )
        ))
        
        // update local storage
        if (!readStories.includes(storyId)) {
            dispatch(setReadStories([...readStories, storyId]))
        }
    }
    
    // star or unstar story
    const handleToggleStar = (storyId: number) => {
        // check if story is already starred
        const isCurrentlyStarred = starredStories.includes(storyId)
        
        // update story in state
        dispatch(setUserStories(
            userStories.map(story => 
                story.id === storyId
                ? {...story, isStarred: !isCurrentlyStarred} : story
            )
        ))
        
        // update local storage
        if (isCurrentlyStarred) {
            // remove from starred stories
            dispatch(setStarredStories(starredStories.filter(id => id !== storyId)))
        } else {
            // add to starred stories
            dispatch(setStarredStories([...starredStories, storyId]))
        }
    }

    // hide story
    const handleHideStory = (storyId: number) => {
        dispatch(setUserStories(
            userStories.filter(story => story.id !== storyId)
        ))

        // update local storage
        if (!hiddenStories.includes(storyId)) {
            dispatch(setHiddenStories([...hiddenStories, storyId]))
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
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            <div>
                <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/" className="flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to stories</span>
                    </Link>
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
            </div>
            
            {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">{error}</div>
            )}
            
            {loading && !initialDataLoaded ? (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Skeleton className="h-6 w-1/4" />
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full rounded-lg" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {user && (
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <CardTitle className="text-2xl">{user.id}</CardTitle>
                                    <Badge variant="secondary" className="w-fit flex items-center gap-1.5">
                                        <Award className="h-3.5 w-3.5" />
                                        <span>{user.karma.toLocaleString()} karma</span>
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CalendarDays className="h-4 w-4" />
                                            <span>Joined {formatDate(user.created)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FileText className="h-4 w-4" />
                                            <span>{user.submitted?.length.toLocaleString() || 0} submissions</span>
                                        </div>
                                    </div>

                                    <div className="text-sm text-muted-foreground">
                                        <span className="inline-block px-2.5 py-0.5 bg-secondary rounded-md">
                                            Account age: {calculateAccountAge(user.created)}
                                        </span>
                                    </div>
                                </div>

                                {user.about && (
                                <div className="pt-4 border-t">
                                    <h2 className="text-sm font-medium mb-2">About</h2>
                                    <div
                                        className="text-sm prose dark:prose-invert max-w-none prose-p:my-2 prose-a:text-primary"
                                        dangerouslySetInnerHTML={createMarkup(user.about)}
                                    />
                                </div>
                                )}
                            </CardContent>
                        </Card>
                    )}                  

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Recent Submissions</h2>

                            {loading && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Updating...</span>
                                </div>
                            )}
                        </div>

                        {userStories.length > 0 ? (
                            <StoryList
                                stories={userStories}
                                onReadStory={handleReadStory}
                                onToggleStar={handleToggleStar}
                                onHideStory={handleHideStory}
                            />
                        ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 text-muted-foreground/50" />
                            <h3 className="text-lg font-medium mb-1">No stories found</h3>
                            <p className="text-sm max-w-md">
                                This user hasn&apos;t submitted any stories yet, or all their submissions are comments.
                            </p>
                        </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}