import { QueryClient } from '@alphacifer/react/query';

export function getContext() {
  const queryClient = new QueryClient();

  return {
    queryClient,
  };
}
export default function TanstackQueryProvider() {}
