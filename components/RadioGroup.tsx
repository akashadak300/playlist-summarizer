interface Option {
    label: string;
    value: string;
}

interface RadioGroupProps {
    label?: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    style?: React.CSSProperties;
}

export default function RadioGroup({ label, options, value, onChange, className = '', style }: RadioGroupProps) {
    return (
        <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...style }}>
            {label && (
                <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>
                    {label}
                </label>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {options.map((opt) => {
                    const isSelected = value === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange(opt.value)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '99px',
                                fontSize: '0.9rem',
                                fontWeight: isSelected ? 600 : 500,
                                border: isSelected ? '1px solid transparent' : '1px solid var(--border)',
                                background: isSelected ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'transparent',
                                color: isSelected ? '#ffffff' : 'var(--muted)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'var(--muted)';
                                    e.currentTarget.style.color = 'var(--foreground)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                    e.currentTarget.style.color = 'var(--muted)';
                                }
                            }}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
