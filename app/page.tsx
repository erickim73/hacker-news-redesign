"use client"

import React, {useEffect, useCallback, useMemo} from 'react'
import StoryList from './components/StoryList'
import { useInfiniteScroll } from './lib/useInfiniteScroll'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, TrendingUp, Zap } from "lucide-react"
import store from './redux/store'
import { setStories, setLoading, setError, setActiveTab, setHasMore, setPage, setStoryIds, setReadStories, setStarredStories, setHiddenStories} from './redux/storiesSlice'
import storiesService from './lib/storiesService'

type RootState = ReturnType<typeof store.getState>;

type TabValue = "top" | "new" | "best" | "starred";


export default function HomePage() {
    const dispatch = useDispatch()
    const stories = useSelector((state: RootState) => state.stories.stories)
    const loading = useSelector((state: RootState) => state.stories.loading)
    const error = useSelector((state: RootState) => state.stories.error)
    const activeTab = useSelector((state: RootState) => state.stories.activeTab)
    const hasMore = useSelector((state: RootState) => state.stories.hasMore)
    const page = useSelector((state: RootState) => state.stories.page)
    const storyIds = useSelector((state: RootState) => state.stories.storyIds)
    const readStories = useSelector((state: RootState) => state.stories.readStories)
    const starredStories = useSelector((state: RootState) => state.stories.starredStories)
    const hiddenStories = useSelector((state: RootState) => state.stories.hiddenStories)


    const fetchStoryIdsByType = useCallback(async (type: string) => {
        try {
            dispatch(setLoading(true))

            const ids = await storiesService.fetchStoryIdsByType(type, starredStories)
    
            dispatch(setStoryIds(ids))
            dispatch(setHasMore(ids.length > 0))
            dispatch(setPage(1))
            dispatch(setStories([]))
            dispatch(setLoading(false))
        } catch (error) {
            dispatch(setError("Failed to load stories."))
            console.error("Error fetching stories:", error)
            dispatch(setLoading(false))
        }
    }, [starredStories, dispatch])

    const handleTabChange = useCallback((value: string) => {
        console.log(`Tab changed to: ${value}`)
        dispatch(setActiveTab(value))
        fetchStoryIdsByType(value)
    }, [dispatch, fetchStoryIdsByType])

    // only run on initial mount
    useEffect(() => {
        console.log("Initial component mount, fetching story IDs")
        fetchStoryIdsByType(activeTab)
    }, [])

    
    const fetchStories = useCallback(async () => {
        if (loading || !hasMore) {
            console.log("Skipping fetch due to:", {loading, hasMore})
            return
        }
        
        console.log(`Fetching stories for page ${page}`)
        try {
            await storiesService.fetchStories()
        } catch (error) {
            console.error("Error in fetchStories:", error)
            dispatch(setError("Failed to load stories."))
        }
    }, [loading, hasMore, page, dispatch])

    // trigger initial fetch after storyIds are loaded
    useEffect(() => {
        if (storyIds.length > 0 && page === 1) {
            console.log("Story IDs loaded, triggering initial fetch")
            fetchStories()
        }
    }, [storyIds, page, fetchStories]) 

    // use infinite scroll hook
    const infiniteScrollConfig = useMemo(() => ({
        threshold: 300,
        disabled: loading || !hasMore,
    }), [loading, hasMore])
    
    useInfiniteScroll(fetchStories, infiniteScrollConfig)


    const handleReadStory = useCallback((storyId: number) => {
        console.log(`Marking story ${storyId} as read`)
        // update story in state
        dispatch(setStories(
            stories.map(story => 
                story.id === storyId ? {...story, isRead: true} : story
            )
        ))

        // update local storage
        if (!readStories.includes(storyId)) {
            dispatch(setReadStories([...readStories, storyId]))
        }
    }, [stories, readStories, dispatch])
    

    const handleToggleStar = useCallback((storyId: number) => {
        const isCurrentlyStarred = starredStories.includes(storyId)
        console.log(`${isCurrentlyStarred ? 'Unstarring' : 'Starring'} story ${storyId}`)

        // update story in state
        dispatch(setStories(
            stories.map(story => 
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

        if (activeTab === "starred" && isCurrentlyStarred) {
            dispatch(setStories(stories.filter((story) => story.id !== storyId)))
        }
    }, [stories, starredStories, activeTab, dispatch])

    const handleHideStory = useCallback((storyId: number) => {
        console.log(`Hiding story ${storyId}`)
        // remove from current displayed stories
        dispatch(setStories(stories.filter(story => story.id !== storyId)))
        
        // add to hidden stories in local storage
        dispatch(setHiddenStories([...hiddenStories, storyId]))
    }, [stories, hiddenStories, dispatch])

    const handleLoadMore = useCallback(() => {
        console.log("Load more button clicked")
        fetchStories()
    }, [fetchStories])

    useEffect(() => {
        console.log("Loading data from localStorage")
        try {
            const savedReadStoriesString = localStorage.getItem('readStories');
            const savedStarredStoriesString = localStorage.getItem('starredStories');
            const savedHiddenStoriesString = localStorage.getItem('hiddenStories');
            
            const savedReadStories = savedReadStoriesString ? JSON.parse(savedReadStoriesString) : [];
            const savedStarredStories = savedStarredStoriesString ? JSON.parse(savedStarredStoriesString) : [];
            const savedHiddenStories = savedHiddenStoriesString ? JSON.parse(savedHiddenStoriesString) : [];
            
            dispatch(setReadStories(savedReadStories))
            dispatch(setStarredStories(savedStarredStories))
            dispatch(setHiddenStories(savedHiddenStories))
            console.log("Successfully loaded data from localStorage")
        } catch (e) {
            console.error("Error loading data from localStorage:", e)
        }
    }, [dispatch])

    useEffect(() => {
        console.log("Updating readStories in localStorage")
        localStorage.setItem('readStories', JSON.stringify(readStories))
    }, [readStories])

    useEffect(() => {
        console.log("Updating starredStories in localStorage")
        localStorage.setItem('starredStories', JSON.stringify(starredStories))
    }, [starredStories])

    useEffect(() => {
        console.log("Updating hiddenStories in localStorage")
        localStorage.setItem('hiddenStories', JSON.stringify(hiddenStories))
    }, [hiddenStories])

    const renderTabContent = useCallback((tabValue: TabValue) => (
        <TabsContent value={tabValue} className="space-y-6">
            {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <StoryList
                stories={stories}
                onReadStory={handleReadStory}
                onToggleStar={handleToggleStar}
                onHideStory={handleHideStory}
            />

            {loading && (
                <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!loading && !hasMore && stories.length > 0 && (
                <div className="text-center text-muted-foreground py-4">No more stories to load.</div>
            )}

            {!loading && hasMore && (
                <div className="flex justify-center py-4">
                <Button onClick={handleLoadMore} variant="outline" className="w-1/3">
                    Load More
                </Button>
                </div>
            )}
        </TabsContent>
    ), [error, stories, loading, hasMore, handleLoadMore, handleReadStory, handleToggleStar, handleHideStory])

    const renderStarredTabContent = useCallback(() => (
        <TabsContent value="starred" className="space-y-6">
            {stories.length === 0 && !loading ? (
                <div className="text-center text-muted-foreground py-12">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No starred stories yet</h3>
                <p>Stories you star will appear here for easy access.</p>
                </div>
            ) : (
                <>
                    <StoryList
                        stories={stories}
                        onReadStory={handleReadStory}
                        onToggleStar={handleToggleStar}
                        onHideStory={handleHideStory}
                    />

                    {loading && (
                        <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    )}

                    {!loading && !hasMore && stories.length > 0 && (
                        <div className="text-center text-muted-foreground py-4">No more starred stories to load.</div>
                    )}

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
    ), [stories, loading, hasMore, handleLoadMore, handleReadStory, handleToggleStar, handleHideStory])


    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <Tabs defaultValue="top" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    
                    <TabsTrigger value="top" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Top Stories</span>
                    </TabsTrigger>

                    <TabsTrigger value="new" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>New Stories</span>
                    </TabsTrigger>

                    <TabsTrigger value="best" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>Best Stories</span>
                    </TabsTrigger>

                    <TabsTrigger value="starred" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        <span>Starred</span>
                    </TabsTrigger>
                </TabsList>

                {renderTabContent("top")}
                {renderTabContent("new")}
                {renderTabContent("best")}
                {renderStarredTabContent()}
            </Tabs>
        </div>
    )
}