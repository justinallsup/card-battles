'use client';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { battles as battlesApi } from '../lib/api';

export function useFeed(sport?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', sport],
    queryFn: ({ pageParam }) =>
      battlesApi.feed({ cursor: pageParam as string | undefined, sport }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useBattle(id: string) {
  return useQuery({
    queryKey: ['battle', id],
    queryFn: () => battlesApi.get(id),
    enabled: !!id,
  });
}
