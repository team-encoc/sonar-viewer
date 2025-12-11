interface MobileHeaderProps {
  title: string;
  onBack: () => void;
}

export function MobileHeader({ title, onBack }: MobileHeaderProps) {
  return (
    <div style={styles.header}>
      <button onClick={onBack} style={styles.backButton}>
        <span style={styles.backIcon}>←</span>
      </button>
      <div style={styles.title}>{title}</div>
      <div style={styles.placeholder} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '52px',
    minHeight: '52px',
    backgroundColor: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '8px',
    paddingRight: '8px',
    borderBottom: '1px solid #333',
  },
  backButton: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
  },
  backIcon: {
    color: '#fff',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: '17px',
    fontWeight: '600',
    letterSpacing: '-0.4px',
  },
  placeholder: {
    width: '40px',
    height: '40px',
  },
};
