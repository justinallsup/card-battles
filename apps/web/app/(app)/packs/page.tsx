'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export default function PacksPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/pull-arena'); }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner className="w-8 h-8" />
    </div>
  );
}
