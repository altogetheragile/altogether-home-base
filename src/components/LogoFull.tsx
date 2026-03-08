import { colors as p } from '@/theme/colors';

const LogoFull = ({ height = 48, light = false }: { height?: number; light?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
    <span style={{
      color: light ? '#fff' : p.deepTeal,
      fontWeight: 800,
      fontSize: height * 0.48,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>Altogether</span>
    <span style={{
      color: p.orange,
      fontWeight: 800,
      fontSize: height * 0.48,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>Agile</span>
  </div>
);

export default LogoFull;
