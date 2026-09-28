import { textStyles } from '../../core/theme/textStyles';
import { colors } from '../../core/theme/colors';
export default function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, paddingLeft: 2, paddingRight: 2 }}>
      <span style={textStyles.label()}>{title}</span>
      {action ? <button onClick={onAction} style={textStyles.meta(colors.blue)}>{action}</button> : null}
    </div>
  );
}
