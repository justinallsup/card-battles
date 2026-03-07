'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton({ href }: { href?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => href ? router.push(href) : router.back()}
      aria-label="Go back"
      className="flex items-center gap-1 text-[#64748b] hover:text-white transition-colors mb-4 text-sm"
    >
      <ArrowLeft size={16} /> Back
    </button>
  );
}
