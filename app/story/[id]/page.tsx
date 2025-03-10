import StoryDetailWrapper from './StoryDetailWrapper';

type tParams = Promise<{ id: string }>;

export default async function StoryPage(props: { params: tParams }) {
    const { id } = await props.params;
    return <StoryDetailWrapper id={id} />;
}