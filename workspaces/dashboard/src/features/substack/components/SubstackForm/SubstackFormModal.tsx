import type { TSubstackEntity } from '@domain/auth';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';

import { SubstackForm } from './SubstackForm';

interface ISubstackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  substack?: TSubstackEntity;
}

export function SubstackFormModal({
  isOpen,
  onClose,
  substack,
}: ISubstackFormModalProps) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {substack ? 'Edit Substack' : 'Create Substack'}
          </DialogTitle>
        </DialogHeader>
        <div className='py-4'>
          <SubstackForm onSuccess={onClose} substack={substack} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
