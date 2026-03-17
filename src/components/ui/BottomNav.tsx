import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'בית', icon: '🏠' },
  { path: '/history', label: 'היסטוריה', icon: '📊' },
  { path: '/settings', label: 'הגדרות', icon: '⚙️' },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide nav on full-screen flows
  const hiddenPaths = ['/relaxation', '/measurement', '/calibration', '/onboarding', '/summary'];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(15, 10, 30, 0.85)',
        WebkitBackdropFilter: 'blur(16px)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-center py-2.5 px-4 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-colors appearance-none border-none bg-transparent cursor-pointer ${
                isActive ? 'text-accent-calm' : 'text-text-secondary active:text-text-primary'
              }`}
              aria-label={item.label}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
