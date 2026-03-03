interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export default function Textarea({ label, error, helperText, className = '', style, ...props }: TextareaProps) {
    return (
        <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
            {label && (
                <label style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--foreground)' }}>
                    {label}
                </label>
            )}
            <textarea
                style={{
                    width: '100%',
                    minHeight: '140px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${error ? 'red' : 'var(--border)'}`,
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    color: 'var(--foreground)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    lineHeight: '1.5',
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
            {helperText && !error && (
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{helperText}</span>
            )}
            {error && <span style={{ color: 'red', fontSize: '0.85rem' }}>{error}</span>}
        </div>
    );
}
