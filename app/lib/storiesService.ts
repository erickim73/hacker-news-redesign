"use client"

import HackerNewsAPI from "./api"
import store from '../redux/store'
import { setStories, setLoading, setError, setHasMore, setPage } from '../redux/storiesSlice'
import { Story } from "./api"

export const storiesService = {
    fetchStoryIdsByType: async (type: string, starredStories: number[]) => {
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
    
            return ids
        } catch (error) {
            console.error("Error fetching stories:", error)
            throw error
        }
    },

    fetchMoreStoryIds: async (type: string, currentIds: number[], offset: number, limit: number) => {        
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
                    return currentIds
                default:
                    newIds = await HackerNewsAPI.getTopStoryIds(limit, offset)
            }
            
            // combine with existing IDs, avoiding duplicates
            const combinedIds = [...currentIds]
            newIds.forEach(id => {
                if (!combinedIds.includes(id)) {
                    combinedIds.push(id)
                }
            })            
            return combinedIds
        } catch (error) {
            console.error("Error fetching more story IDs:", error)
            throw error
        }
    },

    fetchStories: async () => {
        const state = store.getState().stories
        const { loading, hasMore, storyIds, page, readStories, starredStories, activeTab, stories } = state
        const dispatch = store.dispatch
        const items_per_page = 30

        if (loading || !hasMore) {
            return   
        }

        dispatch(setLoading(true))
        dispatch(setError(null))

        try {
            const start = (page - 1) * items_per_page
            const end = start + items_per_page

            // check if there are more stories to load
            if (activeTab !== "starred" && start + items_per_page >= storyIds.length) {
                const moreIdsLimit = 100
                const newStoryIds = await storiesService.fetchMoreStoryIds(activeTab, storyIds, storyIds.length, moreIdsLimit)
                
                // update the store with the new IDs
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

            // no more stories to fetch
            if (currentPageIds.length === 0) {
                dispatch(setHasMore(false))
                dispatch(setLoading(false))
                return
            }

            const fetchedStories = await HackerNewsAPI.getStoriesByIds(currentPageIds)
            const existingIds = new Set(stories.map((story: Story) => story.id))

            // filter stories that have already been added
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

            // check if there are more stories for next page
            const hasMoreStories = end < visibleStoryIds.length
            dispatch(setHasMore(hasMoreStories))

        } catch (error) {
            dispatch(setError("Failed to fetch stories. Please try again later."))
            console.error("Error fetching stories:", error)
            
        } finally {
            dispatch(setLoading(false))
        }
    }
}

export default storiesService