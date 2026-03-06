'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export default function ProfileRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user?.username) {
      router.replace(`/profile/${user.username}`);
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner className="w-8 h-8" />
    </div>
  );
}
