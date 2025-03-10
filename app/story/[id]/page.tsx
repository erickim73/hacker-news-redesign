import StoryDetailWrapper from './StoryDetailWrapper';

type Props = {
    params: Promise<{
        id: string
    }> | {
        id: string
    }
}

export default async function StoryPage({ params }: Props) {
    const resolvedParams = await Promise.resolve(params);
    return <StoryDetailWrapper id={resolvedParams.id} />;
}