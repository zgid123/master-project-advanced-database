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
}

export function SubstackFormModal({
  isOpen,
  onClose,
}: ISubstackFormModalProps) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create Substack</DialogTitle>
        </DialogHeader>
        <div className='py-4'>
          <SubstackForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
