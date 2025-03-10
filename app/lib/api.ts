import axios from 'axios';

const base_url = 'https://hacker-news.firebaseio.com/v0'

export interface Story {
    id: number; 
    title: string; 
    url?: string; 
    text?: string; 
    by: string; 
    time: number; 
    score: number;
    descendants: number; 
    kids?: number[]; 
    isRead?: boolean; 
    isStarred?: boolean;
}

export interface Comment {
    id: number;
    text?: string;
    by?: string;
    time: number;
    kids?: number[];
    parent: number;
    deleted?: boolean;
    dead?: boolean;
    replies?: Comment[];
    hasUnloadedReplies?: boolean
  }

export interface User {
    id: string;
    created: number;
    karma: number;
    about?: string;
    submitted?: number[];
}

const HackerNewsAPI = {
    async getTopStoryIds(limit?: number, offset: number = 0): Promise<number[]>{
        try {
            const response = await axios.get(`${base_url}/topstories.json`)
            return limit ? response.data.slice(offset, offset + limit) : response.data
        } catch (error) {
            console.error('Error fetching top stories:', error)
            return []
        }
    },

    async getNewStoryIds(limit?: number, offset: number = 0): Promise<number[]>{
        try {
            const response = await axios.get(`${base_url}/newstories.json`)
            return limit ? response.data.slice(offset, offset + limit) : response.data

        } catch (error) {
            console.error('Error fetching new stories:', error)
            return []
        }
    },

    async getBestStoryIds(limit?: number, offset: number = 0): Promise<number[]>{
        try {
            const response = await axios.get(`${base_url}/beststories.json`)
            return limit ? response.data.slice(offset, offset + limit) : response.data
        } catch (error) {
            console.error('Error fetching best stories:', error)
            return []
        }
    },

    async getStory(id: number): Promise<Story | null> {
        try {
            const response = await axios.get(`${base_url}/item/${id}.json`)
            return response.data
        } catch (error) {
            console.error(`Error fetching story ${id}`, error)
            return null
        }
    },

    async getStoriesByIds(ids: number[], start = 0, end = 30): Promise<Story[]> {
        const pageIds = ids.slice(start, end)
        
        try {
            // fetch stories in parallel with promises
            const storiesPromises = pageIds.map(id => this.getStory(id))
            const stories = await Promise.all(storiesPromises)

            return stories.filter(story => story !== null) as Story[]
        } catch (error) {
            console.error("Error fetching stories batch:", error)
            return []
        }
    },

    async getComment(id: number): Promise<Comment | null> {
        try{
            const response = await axios.get(`${base_url}/item/${id}.json`)
            return response.data
        } catch (error) {
            console.error(`Error fetching comment ${id}`, error)
            return null
        }
    },
    
    async getCommentsForStory(storyId: number, maxDepth = 2): Promise<Comment[]> {
        try {
            const story = await this.getStory(storyId);
            if (!story || !story.kids || story.kids.length === 0) {
                return [];
            }
    
            // helper function to recursively get comments
            const fetchCommentWithReplies = async (commentId: number, depth: number): Promise<Comment | null> => {
                if (depth > maxDepth) return null
                
                const comment = await this.getComment(commentId)
                if (!comment) return null
                
                // if the comment has replies, we haven't reached max depth
                if (comment.kids && comment.kids.length > 0 && depth < maxDepth) {
                    const repliesPromises = comment.kids.map(kidId => 
                        fetchCommentWithReplies(kidId, depth + 1)
                    )
                
                    const replies = await Promise.all(repliesPromises)
                    // attach non-null replies to the comment
                    comment.replies = replies.filter(reply => reply !== null) as Comment[]
                }
            
            return comment
        }
          
        // get top-level comments in parallel
        const commentsPromises = story.kids.map(kidId => 
            fetchCommentWithReplies(kidId, 1)
        )
        
        const comments = await Promise.all(commentsPromises)
        return comments.filter(comment => comment !== null) as Comment[]
            
        } catch (error) {
            console.error(`Error fetching comments for story ${storyId}:`, error)
            return []
        }
    },

    async getUser(username: string): Promise<User | null> {
        try {
            const response = await axios.get(`${base_url}/user/${username}.json`)
            return response.data
        } catch (error) {
            console.error(`Error fetching user ${username}:`, error);
            return null;
        }
    }
}

export default HackerNewsAPI;