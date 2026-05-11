import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  return (
    <section className='island-shell rounded-2xl p-6 sm:p-8'>
      <p className='island-kicker mb-2'>About Solvit</p>
      <h1 className='display-title mb-3 text-4xl font-bold text-sea-ink sm:text-5xl'>
        A knowledge community built around focused substacks.
      </h1>
      <p className='m-0 max-w-3xl text-base leading-8 text-sea-ink-soft'>
        Solvit combines the practical question-and-answer flow of Stack
        Overflow with the community structure of Reddit. People ask specific
        questions, share detailed answers, vote on useful contributions, and
        follow topic-based substacks where conversations stay focused.
      </p>
      <p className='mt-5 mb-0 max-w-3xl text-base leading-8 text-sea-ink-soft'>
        Each substack acts like a dedicated space for a subject, team, course,
        or interest group. Members can subscribe to the areas they care about,
        build reputation through helpful answers, and keep up with the
        discussions that matter without losing the searchable, solution-first
        format that makes Q&amp;A communities valuable.
      </p>
    </section>
  );
}
