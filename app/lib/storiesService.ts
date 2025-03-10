"use client"

import HackerNewsAPI from "./api"
import store from '../redux/store'
import { setStories, setLoading, setError, setHasMore, setPage } from '../redux/storiesSlice'
import { Story } from "./api"

export const storiesService = {
    fetchStoryIdsByType: async (type: string, starredStories: number[]) => {
        console.log(`Fetching story IDs for tab: ${type}`)

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
                    ids = starredStories
                    break
                default:
                    ids = await HackerNewsAPI.getTopStoryIds()
            }
    
            console.log(`Fetched ${ids.length} story IDs for ${type}`)
            return ids
        } catch (error) {
            console.error("Error fetching stories:", error)
            throw error
        }
    },

    fetchStories: async () => {
        const state = store.getState().stories
        const { 
            loading, 
            hasMore, 
            storyIds, 
            page, 
            readStories, 
            starredStories, 
            activeTab, 
            stories 
        } = state
        const dispatch = store.dispatch
        const items_per_page = 30

        if (loading || !hasMore) {
            console.log("Skipping fetch due to:", {loading, hasMore})
            return   
        }

        console.log(`Fetching stories for page ${page}`)
        dispatch(setLoading(true))
        dispatch(setError(null))

        try {
            const start = (page - 1) * items_per_page
            const end = start + items_per_page

            // Check if there are more stories to load
            if (start >= storyIds.length) {
                dispatch(setHasMore(false))
                return
            }

            // Get visible story IDs (not hidden)
            const hiddenStories = state.hiddenStories
            const visibleStoryIds = storyIds.filter((id: number) => !hiddenStories.includes(id))
            
            const currentPageIds = visibleStoryIds.slice(start, end)
            console.log(`Fetching ${currentPageIds.length} stories`)

            if (currentPageIds.length === 0) {
                dispatch(setHasMore(false))
                dispatch(setLoading(false))
                return
            }

            const fetchedStories = await HackerNewsAPI.getStoriesByIds(currentPageIds)
            console.log(`Successfully fetched ${fetchedStories.length} stories`)

            const existingIds = new Set(stories.map((story: Story) => story.id))

            let newStories = fetchedStories
                .filter((story: Story) => !existingIds.has(story.id))
                .map((story: Story) => ({
                    ...story,
                    isRead: readStories.includes(story.id),
                    isStarred: starredStories.includes(story.id),
                }))
        
            if (activeTab === "starred") {
                newStories = newStories.filter((story: Story) => starredStories.includes(story.id))
            }
        
            dispatch(setStories([...stories, ...newStories]))
            dispatch(setPage(page + 1))

            const hasMoreStories = end < visibleStoryIds.length
            dispatch(setHasMore(hasMoreStories))
            console.log(`Has more stories: ${hasMoreStories}`)
        } catch (error) {
            dispatch(setError("Failed to fetch stories. Please try again later."))
            console.error("Error fetching stories:", error)
        } finally {
            dispatch(setLoading(false))
        }
    }
}

export default storiesService