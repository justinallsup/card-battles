import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNav } from '../../components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <AppHeader />
      <main
        className="max-w-lg mx-auto px-4 pt-4"
        style={{
          paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
