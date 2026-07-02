"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";
import { useState, useEffect, type ReactNode } from "react";

function CacheInvalidator({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    queryClient.invalidateQueries({ queryKey: ["watchHistory"] });
    queryClient.invalidateQueries({ queryKey: ["continue-watching"] });
  }, [session?.user?.id, queryClient]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
            retryDelay: 2000,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <CacheInvalidator>{children}</CacheInvalidator>
      </QueryClientProvider>
    </SessionProvider>
  );
}
