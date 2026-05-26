const LogoFull = ({ height = 48 }: { height?: number; light?: boolean }) => (
  <img
    src="/brand/lockup-horizontal-tight.svg"
    alt="Altogether Agile"
    style={{ height, width: 'auto', display: 'block' }}
  />
);

export default LogoFull;
