'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import ModelSelector from '@/components/ModelSelector';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Textarea from '@/components/Textarea';
import ProcessingView from '@/components/ProcessingView';
import { MODEL_CONTEXT_LIMITS, MODEL_GROUPS } from '@/lib/constants';

export default function Home() {
  const [model, setModel] = useState('google/gemma-3-12b-it:free');
  const [apiKey, setApiKey] = useState('');
  const [keyStatus, setKeyStatus] = useState<'none' | 'testing' | 'error' | 'success'>('none');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [prompt, setPrompt] = useState('Summarize the following transcript into clear, structured notes with headings and bullet points.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null);
  const [topError, setTopError] = useState<string | null>(null);

  const [keyErrorMsg, setKeyErrorMsg] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    if (isProcessing && createdPlaylistId) {
      window.dispatchEvent(new CustomEvent('showNavbarControls'));
    } else {
      window.dispatchEvent(new CustomEvent('hideNavbarControls'));
    }
  }, [isProcessing, createdPlaylistId]);

  // Catch Navbar CustomEvents
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettingsModal(true);
    };
    const handleOpenPlaylist = () => {
      setIsProcessing(false);
      setCreatedPlaylistId(null);
      setPlaylistUrl('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('openGlobalSettings', handleOpenSettings);
    window.addEventListener('openChangePlaylist', handleOpenPlaylist);

    return () => {
      window.removeEventListener('openGlobalSettings', handleOpenSettings);
      window.removeEventListener('openChangePlaylist', handleOpenPlaylist);
    };
  }, []);

  const handleTestKey = async () => {
    if (!apiKey) return;
    setKeyStatus('testing');
    setKeyErrorMsg('');

    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, apiKey })
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setKeyStatus('success');
      } else {
        setKeyStatus('error');
        setKeyErrorMsg(data.error || 'Invalid API Key');
      }
    } catch (err) {
      setKeyStatus('error');
      setKeyErrorMsg('Network error validating key');
    }
  };

  const handleStartProcessing = async () => {
    setTopError(null);

    // Verify validation one more time just for safety, though UI locks it
    if (keyStatus !== 'success' || !apiKey) {
      setTopError("API key required and must be validated");
      return;
    }

    try {
      const res = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistUrl,
          model,
          customPrompt: prompt
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setTopError(data.error || 'Failed to initialize playlist');
        return;
      }

      if (data.playlistId) {
        setCreatedPlaylistId(data.playlistId);
        setIsProcessing(true);
      }
    } catch (err: any) {
      setTopError('Network error starting process');
    }
  };

  const isFormValid = keyStatus === 'success' && playlistUrl.trim().length > 0;

  // Placeholder static threshold evaluation for Phase 5.5 warning UI.
  // Phase 6 will dynamically calculate token chunks.
  const isContextTooSmall = (MODEL_CONTEXT_LIMITS[model] ?? 33000) < 30000 && model !== 'google/gemma-3-27b-it:free';

  if (isProcessing && createdPlaylistId) {
    return (
      <>
        <main style={{ paddingBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px', marginTop: '24px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              margin: '0 0 16px 0',
              background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              Analyzing Playlist
            </h2>
          </div>
          <ProcessingView playlistId={createdPlaylistId} model={model} apiKey={apiKey} customPrompt={prompt} />
        </main>

        {showSettingsModal && (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Global Summarization Settings</h3>
                <button onClick={() => setShowSettingsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                <ModelSelector
                  label="Default Model (via OpenRouter)"
                  value={model}
                  onChange={(val) => setModel(val)}
                  groups={MODEL_GROUPS}
                />

                {isContextTooSmall && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                    Wait, context too small logic applies securely.
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <Input
                        label="OpenRouter API Key"
                        type="password"
                        placeholder="Enter API key"
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setKeyStatus('none');
                        }}
                      />
                    </div>
                    <Button variant="secondary" onClick={handleTestKey} disabled={!apiKey || keyStatus === 'testing'} style={{ height: '46px' }}>
                      {keyStatus === 'testing' ? 'Testing...' : 'Test Key'}
                    </Button>
                  </div>
                  <div style={{ marginTop: '8px', minHeight: '20px' }}>
                    {keyStatus === 'error' && <span style={{ color: 'red', fontSize: '0.85rem' }}>{keyErrorMsg}</span>}
                    {keyStatus === 'success' && <span style={{ color: 'green', fontSize: '0.85rem' }}>API Key is valid.</span>}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                  <Textarea
                    label="Default Summarization Prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => setShowSettingsModal(false)}>Save & Close</Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <main style={{ paddingBottom: '60px' }}>
      {topError && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgb(239, 68, 68)',
          color: 'rgb(239, 68, 68)',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontWeight: 500
        }}>
          {topError}
        </div>
      )}

      {/* Title Block */}
      <div style={{ textAlign: 'center', marginBottom: '48px', marginTop: '24px' }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          margin: '0 0 16px 0',
          background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Create Playlist Summary
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '1.15rem', margin: 0, fontWeight: 500 }}>
          Convert a YouTube playlist into structured summaries.
        </p>
      </div>

      <Card style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '1.4rem' }}>Global Summarization Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ModelSelector
            label="Default Model (via OpenRouter)"
            value={model}
            onChange={(val) => setModel(val)}
            groups={MODEL_GROUPS}
          />

          {isContextTooSmall && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(249, 115, 22, 0.2)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
              Wait, context too small logic applies securely.
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="OpenRouter API Key"
                  type="password"
                  placeholder="Enter API key"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setKeyStatus('none');
                  }}
                />
              </div>
              <Button variant="secondary" onClick={handleTestKey} disabled={!apiKey || keyStatus === 'testing'} style={{ height: '46px' }}>
                {keyStatus === 'testing' ? 'Testing...' : 'Test Key'}
              </Button>
            </div>
            <div style={{ marginTop: '8px', minHeight: '20px' }}>
              {keyStatus === 'error' && <span style={{ color: 'red', fontSize: '0.85rem' }}>{keyErrorMsg}</span>}
              {keyStatus === 'success' && <span style={{ color: 'green', fontSize: '0.85rem' }}>API Key is valid.</span>}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <Textarea
              label="Default Summarization Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {keyStatus === 'success' && (
        <Card style={{ marginBottom: '32px', animation: 'fadeInSlideUp 0.3s ease-out forwards' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.4rem' }}>Load YouTube Playlist</h3>
          <Input
            placeholder="https://www.youtube.com/playlist?list=..."
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            style={{ height: '52px', marginBottom: '24px', fontSize: '1.05rem' }}
          />
          <Button
            onClick={handleStartProcessing}
            disabled={!isFormValid}
            style={{ width: '100%', height: '52px', fontSize: '1.15rem' }}
          >
            Load Playlist
          </Button>
        </Card>
      )}

      {/* Limits Info Block */}
      <div style={{ backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: 'var(--muted)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Limits
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>Max 30 videos per playlist</li>
          <li>Only videos with captions will be summarized</li>
          <li>Uses OpenRouter models</li>
          <li>Free models may have rate limits</li>
        </ul>
      </div>
    </main>
  );
}
