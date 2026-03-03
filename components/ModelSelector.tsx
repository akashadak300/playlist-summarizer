import React, { useState, useRef, useEffect } from 'react';

interface ModelOption {
    label: string;
    value: string;
}

interface ModelGroup {
    label: string;
    options: ModelOption[];
}

interface ModelSelectorProps {
    groups: ModelGroup[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
}

export default function ModelSelector({ groups, value, onChange, placeholder = "Search models...", label }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter logic
    const filteredGroups = groups.map(group => ({
        ...group,
        options: group.options.filter(opt =>
            opt.label.toLowerCase().includes(search.toLowerCase()) ||
            opt.value.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(group => group.options.length > 0);

    const flatOptions = filteredGroups.flatMap(g => g.options);

    // Keyboard navigation
    const [activeIndex, setActiveIndex] = useState(0);

    // Reset active index when search changes
    useEffect(() => {
        setActiveIndex(0);
    }, [search, isOpen]);

    // Handle clicks outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev < flatOptions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (flatOptions[activeIndex]) {
                    onChange(flatOptions[activeIndex].value);
                    setIsOpen(false);
                    setSearch('');
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    const getDisplayLabel = () => {
        const selected = groups.flatMap(g => g.options).find(o => o.value === value);
        return selected ? selected.label : value;
    };

    return (
        <div className="model-selector-wrapper" ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: 'var(--foreground)'
                }}>
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <div
                tabIndex={0}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls="model-listbox"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none'
                }}
            >
                <div style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {getDisplayLabel()}
                    {value.includes(':free') && (
                        <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            borderRadius: '4px',
                            fontWeight: 600,
                            border: '1px solid rgba(16,185,129,0.3)'
                        }}>FREE</span>
                    )}
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: 'var(--muted)' }}>
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    backgroundColor: '#111827', // dark slate
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                    zIndex: 50,
                    overflow: 'hidden',
                    animation: 'fadeInSlideUp 0.15s ease-out forwards',
                    backdropFilter: 'blur(10px)'
                }}>
                    {/* Search Bar */}
                    <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '24px', top: '23px' }}>
                            <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={placeholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                width: '100%',
                                height: '36px',
                                padding: '0 12px 0 32px',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                border: '1px solid transparent',
                                borderRadius: '6px',
                                color: '#fff',
                                outline: 'none',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
                            onBlur={(e) => e.target.style.border = '1px solid transparent'}
                        />
                    </div>

                    {/* Options List */}
                    <div
                        id="model-listbox"
                        role="listbox"
                        className="custom-scrollbar"
                        style={{
                            maxHeight: '320px',
                            overflowY: 'auto',
                            padding: '8px 0'
                        }}
                    >
                        {filteredGroups.length === 0 ? (
                            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
                                No models found matching "{search}"
                            </div>
                        ) : (
                            filteredGroups.map((group, groupIdx) => (
                                <div key={group.label} style={{ marginBottom: groupIdx < filteredGroups.length - 1 ? '16px' : '0' }}>
                                    <div style={{
                                        padding: '4px 16px 8px 16px',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: 'var(--muted)',
                                        fontWeight: 600
                                    }}>
                                        {group.label}
                                    </div>
                                    <div>
                                        {group.options.map(option => {
                                            const flatIndex = flatOptions.indexOf(option);
                                            const isSelected = value === option.value;
                                            const isActive = activeIndex === flatIndex;
                                            const isFree = option.value.includes(':free');

                                            return (
                                                <div
                                                    key={option.value}
                                                    role="option"
                                                    aria-selected={isSelected}
                                                    onClick={() => {
                                                        onChange(option.value);
                                                        setIsOpen(false);
                                                        setSearch('');
                                                    }}
                                                    onMouseMove={() => setActiveIndex(flatIndex)}
                                                    style={{
                                                        padding: '10px 16px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                        color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                                                        borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                                                        transition: 'background 0.1s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 400 }}>
                                                            {option.label}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                                                            {option.value}
                                                        </span>
                                                    </div>

                                                    {isFree && (
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            padding: '2px 8px',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            color: '#10b981',
                                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                                            borderRadius: '12px',
                                                            fontWeight: 600,
                                                            flexShrink: 0
                                                        }}>
                                                            FREE
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
