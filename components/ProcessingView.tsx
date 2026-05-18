import { useEffect, useState } from 'react';
import Card from './Card';
import VideoCard from './VideoCard';

import ModelSelector from './ModelSelector';
import Textarea from './Textarea';
import { MODEL_GROUPS } from '@/lib/constants';

interface ProcessingViewProps {
    playlistId: string;
    model: string;
    apiKey: string;
    customPrompt: string;
}

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
    createdAt?: string;
    summary?: string | null;
    modelUsed?: string | null;
}

interface PlaylistStatus {
    title?: string;
    status: string;
    processedVideos: number;
    totalVideos: number;
    videos: VideoMetadata[];
}

export default function ProcessingView({ playlistId, model, apiKey, customPrompt }: ProcessingViewProps) {
    const [data, setData] = useState<PlaylistStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    // UI Local Tracking States
    const [checkingVideos, setCheckingVideos] = useState<Set<string>>(new Set());
    const [fetchingTranscripts, setFetchingTranscripts] = useState<Set<string>>(new Set());
    const [loadedTranscripts, setLoadedTranscripts] = useState<Record<string, string>>({});
    const [loadingTranscriptBytes, setLoadingTranscriptBytes] = useState<Set<string>>(new Set());
    const [summarizingVideos, setSummarizingVideos] = useState<Set<string>>(new Set());
    const [isCheckingAll, setIsCheckingAll] = useState(false);
    const [isFetchingAll, setIsFetchingAll] = useState(false);
    const [isSummarizingAll, setIsSummarizingAll] = useState(false);
    const [globalProgress, setGlobalProgress] = useState<{ done: number, total: number, label: string } | null>(null);

    // Unified Summarization States
    const [globalSettings, setGlobalSettings] = useState({
        model,
        finalModel: '',
        prompt: customPrompt
    });
    const [videoOverrides, setVideoOverrides] = useState<Record<string, { model: string, finalModel: string, prompt: string }>>({});

    // Settings Modal State
    const [settingsModalContext, setSettingsModalContext] = useState<string | null>(null); // videoId
    const [modalModel, setModalModel] = useState("");
    const [modalFinalModel, setModalFinalModel] = useState("");
    const [modalPrompt, setModalPrompt] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [modalSetAsDefault, setModalSetAsDefault] = useState(false);
    const [showSettingsTooltip, setShowSettingsTooltip] = useState(false);

    const openSettingsModal = (videoId: string) => {
        setSettingsModalContext(videoId);
        setShowSettingsTooltip(false);
        const override = videoOverrides[videoId];
        if (override) {
            setModalModel(override.model);
            setModalFinalModel(override.finalModel || '');
            setModalPrompt(override.prompt);
            setModalSetAsDefault(false);
        } else {
            setModalModel(globalSettings.model);
            setModalFinalModel(globalSettings.finalModel || '');
            setModalPrompt(globalSettings.prompt);
            setModalSetAsDefault(true);
        }
    };

    const saveSettings = () => {
        if (!settingsModalContext) return;

        if (modalSetAsDefault) {
            setGlobalSettings({
                model: modalModel,
                finalModel: modalFinalModel,
                prompt: modalPrompt
            });
            setVideoOverrides(prev => {
                const next = { ...prev };
                delete next[settingsModalContext];
                return next;
            });
        } else {
            setVideoOverrides(prev => ({
                ...prev,
                [settingsModalContext]: {
                    model: modalModel,
                    finalModel: modalFinalModel,
                    prompt: modalPrompt
                }
            }));
        }

        setShowSettingsTooltip(true);
        setTimeout(() => {
            setSettingsModalContext(null);
            setShowSettingsTooltip(false);
        }, 2000);
    };

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/playlist/${playlistId}`);
                if (!res.ok) {
                    throw new Error('Failed to fetch playlist status');
                }
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);

        return () => clearInterval(interval);
    }, [playlistId]);

    const handleCheckCaptions = async (id: string) => {
        setCheckingVideos(prev => new Set(prev).add(id));
        try {
            await fetch(`/api/video/${id}/check-captions`, { method: 'POST' });
        } catch (e) {
            console.error("Failed caption check natively", e);
        } finally {
            setCheckingVideos(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleCheckAll = async () => {
        if (!data) return;
        setIsCheckingAll(true);
        const pending = data.videos.filter(v => v.status === 'pending');
        setGlobalProgress({ done: 0, total: pending.length, label: 'Checking Captions' });

        let done = 0;
        for (const vid of pending) {
            await handleCheckCaptions(vid.id);
            done++;
            setGlobalProgress({ done, total: pending.length, label: 'Checking Captions' });
        }
        setIsCheckingAll(false);
        setGlobalProgress(null);
    };

    const handleFetchAllTranscripts = async () => {
        if (!data) return;
        setIsFetchingAll(true);
        // Find videos that have captions but no transcript yet
        const fetchable = data.videos.filter(v => v.status !== 'pending' && !v.hasTranscript && v.currentStep !== 'download');
        setGlobalProgress({ done: 0, total: fetchable.length, label: 'Fetching Transcripts' });

        let done = 0;
        for (const vid of fetchable) {
            if (vid.status === 'no_captions') {
                await handleWhisperTranscribe(vid.id);
            } else {
                await handleFetchTranscript(vid.id);
            }
            done++;
            setGlobalProgress({ done, total: fetchable.length, label: 'Fetching Transcripts' });
        }
        setIsFetchingAll(false);
        setGlobalProgress(null);
    };

    const handleSummarizeAll = async () => {
        if (!data) return;
        setIsSummarizingAll(true);
        const summarizable = data.videos.filter(v => v.hasTranscript && !v.summary && v.status !== 'processing');
        setGlobalProgress({ done: 0, total: summarizable.length, label: 'Generating Summaries' });

        let done = 0;
        for (const vid of summarizable) {
            await handleSummarize(vid.id);
            done++;
            setGlobalProgress({ done, total: summarizable.length, label: 'Generating Summaries' });
        }
        setIsSummarizingAll(false);
        setGlobalProgress(null);
    };

    const handleSummarize = async (id: string) => {
        setSummarizingVideos(prev => new Set(prev).add(id));

        // 6. Resolution Priority (Deterministic)
        // 1. If videoOverrides[videoId] exists -> use it
        // 2. Else -> use globalSettings
        const config = videoOverrides[id] || globalSettings;

        try {
            await fetch(`/api/video/${id}/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: config.model, finalModel: config.finalModel, customPrompt: config.prompt, apiKey })
            });
            // Polling handles subsequent state updates natively
        } catch (e) {
            console.error("Summarization call failed", e);
        } finally {
            setSummarizingVideos(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleFetchTranscript = async (id: string) => {
        setFetchingTranscripts(prev => new Set(prev).add(id));
        try {
            const res = await fetch(`/api/video/${id}/fetch-transcript`, { method: 'POST' });
            const json = await res.json();
            if (json.transcript) {
                setLoadedTranscripts(prev => ({ ...prev, [id]: json.transcript }));
            }
        } catch (e) {
            console.error("Failed transcript fetch", e);
        } finally {
            setFetchingTranscripts(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleWhisperTranscribe = async (id: string) => {
        setFetchingTranscripts(prev => new Set(prev).add(id));
        try {
            const res = await fetch(`/api/video/${id}/whisper-transcribe`, { method: 'POST' });
            const json = await res.json();
            if (json.transcript) {
                setLoadedTranscripts(prev => ({ ...prev, [id]: json.transcript }));
            }
        } catch (e) {
            console.error("Failed whisper transcription", e);
        } finally {
            setFetchingTranscripts(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const loadTranscript = async (id: string, hasTranscript: boolean) => {
        if (loadedTranscripts[id] !== undefined || !hasTranscript) return;
        setLoadingTranscriptBytes(prev => new Set(prev).add(id));
        try {
            const res = await fetch(`/api/video/${id}/transcript`);
            const json = await res.json();
            setLoadedTranscripts(prev => ({ ...prev, [id]: json.transcript || "No transcript saved." }));
        } catch (e) {
            setLoadedTranscripts(prev => ({ ...prev, [id]: "Failed to load textual context locally." }));
        } finally {
            setLoadingTranscriptBytes(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const downloadTranscript = (id: string, title: string) => {
        const text = loadedTranscripts[id];
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30)}_transcript.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (error) {
        return <div style={{ color: 'red', marginTop: '20px', textAlign: 'center' }}>Error: {error}</div>;
    }

    if (!data) {
        return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--muted)' }}>Loading playlist details...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.6rem', color: '#fff' }}>
                                    {data.title ? `Playlist: ${data.title}` : 'YouTube Playlist'}
                                </h3>
                                <span style={{
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: 'var(--primary)',
                                    padding: '4px 10px',
                                    borderRadius: '16px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {data.status === 'processing' ? 'Initializing' : data.status}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.95rem', color: 'var(--muted)' }}>
                                <span><strong style={{ color: 'var(--foreground)' }}>Total Videos:</strong> {data.totalVideos}</span>
                                <span>&bull;</span>
                                <span>Default Model: <span style={{ color: 'var(--foreground)' }}>{globalSettings.model}</span></span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {data.videos.some(v => v.status === 'pending') && (
                                <button
                                    onClick={handleCheckAll}
                                    disabled={isCheckingAll || isFetchingAll || isSummarizingAll}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: '#fff',
                                        fontWeight: 600,
                                        border: '1px solid var(--border)',
                                        cursor: (isCheckingAll || isFetchingAll || isSummarizingAll) ? 'not-allowed' : 'pointer',
                                        opacity: (isCheckingAll || isFetchingAll || isSummarizingAll) ? 0.5 : 1,
                                    }}
                                >
                                    Check Captions For All
                                </button>
                            )}
                            {data.videos.some(v => v.status !== 'pending' && !v.hasTranscript && v.currentStep !== 'download') && (
                                <button
                                    onClick={handleFetchAllTranscripts}
                                    disabled={isCheckingAll || isFetchingAll || isSummarizingAll}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        background: 'var(--primary)',
                                        color: '#fff',
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: (isCheckingAll || isFetchingAll || isSummarizingAll) ? 'not-allowed' : 'pointer',
                                        opacity: (isCheckingAll || isFetchingAll || isSummarizingAll) ? 0.6 : 1,
                                    }}
                                >
                                    Fetch Transcripts For All
                                </button>
                            )}
                            {data.videos.some(v => v.hasTranscript && !v.summary && v.status !== 'processing') && (
                                <button
                                    onClick={handleSummarizeAll}
                                    disabled={isCheckingAll || isFetchingAll || isSummarizingAll}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        background: '#10b981',
                                        color: '#fff',
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: (isCheckingAll || isFetchingAll || isSummarizingAll) ? 'not-allowed' : 'pointer',
                                        opacity: (isCheckingAll || isFetchingAll || isSummarizingAll) ? 0.6 : 1,
                                        boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)'
                                    }}
                                >
                                    Summarize All
                                </button>
                            )}
                            
                            {/* ZIP Export Buttons */}
                            {data.videos.some(v => v.hasTranscript) && (
                                <button
                                    onClick={() => window.location.href = `/api/playlist/${playlistId}/download-zip?type=transcripts`}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        background: 'rgba(168, 85, 247, 0.15)',
                                        color: '#c084fc',
                                        fontWeight: 600,
                                        border: '1px solid rgba(168, 85, 247, 0.3)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    🗂️ ZIP Transcripts
                                </button>
                            )}
                            {data.videos.some(v => v.summary) && (
                                <button
                                    onClick={() => window.location.href = `/api/playlist/${playlistId}/download-zip?type=summaries`}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        color: '#10b981',
                                        fontWeight: 600,
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    🗂️ ZIP Summaries
                                </button>
                            )}
                        </div>
                    </div>

                    {globalProgress && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(59, 130, 246, 0.05)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                            <div style={{ width: '16px', height: '16px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 500 }}>
                                {globalProgress.label}... ({globalProgress.done} / {globalProgress.total} processed)
                            </span>
                        </div>
                    )}
                </div>
            </Card>

            <div>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--muted)' }}>Video Queue</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {data.videos.map((vid, i) => (
                        <VideoCard
                            key={vid.id}
                            vid={vid}
                            index={i}
                            checkingVideos={checkingVideos}
                            fetchingTranscripts={fetchingTranscripts}
                            loadingTranscriptBytes={loadingTranscriptBytes}
                            summarizingVideos={summarizingVideos}
                            loadedTranscript={loadedTranscripts[vid.id]}
                            onCheckCaptions={handleCheckCaptions}
                            onFetchTranscript={handleFetchTranscript}
                            onWhisperTranscribe={handleWhisperTranscribe}
                            onLoadTranscript={loadTranscript}
                            onDownloadTranscript={downloadTranscript}
                            onSummarize={handleSummarize}
                            onOpenSettings={openSettingsModal}
                            hasOverride={!!videoOverrides[vid.id]}
                        />
                    ))}
                </div>
            </div>

            {/* Unified Settings Modal */}
            {settingsModalContext && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    animation: 'fadeInSlideUp 0.2s ease-out forwards',
                }}>
                    <div style={{
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '32px',
                        width: '100%',
                        maxWidth: '540px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        position: 'relative'
                    }}>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '1.4rem' }}>Summarization Settings</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <ModelSelector
                                label="Target Model"
                                value={modalModel}
                                onChange={setModalModel}
                                groups={MODEL_GROUPS}
                            />

                            <Textarea
                                label="Execution Prompt"
                                value={modalPrompt}
                                onChange={e => setModalPrompt(e.target.value)}
                            />

                            <div>
                                <button 
                                    onClick={() => setShowAdvanced(!showAdvanced)} 
                                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.9rem', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                                >
                                    {showAdvanced ? '▼ Hide Advanced Settings' : '▶ Show Advanced Settings'}
                                </button>
                                
                                {showAdvanced && (
                                    <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <ModelSelector
                                            label="Master Model (For final summary of chunks)"
                                            value={modalFinalModel || modalModel}
                                            onChange={setModalFinalModel}
                                            groups={MODEL_GROUPS}
                                        />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '8px' }}>
                                            Used only if the transcript is too large and needs chunking. Defaults to target model.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                                <input
                                    type="checkbox"
                                    checked={modalSetAsDefault}
                                    onChange={e => setModalSetAsDefault(e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                />
                                Set as default for upcoming videos
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                            {showSettingsTooltip && (
                                <span style={{ marginRight: 'auto', alignSelf: 'center', fontSize: '0.85rem', color: '#10b981', fontWeight: 500, animation: 'fadeInSlideUp 0.15s ease-out' }}>
                                    Settings updated. Click Summarize to apply.
                                </span>
                            )}
                            <button
                                onClick={() => setSettingsModalContext(null)}
                                style={{
                                    padding: '0 20px',
                                    height: '44px',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.7)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSettings}
                                disabled={showSettingsTooltip}
                                style={{
                                    padding: '0 20px',
                                    height: '44px',
                                    borderRadius: '8px',
                                    background: 'var(--primary)',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: showSettingsTooltip ? 'default' : 'pointer',
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                    opacity: showSettingsTooltip ? 0.7 : 1
                                }}
                            >
                                {showSettingsTooltip ? 'Saved' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
