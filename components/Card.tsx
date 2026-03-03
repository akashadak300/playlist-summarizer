export default function Card({ children, className = '', style = {} }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
    return (
        <div
            className={className}
            style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                padding: '28px',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 0 0 1px rgba(59,130,246,0.15), 0 10px 30px -10px rgba(0,0,0,0.5)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                ...style
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--card-border)';
            }}
        >
            {children}
        </div>
    );
}
