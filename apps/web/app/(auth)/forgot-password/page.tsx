'use client';
import Link from 'next/link';
import { Swords, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Swords size={28} className="text-[#6c47ff]" />
          <span className="font-black text-2xl text-white">CARD<span className="text-[#6c47ff]">BATTLES</span></span>
        </div>
        <h1 className="text-2xl font-black text-white">Forgot Password</h1>
        <p className="text-[#64748b] mt-1">Password reset</p>
      </div>

      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#6c47ff]/10 border border-[#6c47ff]/20 flex items-center justify-center mx-auto">
          <Mail size={24} className="text-[#6c47ff]" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">Not configured</h2>
          <p className="text-[#64748b] text-sm mt-2 leading-relaxed">
            Email password reset is not configured in this demo.
            <br />
            Use the demo account below to log in.
          </p>
        </div>
        <div className="bg-[#0a0a0f] rounded-xl border border-[#1e1e2e] p-3 text-xs text-[#64748b] text-center">
          Demo: <span className="text-[#94a3b8]">cardking@demo.com</span> / <span className="text-[#94a3b8]">password123</span>
        </div>
      </div>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-[#64748b] hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Back to Login
      </Link>
    </div>
  );
}
