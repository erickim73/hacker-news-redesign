import StoryDetailClient from "./client";

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
    // Await and resolve the params
    const resolvedParams = await params;
    const storyId = resolvedParams.id;
    
    // Render the client component with the resolved ID
    return <StoryDetailClient storyId={storyId} />;
  }