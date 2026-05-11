import { CommunityTopic } from './CommunityTopic';
import { FeedTopic } from './FeedTopic';
import type { IBaseTopicCardProps } from './interface';

export interface ITopicCardProps extends IBaseTopicCardProps {
  variant: 'feed' | 'community';
}

export function TopicCard({ data, variant, index }: ITopicCardProps) {
  if (variant === 'feed') {
    return <FeedTopic data={data} index={index} />;
  }

  return <CommunityTopic data={data} index={index} />;
}
