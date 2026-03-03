export default function Button({
    children,
    onClick,
    disabled,
    className = '',
    style = {},
    variant = 'primary',
    ...props
}: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    variant?: 'primary' | 'secondary' | 'ghost';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {

    const baseStyles: React.CSSProperties = {
        padding: variant === 'ghost' ? '6px 12px' : '12px 20px',
        borderRadius: variant === 'ghost' ? '6px' : '10px',
        border: variant === 'secondary' ? '1px solid var(--border)' : 'none',
        fontWeight: variant === 'ghost' ? 500 : 600,
        fontSize: variant === 'ghost' ? '0.85rem' : '1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        ...style
    };

    let background = 'transparent';
    let color = 'var(--foreground)';
    let boxShadow = 'none';

    if (variant === 'primary') {
        background = disabled ? 'var(--muted)' : 'linear-gradient(135deg, var(--primary), var(--accent))';
        color = '#ffffff';
        boxShadow = disabled ? 'none' : '0 4px 14px 0 rgba(59, 130, 246, 0.39)';
    }

    if (variant === 'ghost') {
        color = 'var(--muted)';
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={className}
            style={{
                ...baseStyles,
                background,
                color,
                boxShadow
            }}
            onMouseEnter={(e) => {
                if (disabled) return;
                if (variant === 'primary') {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.45)';
                } else if (variant === 'secondary') {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                } else if (variant === 'ghost') {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'var(--foreground)';
                }
            }}
            onMouseLeave={(e) => {
                if (disabled) return;
                if (variant === 'primary') {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(59, 130, 246, 0.39)';
                } else if (variant === 'secondary') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border)';
                } else if (variant === 'ghost') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--muted)';
                }
            }}
            {...props}
        >
            {children}
        </button>
    );
}
