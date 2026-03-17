import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'בית', icon: '🏠' },
  { path: '/history', label: 'היסטוריה', icon: '📊' },
  { path: '/settings', label: 'הגדרות', icon: '⚙️' },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide nav on relaxation/measurement/calibration screens
  const hiddenPaths = ['/relaxation', '/measurement', '/calibration', '/onboarding'];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-50 safe-area-bottom">
      <div className="flex justify-around items-center py-3 px-4 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors ${
                isActive ? 'text-accent-calm' : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-label={item.label}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
