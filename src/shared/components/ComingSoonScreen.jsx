import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { EmptyState } from './StateViews';
export default function ComingSoonScreen({ title, message }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} style={{ padding: 8 }}><ChevronLeft color={colors.text} /></button>
        <span style={textStyles.heading()}>{title}</span>
      </div>
      <div style={{ height: 20 }} />
      <EmptyState message={message || `${title} is being migrated and isn't available yet.`} />
    </div>
  );
}
