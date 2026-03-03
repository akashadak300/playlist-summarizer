'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
        const handleShow = () => setShowControls(true);
        const handleHide = () => setShowControls(false);

        window.addEventListener('showNavbarControls', handleShow);
        window.addEventListener('hideNavbarControls', handleHide);

        return () => {
            window.removeEventListener('showNavbarControls', handleShow);
            window.removeEventListener('hideNavbarControls', handleHide);
        };
    }, []);

    return (
        <header style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '64px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            zIndex: 10
        }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                    Playlist Summarizer
                </h1>
            </Link>

            {showControls && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('openChangePlaylist'));
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'color 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--foreground)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--muted)'}
                    >
                        Change Playlist
                    </button>
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('openGlobalSettings'));
                        }}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--foreground)',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        Change Settings
                    </button>
                </div>
            )}
        </header>
    );
}
