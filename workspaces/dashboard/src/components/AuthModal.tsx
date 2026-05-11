import { Link } from '@tanstack/react-router';
import EventEmitter from 'eventemitter3';
import { LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';

interface IOpenParams {
  title?: string;
  message?: string;
}

interface IAuthEventTypes {
  open: (props: IOpenParams) => void;
}

export const authEvents = new EventEmitter<IAuthEventTypes>();

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState({ message: '', title: '' });

  useEffect(() => {
    const handleOpen = ({ title, message }: IOpenParams) => {
      setModalProps({
        title: title || 'Authentication Required',
        message: message || 'You need to be logged in to perform this action.',
      });
      setIsOpen(true);
    };

    authEvents.on('open', handleOpen);
    return () => {
      authEvents.off('open', handleOpen);
    };
  }, []);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{modalProps.title}</DialogTitle>
          <DialogDescription>{modalProps.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className='sm:justify-end gap-2'>
          <Button
            className='h-11 rounded-xl font-semibold border border-line bg-white hover:bg-chip-bg text-sea-ink dark:bg-zinc-800 dark:hover:bg-zinc-700'
            onClick={() => setIsOpen(false)}
            type='button'
            variant='outline'
          >
            Cancel
          </Button>
          <Button
            asChild
            className='h-11 rounded-xl border border-lagoon/35 bg-lagoon/16 font-bold text-lagoon-deep hover:bg-lagoon/24'
          >
            <Link onClick={() => setIsOpen(false)} to='/sign-in'>
              <LogIn className='size-4 mr-2' />
              Sign In
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
