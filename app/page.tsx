"use client"

import React, {useEffect, useState, useCallback} from 'react'
import HackerNewsAPI, {Story} from './lib/api'
import StoryList from './components/StoryList'
import { useLocalStorage } from './lib/localStorage'
import { useInfiniteScroll } from './lib/useInfiniteScroll'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bookmark, TrendingUp, Zap } from "lucide-react"

export default function HomePage() {
    // state to store story data
    const [stories, setStories] = useState<Story[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState<number>(1)
    const [hasMore, setHasMore] = useState<boolean>(true)
    const [storyIds, setStoryIds] = useState<number[]>([]) 
    const [activeTab, setActiveTab] = useState("top")

    // load read/starred states from local storage
    const [readStories, setReadStories] = useLocalStorage<number[]>('readStories', [])
    const [starredStories, setStarredStories] = useLocalStorage<number[]>('starredStories', [])
    const [hiddenStories, setHiddenStories] = useLocalStorage<number[]>('hiddenStories', [])

    const items_per_page = 30

    // helper function to fetch story ids based on active tab
    const fetchStoryIdsByType = useCallback(async (type: string) => {
        try {
            let ids: number[] = []
        
            switch (type) {
                case "top":
                    ids = await HackerNewsAPI.getTopStoryIds()
                    break
                case "new":
                    ids = await HackerNewsAPI.getNewStoryIds()
                    break
                case "best":
                    ids = await HackerNewsAPI.getBestStoryIds()
                    break
                case "starred":
                    ids = await HackerNewsAPI.getTopStoryIds()
                    break
                default:
                    ids = await HackerNewsAPI.getTopStoryIds()
            }
    
            setStoryIds(ids)
            setHasMore(ids.length > 0)
            setPage(1) // reset page counter
            setStories([]) // Clear current stories
        } catch (error) {
            setError("Failed to load stories.")
            console.error("Error fetching stories:", error)
        }
    }, [])

    // handle tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value)
        fetchStoryIdsByType(value)
    }

    // get stories on component mount and when tab changes
    useEffect(() => {
        fetchStoryIdsByType(activeTab)
      }, [activeTab, fetchStoryIdsByType])

    
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
            setStories((prevStories) => {
                const existingIds = new Set(prevStories.map((story) => story.id))
        
                // filter and enrich stories
                let newStories = fetchedStories
                  .filter((story) => !existingIds.has(story.id))
                  .filter((story) => !hiddenStories.includes(story.id))
                  .map((story) => ({
                    ...story,
                    isRead: readStories.includes(story.id),
                    isStarred: starredStories.includes(story.id),
                  }))
        
                // if on starred tab, only show starred stories
                if (activeTab === "starred") {
                  newStories = newStories.filter((story) => starredStories.includes(story.id))
                }
        
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
    }, [page, loading, hasMore, storyIds, readStories, starredStories, hiddenStories, activeTab])

    // trigger initial fetch after storyIds are loaded
    useEffect(() => {
        if (storyIds.length > 0) {
            fetchStories()
        }
    }, [storyIds, fetchStories]) // fetch when storyIds change

    // filter out hidden stories
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

        // if on the starred tab and unstarring, remove it from view
        if (activeTab === "starred" && isCurrentlyStarred) {
            setStories((prevStories) => prevStories.filter((story) => story.id !== storyId))
        }
    }

    // hide story
    const handleHideStory = (storyId: number) => {
        // remove from current displayed stories
        setStories(prevStories => 
            prevStories.filter(story => story.id !== storyId)
        )
        
        // add to hidden stories in local storage
        setHiddenStories([...hiddenStories, storyId])
    }

    // load more stories manually (alternative to infinite scroll)
    const handleLoadMore = () => {
        fetchStories()
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {/* tabs for different types of stories */}
            <Tabs defaultValue="top" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    {/* top stories */}
                    <TabsTrigger value="top" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Top Stories</span>
                    </TabsTrigger>

                    {/* new stories */}
                    <TabsTrigger value="new" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>New Stories</span>
                    </TabsTrigger>

                    {/* best stories */}
                    <TabsTrigger value="best" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>Best Stories</span>
                    </TabsTrigger>

                    {/* starred stories */}
                    <TabsTrigger value="starred" className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4" />
                        <span>Starred</span>
                    </TabsTrigger>
                </TabsList>

                {/* content for top stories tab */}
                <TabsContent value="top" className="space-y-6">
                    {/* show error message */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
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
                    {loading && (
                        <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}

                    {/* no more stories message */}
                    {!loading && !hasMore && stories.length > 0 && (
                        <div className="text-center text-muted-foreground py-4">No more stories to load.</div>
                    )}

                    {/* manual load more button */}
                    {!loading && hasMore && (
                        <div className="flex justify-center py-4">
                        <Button onClick={handleLoadMore} variant="outline" className="w-1/3">
                            Load More
                        </Button>
                        </div>
                    )}
                </TabsContent>

                {/* duplicate content structure for New Stories tab */}
                <TabsContent value="new" className="space-y-6">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
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
                    {loading && (
                        <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}

                    {/* no more stories message */}
                    {!loading && !hasMore && stories.length > 0 && (
                        <div className="text-center text-muted-foreground py-4">No more stories to load.</div>
                    )}

                    {/* manual load more button */}
                    {!loading && hasMore && (
                        <div className="flex justify-center py-4">
                            <Button onClick={handleLoadMore} variant="outline" className="w-1/3">
                                Load More
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* duplicate content structure for Best Stories tab */}
                <TabsContent value="best" className="space-y-6">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
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
                    {loading && (
                        <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}

                    {/* no more stories message */}
                    {!loading && !hasMore && stories.length > 0 && (
                        <div className="text-center text-muted-foreground py-4">No more stories to load.</div>
                    )}

                    {/* manual load more button */}
                    {!loading && hasMore && (
                        <div className="flex justify-center py-4">
                            <Button onClick={handleLoadMore} variant="outline" className="w-1/3">
                                Load More
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* content for starred tab */}
                <TabsContent value="starred" className="space-y-6">
                    
                    {/* placeholder text for no starred stories */}
                    {stories.length === 0 && !loading ? (
                        <div className="text-center text-muted-foreground py-12">
                        <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium mb-2">No starred stories yet</h3>
                        <p>Stories you star will appear here for easy access.</p>
                        </div>
                    ) : (
                        <>
                            {/* show stories */}
                            <StoryList
                                stories={stories}
                                onReadStory={handleReadStory}
                                onToggleStar={handleToggleStar}
                                onHideStory={handleHideStory}
                            />

                            {/* loading indicator */}
                            {loading && (
                                <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            )}

                            {/* loading message for when theres no more starred stories */}
                            {!loading && !hasMore && stories.length > 0 && (
                                <div className="text-center text-muted-foreground py-4">No more starred stories to load.</div>
                            )}

                            {/* manual load more button */}
                            {!loading && hasMore && (
                                <div className="flex justify-center py-4">
                                    <Button onClick={handleLoadMore} variant="outline" className="w-1/3">
                                        Load More
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}