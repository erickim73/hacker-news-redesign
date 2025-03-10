'use client'

import { useParams } from 'next/navigation';
import StoryDetail from './client';

export default function StoryDetailWrapper({ id }: { id: string }) {
    
    // double-check id with useParams as a fallback
    const params = useParams();
    const storyId = id || (params?.id as string);
    
    if (!storyId) {
        return <div>Error: No story ID found</div>;
    }
    return <StoryDetail storyId={storyId} />;
}
