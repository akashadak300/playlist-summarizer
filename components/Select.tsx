export interface Option {
    label: string;
    value: string;
}

export interface OptionGroup {
    label: string;
    options: Option[];
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'options'> {
    label?: string;
    infoTooltip?: string;
    options: (Option | OptionGroup)[];
}

export default function Select({ label, infoTooltip, options, className = '', style, ...props }: SelectProps) {
    return (
        <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
            {label && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>
                        {label}
                    </label>
                    {infoTooltip && (
                        <div title={infoTooltip} style={{ display: 'flex', alignItems: 'center', cursor: 'help', color: 'var(--muted)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </div>
                    )}
                </div>
            )}
            <div style={{ position: 'relative' }}>
                <select
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'rgba(0,0,0,0.15)',
                        color: 'var(--foreground)',
                        outline: 'none',
                        appearance: 'none',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        fontSize: '1rem',
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px var(--ring)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    {...props}
                >
                    {options.map((opt, i) => {
                        if ('options' in opt) {
                            return (
                                <optgroup key={`group-${i}`} label={opt.label} style={{ backgroundColor: 'var(--card)', color: 'var(--muted)', fontStyle: 'normal', fontWeight: 600 }}>
                                    {opt.options.map((subOpt) => (
                                        <option
                                            key={subOpt.value}
                                            value={subOpt.value}
                                            style={{
                                                backgroundColor: 'var(--card)',
                                                color: 'var(--foreground)',
                                                fontWeight: 'normal'
                                            }}
                                        >
                                            {subOpt.label}
                                        </option>
                                    ))}
                                </optgroup>
                            );
                        }
                        return (
                            <option
                                key={opt.value}
                                value={opt.value}
                                style={{
                                    backgroundColor: 'var(--card)',
                                    color: 'var(--foreground)'
                                }}
                            >
                                {opt.label}
                            </option>
                        );
                    })}
                </select>
                <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
        </div>
    );
}
