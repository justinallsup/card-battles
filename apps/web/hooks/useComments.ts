'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getToken } from '../lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export type Comment = {
  id: string;
  battleId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
  likes: number;
};

async function fetchComments(battleId: string): Promise<{ comments: Comment[]; total: number }> {
  const res = await fetch(`${BASE_URL}/battles/${battleId}/comments`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

async function postComment(battleId: string, text: string): Promise<Comment> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/battles/${battleId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error || 'Failed to post comment');
  }
  return res.json();
}

async function likeComment(battleId: string, commentId: string): Promise<Comment> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/battles/${battleId}/comments/${commentId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('Failed to like comment');
  return res.json();
}

export function useComments(battleId: string) {
  return useQuery({
    queryKey: ['comments', battleId],
    queryFn: () => fetchComments(battleId),
    refetchInterval: 30_000,
  });
}

export function usePostComment(battleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => postComment(battleId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', battleId] });
    },
  });
}

export function useLikeComment(battleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => likeComment(battleId, commentId),
    onSuccess: (updated) => {
      qc.setQueryData<{ comments: Comment[]; total: number }>(['comments', battleId], (old) => {
        if (!old) return old;
        return {
          ...old,
          comments: old.comments.map((c) => (c.id === updated.id ? updated : c)),
        };
      });
    },
  });
}
