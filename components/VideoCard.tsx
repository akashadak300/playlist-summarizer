import { useState } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { MODEL_GROUPS } from '@/lib/constants';

interface VideoMetadata {
    id: string;
    title: string;
    duration: number;
    status: string;
    currentStep: string;
    errorMessage: string | null;
    errorType?: string | null;
    thumbnail?: string | null;
    hasTranscript?: boolean;
    summary?: string | null;
    modelUsed?: string | null;
}

interface VideoCardProps {
    vid: VideoMetadata;
    index: number;
    checkingVideos: Set<string>;
    fetchingTranscripts: Set<string>;
    loadingTranscriptBytes: Set<string>;
    summarizingVideos: Set<string>;
    loadedTranscript?: string;
    onCheckCaptions: (id: string) => void;
    onFetchTranscript: (id: string) => void;
    onLoadTranscript: (id: string, hasTranscript: boolean) => void;
    onDownloadTranscript: (id: string, title: string) => void;
    onSummarize: (id: string) => void;
    onOpenSettings: (id: string) => void;
    hasOverride?: boolean;
}

const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const getStatusBadge = (status: string) => {
    let bg = 'var(--bg)';
    let color = 'var(--muted)';
    let boxShadow = 'none';

    switch (status) {
        case 'pending': bg = 'rgba(156, 163, 175, 0.1)'; color = 'var(--muted)'; break;
        case 'checking_captions': bg = 'rgba(59, 130, 246, 0.1)'; color = '#3b82f6'; break;
        case 'captions_available': bg = 'rgba(16, 185, 129, 0.1)'; color = '#10b981'; break;
        case 'no_captions': bg = 'rgba(249, 115, 22, 0.1)'; color = '#f97316'; break;
        case 'transcript_fetched':
            bg = 'rgba(168, 85, 247, 0.15)';
            color = '#c084fc';
            boxShadow = '0 0 12px rgba(168, 85, 247, 0.4)';
            break;
        case 'error': bg = 'rgba(239, 68, 68, 0.1)'; color = '#ef4444'; break;
        case 'processing': bg = 'rgba(59, 130, 246, 0.1)'; color = '#3b82f6'; break;
        case 'completed':
            bg = 'rgba(16, 185, 129, 0.15)';
            color = '#10b981';
            boxShadow = '0 0 12px rgba(16, 185, 129, 0.3)';
            break;
    }
    return { bg, color, niceText: status.replace(/_/g, ' ').toUpperCase(), boxShadow };
};

const ActionButton = ({ onClick, disabled, variant = 'primary', style, children }: any) => {
    const isPrimary = variant === 'primary';
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '0 16px',
                height: '36px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                background: isPrimary
                    ? 'linear-gradient(var(--card-bg), var(--card-bg)) padding-box, linear-gradient(to right, var(--primary), #a855f7) border-box'
                    : 'transparent',
                border: isPrimary ? '1px solid transparent' : '1px solid var(--border)',
                color: isPrimary ? 'var(--foreground)' : 'var(--muted)',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                ...style
            }}
        >
            {children}
        </button>
    );
};

export default function VideoCard({
    vid,
    index,
    checkingVideos,
    fetchingTranscripts,
    loadingTranscriptBytes,
    summarizingVideos,
    loadedTranscript,
    onCheckCaptions,
    onFetchTranscript,
    onLoadTranscript,
    onDownloadTranscript,
    onSummarize,
    onOpenSettings,
    hasOverride
}: VideoCardProps) {
    const badge = getStatusBadge(vid.status);

    // UI Local State for Micro-interactions
    const [copied, setCopied] = useState(false);
    const [summaryCopied, setSummaryCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingSummary, setIsDownloadingSummary] = useState(false);

    // Visibility States
    const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
    const [isSummaryVisible, setIsSummaryVisible] = useState(true);

    // Confirmation Modal for replacing existing summary
    const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

    const handleCopyTranscript = () => {
        if (!loadedTranscript) return;
        navigator.clipboard.writeText(loadedTranscript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopySummary = () => {
        if (!vid.summary) return;
        navigator.clipboard.writeText(vid.summary);
        setSummaryCopied(true);
        setTimeout(() => setSummaryCopied(false), 2000);
    };

    const handleDownloadTranscript = () => {
        setIsDownloading(true);
        onDownloadTranscript(vid.id, vid.title);
        setTimeout(() => setIsDownloading(false), 200);
    };

    const handleDownloadSummary = () => {
        setIsDownloadingSummary(true);
        const blob = new Blob([vid.summary || ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${vid.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30)}-summary.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => setIsDownloadingSummary(false), 200);
    };

    const handleToggleTranscript = () => {
        if (!isTranscriptVisible) {
            onLoadTranscript(vid.id, !!vid.hasTranscript);
            setIsTranscriptVisible(true);
        } else {
            setIsTranscriptVisible(false);
        }
    };

    const wordCount = loadedTranscript ? loadedTranscript.trim().split(/\s+/).length : 0; // Changed from expandedTranscript

    return (
        <div style={{
            padding: '16px',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            background: 'var(--card-bg)',
            transition: 'all 0.3s'
        }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Left Column Thumbnail */}
                <div style={{ position: 'relative', width: '120px', flexShrink: 0 }}>
                    <a href={`https://www.youtube.com/watch?v=${vid.id}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                        <img src={vid.thumbnail || `https://via.placeholder.com/120x68?text=Thumb+${index + 1}`}
                            alt={vid.title}
                            style={{ width: '100%', height: 'auto', borderRadius: '8px', objectFit: 'cover', aspectRatio: '16/9', transition: 'opacity 0.2s', opacity: 0.9 }}
                            onMouseOver={e => e.currentTarget.style.opacity = '1'}
                            onMouseOut={e => e.currentTarget.style.opacity = '0.9'}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            fontWeight: 600
                        }}>
                            {formatDuration(vid.duration)}
                        </div>
                    </a>
                </div>

                {/* Right Column Data */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <h5 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.3 }}>
                            {vid.title}
                        </h5>
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: badge.bg,
                            color: badge.color,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            boxShadow: badge.boxShadow,
                            border: badge.boxShadow !== 'none' ? `1px solid rgba(168, 85, 247, 0.3)` : '1px solid transparent'
                        }}>
                            {badge.niceText}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        <span style={{ color: (vid.status !== 'pending') ? 'var(--primary)' : 'inherit', fontWeight: (vid.status !== 'pending') ? 600 : 400 }}>
                            Captions Checked
                        </span>
                        <span style={{ opacity: 0.5 }}>→</span>
                        <span style={{ color: (vid.hasTranscript || !!vid.summary) ? 'var(--primary)' : 'inherit', fontWeight: (vid.hasTranscript || !!vid.summary) ? 600 : 400 }}>
                            Transcript Loaded
                        </span>
                        <span style={{ opacity: 0.5 }}>→</span>
                        <span style={{ color: (!!vid.summary) ? 'var(--primary)' : 'inherit', fontWeight: (!!vid.summary) ? 600 : 400 }}>
                            Summary Generated
                        </span>
                    </div>

                    {vid.errorMessage && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginTop: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.4 }}>
                                <strong style={{ display: 'block', marginBottom: '4px' }}>
                                    {vid.errorType === 'rate_limit' ? 'Rate Limit Exceeded' :
                                        !vid.hasTranscript ? 'Data Fetch Error' : 'Summarization Failed'}
                                </strong>
                                {vid.errorMessage}
                            </div>

                            {/* Error Actions are strictly mapped to Settings vs Execution as per Phase 9 */}
                            {(vid.errorType === 'rate_limit' || vid.status === 'failed' || vid.status === 'error') && vid.hasTranscript && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <ActionButton
                                        variant="secondary"
                                        onClick={() => onOpenSettings(vid.id)}
                                        disabled={summarizingVideos.has(vid.id)}
                                    >
                                        Change Settings
                                    </ActionButton>
                                    <ActionButton
                                        variant="primary"
                                        onClick={() => onSummarize(vid.id)}
                                        disabled={summarizingVideos.has(vid.id)}
                                    >
                                        {summarizingVideos.has(vid.id) ? 'Summarizing...' : 'Summarize'}
                                    </ActionButton>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {vid.status === 'pending' && (
                            <ActionButton onClick={() => onCheckCaptions(vid.id)} disabled={checkingVideos.has(vid.id)}>
                                {checkingVideos.has(vid.id) ? 'Checking...' : 'Check Captions'}
                            </ActionButton>
                        )}

                        {vid.status === 'checking_captions' && (
                            <ActionButton disabled>Checking...</ActionButton>
                        )}

                        {vid.status === 'captions_available' && !vid.hasTranscript && (
                            <ActionButton variant="primary" onClick={() => onFetchTranscript(vid.id)} disabled={fetchingTranscripts.has(vid.id)}>
                                {fetchingTranscripts.has(vid.id) ? 'Fetching...' : 'Fetch Transcript'}
                            </ActionButton>
                        )}

                        {(vid.status === 'transcript_fetched' || vid.hasTranscript) && !isTranscriptVisible && (
                            <ActionButton variant="secondary" onClick={handleToggleTranscript}>
                                {loadingTranscriptBytes.has(vid.id) ? 'Loading...' : 'View Transcript ▼'}
                            </ActionButton>
                        )}
                        {(vid.status === 'transcript_fetched' || vid.hasTranscript) && !vid.summary && (
                            <>
                                <ActionButton
                                    variant="secondary"
                                    onClick={() => onOpenSettings(vid.id)}
                                    disabled={summarizingVideos.has(vid.id) || vid.status === 'processing'}
                                >
                                    Change Settings
                                </ActionButton>
                                <ActionButton
                                    variant="primary"
                                    onClick={() => onSummarize(vid.id)}
                                    disabled={summarizingVideos.has(vid.id) || vid.status === 'processing'}
                                >
                                    {summarizingVideos.has(vid.id) || vid.currentStep === 'summarizing' ? 'Summarizing...' : 'Summarize'}
                                </ActionButton>
                            </>
                        )}
                        {vid.summary && !isSummaryVisible && (
                            <ActionButton variant="secondary" onClick={() => setIsSummaryVisible(true)}>
                                View Summary ▼
                            </ActionButton>
                        )}

                        {vid.status === 'no_captions' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ActionButton variant="secondary" onClick={() => { }}>Download MP3</ActionButton>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Transcription not available.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Transcript Viewer Workspace */}
            {isTranscriptVisible && loadedTranscript && (
                <div style={{ animation: 'fadeInSlideUp 0.3s ease-out forwards' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '24px 0 20px 0' }} />

                    {/* Transcript Section Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                            Transcript loaded · {wordCount.toLocaleString()} words
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <ActionButton variant="ghost" onClick={handleCopyTranscript}>
                                {copied ? "Copied ✓" : "Copy"}
                            </ActionButton>
                            <ActionButton variant="ghost" onClick={handleDownloadTranscript} style={{ transform: isDownloading ? 'scale(0.95)' : 'none' }}>
                                Download ▼
                            </ActionButton>
                            <ActionButton variant="ghost" onClick={() => setIsTranscriptVisible(false)}>
                                Hide
                            </ActionButton>
                        </div>
                    </div>

                    {/* Workspace Container */}
                    <div className="custom-scrollbar" style={{
                        position: 'relative',
                        borderRadius: '12px',
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',
                        padding: '20px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.8)',
                        lineHeight: 1.6,
                    }}>
                        {loadedTranscript}
                    </div>
                </div>
            )}

            {vid.summary && isSummaryVisible && (
                <div style={{ marginTop: '24px', animation: 'fadeInSlideUp 0.3s ease-out forwards' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '24px 0 20px 0' }} />
                    {/* Summary Section Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ color: '#10b981', fontSize: '1rem', fontWeight: 600 }}>
                            ✨ AI Summary
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <ActionButton variant="ghost" onClick={handleCopySummary}>
                                {summaryCopied ? "Copied ✓" : "Copy"}
                            </ActionButton>
                            <ActionButton variant="ghost" onClick={handleDownloadSummary} style={{ transform: isDownloadingSummary ? 'scale(0.95)' : 'none' }}>
                                Download ▼
                            </ActionButton>
                            <ActionButton variant="ghost" onClick={() => setIsSummaryVisible(false)}>
                                Hide
                            </ActionButton>
                        </div>
                    </div>

                    <div className="custom-scrollbar" style={{
                        position: 'relative',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.03)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '24px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: '0.95rem',
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap'
                    }}>
                        {vid.summary}
                    </div>

                    {/* Action below content */}
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                            {vid.modelUsed && (
                                <>
                                    Generated with {vid.modelUsed} {hasOverride && <span style={{ color: '#f59e0b' }}>(Override)</span>}
                                </>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <ActionButton
                                variant="secondary"
                                onClick={() => onOpenSettings(vid.id)}
                                disabled={summarizingVideos.has(vid.id) || vid.status === 'processing'}
                            >
                                Change Settings
                            </ActionButton>
                            <ActionButton
                                variant="primary"
                                onClick={() => onSummarize(vid.id)}
                                disabled={summarizingVideos.has(vid.id) || vid.status === 'processing'}
                            >
                                {summarizingVideos.has(vid.id) || vid.currentStep === 'summarizing' ? 'Summarizing...' : 'Summarize'}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                @keyframes fadeInSlideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .transcript-workspace .transcript-actions {
                    opacity: 0.15;
                    transition: opacity 0.25s ease-in-out;
                }
                .transcript-workspace:hover .transcript-actions,
                .transcript-workspace:focus-within .transcript-actions,
                .transcript-actions:active {
                    opacity: 1;
                }
                @media (max-width: 768px) {
                    .transcript-workspace .transcript-actions {
                        opacity: 1 !important;
                    }
                }
            `}} />
            {/* Replace Confirm Override Modal */}
            {showReplaceConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }}>
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '400px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        animation: 'fadeInSlideUp 0.15s ease-out forwards',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#f97316' }}>
                            Replace existing summary?
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                            This will overwrite the current summary generated by {vid.modelUsed}.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <ActionButton
                                variant="secondary"
                                onClick={() => setShowReplaceConfirm(false)}
                            >
                                Cancel
                            </ActionButton>
                            <ActionButton
                                variant="primary"
                                onClick={() => {
                                    onSummarize(vid.id);
                                    setShowReplaceConfirm(false);
                                }}
                            >
                                Confirm Replace
                            </ActionButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
