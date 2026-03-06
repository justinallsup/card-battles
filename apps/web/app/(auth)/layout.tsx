import { AppHeader } from '../../components/layout/AppHeader';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <AppHeader />
      <main className="max-w-sm mx-auto px-4 pt-8 pb-16">
        {children}
      </main>
    </div>
  );
}
