import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';

import type { TTopic } from '../../types';
import { TopicForm } from './TopicForm';

interface ITopicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: TTopic;
  substackId?: string;
  hideSubstackId?: boolean;
}

export function TopicFormModal({
  isOpen,
  onClose,
  topic,
  substackId,
  hideSubstackId,
}: ITopicFormModalProps) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {topic ? 'Edit Question' : 'Ask a Question'}
          </DialogTitle>
        </DialogHeader>
        <div className='py-4'>
          <TopicForm
            hideSubstackId={hideSubstackId}
            onSuccess={onClose}
            substackId={substackId}
            topic={topic}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
