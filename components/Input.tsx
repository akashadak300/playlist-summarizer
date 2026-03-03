interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({ label, error, className = '', style, ...props }: InputProps) {
    return (
        <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
            {label && (
                <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>
                    {label}
                </label>
            )}
            <input
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${error ? 'red' : 'var(--border)'}`,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    color: 'var(--foreground)',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = error ? 'red' : 'var(--primary)';
                    e.currentTarget.style.boxShadow = error ? 'none' : '0 0 0 3px var(--ring)';
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = error ? 'red' : 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
                {...props}
            />
            {error && <span style={{ color: 'red', fontSize: '0.8rem' }}>{error}</span>}
        </div>
    );
}
