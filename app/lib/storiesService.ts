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

            const initialFetchLimit = 100
        
            switch (type) {
                case "top":
                    ids = await HackerNewsAPI.getTopStoryIds(initialFetchLimit)
                    break
                case "new":
                    ids = await HackerNewsAPI.getNewStoryIds(initialFetchLimit)
                    break
                case "best":
                    ids = await HackerNewsAPI.getBestStoryIds(initialFetchLimit)
                    break
                case "starred":
                    ids = starredStories
                    break
                default:
                    ids = await HackerNewsAPI.getTopStoryIds(initialFetchLimit)
            }
    
            console.log(`Fetched ${ids.length} story IDs for ${type}`)
            return ids
        } catch (error) {
            console.error("Error fetching stories:", error)
            throw error
        }
    },

    fetchMoreStoryIds: async (type: string, currentIds: number[], offset: number, limit: number) => {
        console.log(`Fetching more story IDs for tab: ${type}, offset: ${offset}, limit: ${limit}`)
        
        try {
            let newIds: number[] = []
            
            switch (type) {
                case "top":
                    newIds = await HackerNewsAPI.getTopStoryIds(limit, offset)
                    break
                case "new":
                    newIds = await HackerNewsAPI.getNewStoryIds(limit, offset)
                    break
                case "best":
                    newIds = await HackerNewsAPI.getBestStoryIds(limit, offset)
                    break
                case "starred":
                    // No need to fetch more for starred stories as they're all in local storage
                    return currentIds
                default:
                    newIds = await HackerNewsAPI.getTopStoryIds(limit, offset)
            }
            
            // Combine with existing IDs, avoiding duplicates
            const combinedIds = [...currentIds]
            newIds.forEach(id => {
                if (!combinedIds.includes(id)) {
                    combinedIds.push(id)
                }
            })
            
            console.log(`Added ${newIds.length} more story IDs for ${type}`)
            return combinedIds
        } catch (error) {
            console.error("Error fetching more story IDs:", error)
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

            // check if there are more stories to load
            if (activeTab !== "starred" && start + items_per_page >= storyIds.length) {
                // ADDED: FETCH MORE STORY IDs WHEN WE'RE CLOSE TO RUNNING OUT
                console.log("Need to fetch more story IDs")
                const moreIdsLimit = 100
                const newStoryIds = await storiesService.fetchMoreStoryIds(
                    activeTab, 
                    storyIds, 
                    storyIds.length, 
                    moreIdsLimit
                )
                
                // Update the store with the new IDs
                store.dispatch({ 
                    type: 'stories/setStoryIds', 
                    payload: newStoryIds 
                })
            }

            if (start >= storyIds.length) {
                dispatch(setHasMore(false))
                return
            }

            // get visible story IDs (not hidden)
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