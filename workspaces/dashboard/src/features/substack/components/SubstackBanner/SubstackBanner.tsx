import { useMutation } from '@tanstack/react-query';
import type { TSubstackEntity } from '@domain/auth';
import { Share2, ShieldCheck, Star, UsersRound } from 'lucide-react';

import { authEvents } from '#/components/AuthModal';
import { Button } from '#/components/ui/button';
import { useSession } from '#/features/auth/queries';
import { subscribeSubstack } from '#/features/substack/api';

interface ISubstackBannerProps {
  substack: TSubstackEntity;
}

export function SubstackBanner({ substack }: ISubstackBannerProps) {
  const { name, slug, description } = substack;
  const { data: session } = useSession();
  const subscribeMutation = useMutation({
    mutationFn: () => subscribeSubstack(slug),
  });

  return (
    <section className='island-shell rise-in overflow-hidden rounded-2xl'>
      {/* {coverImage && (
        <img alt={name} className='h-24 w-full object-cover' src={coverImage} />
      )} */}
      <div className='h-24 bg-linear-to-r from-lagoon/20 via-lagoon/10 to-transparent' />
      <div className='relative px-6 pb-6'>
        <div className='-mt-8 mb-4 flex items-end justify-between'>
          <div className='flex size-20 items-center justify-center rounded-2xl border-4 border-[#0b1219] bg-lagoon-deep text-3xl font-bold text-white shadow-xl'>
            {name.charAt(0)}
          </div>
          <div className='flex gap-2'>
            <Button
              className='size-10 rounded-xl border-line bg-white/5'
              size='icon'
              variant='outline'
            >
              <Share2 className='size-4' />
            </Button>
            <Button
              className='h-10 rounded-xl bg-lagoon-deep px-6 font-bold text-white hover:bg-lagoon-deep/90'
              disabled={subscribeMutation.isPending}
              onClick={() => {
                if (!session?.user) {
                  authEvents.emit('open', {
                    message: 'Sign in to join this substack.',
                  });
                  return;
                }
                subscribeMutation.mutate();
              }}
              type='button'
            >
              Join Community
            </Button>
          </div>
        </div>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <h1 className='display-title m-0 text-3xl font-bold text-sea-ink'>
              {name}
            </h1>
            <ShieldCheck className='size-5 text-lagoon' />
          </div>
          <p className='island-kicker text-lagoon-deep'>s/{slug}</p>
        </div>
        {description && (
          <p className='mt-4 max-w-2xl text-base leading-relaxed text-sea-ink-soft'>
            {description}
          </p>
        )}
        <div className='mt-6 flex flex-wrap gap-6 border-t border-line/50 pt-6'>
          <div className='flex items-center gap-2'>
            <UsersRound className='size-5 text-sea-ink-soft' />
            <div>
              <div className='text-sm font-bold text-sea-ink'>12.4k</div>
              <div className='text-[10px] font-bold uppercase tracking-wider text-sea-ink-soft'>
                Members
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Star className='size-5 text-sea-ink-soft' />
            <div>
              <div className='text-sm font-bold text-sea-ink'>Top 1%</div>
              <div className='text-[10px] font-bold uppercase tracking-wider text-sea-ink-soft'>
                Rank
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
