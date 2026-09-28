import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Home, BookOpen, BarChart2, Hexagon, User } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
const tabs = [
  { path: '/today', label: 'Today', icon: Home }, { path: '/practice', label: 'Practice', icon: BookOpen },
  { path: '/progress', label: 'Progress', icon: BarChart2 }, { path: '/dna', label: 'DNA', icon: Hexagon },
  { path: '/profile', label: 'Profile', icon: User },
];
export default function HomeShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeIndex = tabs.findIndex((t) => location.pathname.startsWith(t.path));
  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 76 }}><Outlet /></div>
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.surface, borderTop: `1px solid ${colors.border}`, maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex' }}>
          {tabs.map((tab, i) => {
            const isActive = i === activeIndex;
            const Icon = tab.icon;
            return (
              <button key={tab.path} onClick={() => navigate(tab.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', position: 'relative' }}>
                {isActive ? <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 28, height: 3, borderRadius: 2, background: colors.violet }} /> : null}
                <Icon size={21} color={isActive ? colors.violet : colors.textFaint} />
                <span style={textStyles.meta(isActive ? colors.violet : colors.textFaint)}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
