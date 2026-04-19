import { QueryClient } from "@tanstack/react-query";

let client: QueryClient | null = null;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, refetchOnWindowFocus: false },
      },
    });
  }
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
      },
    });
  }
  return client;
}
