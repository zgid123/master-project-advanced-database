import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/substacks')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/substacks"!</div>;
}
