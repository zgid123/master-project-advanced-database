/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: ignore */
import { type QueryClient, QueryClientProvider } from '@alphacifer/react/query';
import { TanStackDevtools } from '@tanstack/react-devtools';
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import { AuthModal } from '../components/AuthModal';
import Footer from '../components/Footer';
import Header from '../components/Header';
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';
import appCss from '../styles.css?url';

export interface IMyRouterContext {
  queryClient: QueryClient;
}

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;root.classList.remove('light');root.classList.add('dark');root.setAttribute('data-theme','dark');root.style.colorScheme='dark';}catch(e){}})();`;

export const Route = createRootRouteWithContext<IMyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Solvit',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <div className='flex flex-col items-center justify-center py-20 text-center'>
      <h1 className='text-4xl font-bold text-sea-ink'>404</h1>
      <p className='mt-2 text-sea-ink-soft'>Page not found</p>
    </div>
  ),
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext();
  return (
    <html className='dark' data-theme='dark' lang='en' suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className='font-sans antialiased wrap-anywhere selection:bg-lagoon/24'>
        <QueryClientProvider client={queryClient}>
          <Header />
          <main className='page-wrap px-4 pb-10 pt-8'>{children}</main>
          <Footer />
          <AuthModal />
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
