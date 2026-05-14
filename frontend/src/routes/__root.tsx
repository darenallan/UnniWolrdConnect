import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <svg viewBox="0 0 200 200" className="mb-6 h-40 w-40">
        <circle cx="100" cy="100" r="90" fill="oklch(0.95 0.04 282)" />
        <circle cx="75" cy="85" r="6" fill="oklch(0.4 0.18 282)" />
        <circle cx="125" cy="85" r="6" fill="oklch(0.4 0.18 282)" />
        <path d="M70 130 Q100 110 130 130" stroke="oklch(0.4 0.18 282)" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
      <h1 className="text-5xl font-bold text-foreground">404</h1>
      <p className="mt-3 text-lg text-muted-foreground">Oops, cette page n'existe pas</p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "StudentConnect — Communauté étudiante internationale" },
      { name: "description", content: "Plateforme IA pour aider les étudiants internationaux à s'intégrer socialement et académiquement." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "https://aurum-bf.web.app/favicon.svg", type: "image/svg+xml" }
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
