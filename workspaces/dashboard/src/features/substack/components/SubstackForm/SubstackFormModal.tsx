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
  onCreated?: () => void;
}

export function SubstackFormModal({
  isOpen,
  onClose,
  onCreated,
}: ISubstackFormModalProps) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create Substack</DialogTitle>
        </DialogHeader>
        <div className='py-4'>
          <SubstackForm onCreated={onCreated} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
