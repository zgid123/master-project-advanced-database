import type { TSubstackEntity } from '@domain/auth';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Trash2, UsersRound } from 'lucide-react';
import { useState } from 'react';

import { Button } from '#/components/ui/button';
import { useDeleteSubstackCommand } from '#/features/substack/queries/substackQueries';

import { SubstackFormModal } from './SubstackForm/SubstackFormModal';

export interface ISubstackCardProps {
  index?: number;
  data: TSubstackEntity & {
    topics: number;
    members: string;
  };
  showStatus?: boolean;
}

export function SubstackCard({
  data,
  index = 0,
  showStatus = false,
}: ISubstackCardProps) {
  const { name, description, members, topics, slug, deletedAt } = data;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { mutate: deleteSubstack, isPending: isDeleting } =
    useDeleteSubstackCommand();

  const isDeleted = !!deletedAt;

  return (
    <>
      <article
        className={`island-shell rise-in flex flex-col overflow-hidden rounded-2xl transition-all hover:border-lagoon/40 ${isDeleted ? 'opacity-60 grayscale-[0.5]' : ''}`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className='flex flex-1 flex-col p-6'>
          <div className='mb-4 flex items-start justify-between'>
            <div className='flex items-center gap-1.5 text-xs font-bold text-sea-ink-soft'>
              <UsersRound className='size-4' />
              {members}
            </div>
            <div className='flex items-center gap-2'>
              {isDeleted && (
                <span className='rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600'>
                  Deleted
                </span>
              )}
              {showStatus && (
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${data.approved ? 'bg-lagoon/14 text-lagoon-deep border-lagoon/30' : 'bg-sea-ink/10 text-sea-ink-soft border-transparent'}`}
                >
                  {data.approved ? 'Approved' : 'Pending'}
                </span>
              )}
            </div>
          </div>
          <h3 className='mb-2 text-xl font-bold text-sea-ink'>{name}</h3>
          <div className='mb-4 flex flex-wrap gap-2'>
            <span className='rounded-md border border-line bg-chip-bg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sea-ink-soft'>
              Community
            </span>
          </div>
          <p className='mb-6 flex-1 text-sm leading-relaxed text-sea-ink-soft'>
            {description}
          </p>
          <div className='mt-auto flex items-center justify-between border-t border-line/50 pt-4'>
            <span className='text-xs font-bold uppercase tracking-wider text-lagoon-deep'>
              {topics} Topics
            </span>
            <div className='flex items-center gap-2'>
              {showStatus && !isDeleted && (
                <>
                  <Button
                    className='h-8 gap-1.5 px-0 text-sm font-bold text-sea-ink hover:bg-transparent hover:text-lagoon-deep'
                    onClick={() => setIsEditOpen(true)}
                    variant='ghost'
                  >
                    Edit
                  </Button>
                  <Button
                    className='h-8 gap-1.5 px-0 text-sm font-bold text-sea-ink hover:bg-transparent hover:text-red-600'
                    disabled={isDeleting}
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete "${name}"? This action can be undone by an administrator.`,
                        )
                      ) {
                        deleteSubstack(slug);
                      }
                    }}
                    variant='ghost'
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </>
              )}
              <Button
                asChild
                className='group h-8 gap-1.5 px-0 text-sm font-bold text-sea-ink hover:bg-transparent hover:text-lagoon-deep'
                variant='ghost'
              >
                <Link
                  params={{
                    slug,
                  }}
                  to='/substacks/$slug'
                >
                  View{' '}
                  <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
      {showStatus && (
        <SubstackFormModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          substack={data}
        />
      )}
    </>
  );
}
