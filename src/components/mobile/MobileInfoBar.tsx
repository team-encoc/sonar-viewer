interface MobileInfoBarProps {
  fileName: string;
  resolution: '144' | '360' | '720';
  sensitivity: number;
}

export function MobileInfoBar({ fileName, resolution, sensitivity }: MobileInfoBarProps) {
  return (
    <div style={styles.infoBar}>
      <span style={styles.fileName}>{fileName}</span>
      <span style={styles.separator}>|</span>
      <span style={styles.info}>해상도: {resolution}</span>
      <span style={styles.separator}>|</span>
      <span style={styles.info}>감도: {sensitivity}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  infoBar: {
    height: '36px',
    minHeight: '36px',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    flexWrap: 'wrap',
  },
  fileName: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: '500',
    maxWidth: '40%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  separator: {
    color: '#666',
    fontSize: '13px',
  },
  info: {
    color: '#aaa',
    fontSize: '12px',
  },
};
