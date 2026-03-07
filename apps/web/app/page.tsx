'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // MVP: Always redirect to battles feed immediately
    router.replace('/feed');
  }, [router]);
  
  return null;
}
