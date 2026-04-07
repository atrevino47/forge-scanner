'use client';

import { useState, useRef } from 'react';

export default function TestScreenshot() {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'full' | 'fast'>('full');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ time: string; title: string; finalUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function capture() {
    if (!url) return;
    setLoading(true);
    setError(null);
    setImgSrc(null);
    setMeta(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const params = new URLSearchParams({ url, mode, viewport });
      const res = await fetch(`/api/test-screenshot?${params}`, {
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setImgSrc(objectUrl);
      setMeta({
        time: res.headers.get('X-Capture-Time') ?? '?',
        title: decodeURIComponent(res.headers.get('X-Page-Title') ?? ''),
        finalUrl: decodeURIComponent(res.headers.get('X-Final-URL') ?? ''),
      });
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Screenshot Test Harness</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value.trim())}
          onKeyDown={(e) => e.key === 'Enter' && capture()}
          style={{
            flex: 1, minWidth: 300, padding: '8px 12px',
            border: '1px solid #ccc', borderRadius: 6, fontSize: 14,
          }}
        />
        <select value={mode} onChange={(e) => setMode(e.target.value as 'full' | 'fast')}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}>
          <option value="full">full (patient visitor)</option>
          <option value="fast">fast</option>
        </select>
        <select value={viewport} onChange={(e) => setViewport(e.target.value as 'desktop' | 'mobile')}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}>
          <option value="desktop">desktop</option>
          <option value="mobile">mobile</option>
        </select>
        <button
          onClick={capture}
          disabled={loading || !url}
          style={{
            padding: '8px 20px', borderRadius: 6, border: 'none',
            background: loading ? '#999' : '#E8530E', color: 'white',
            cursor: loading ? 'wait' : 'pointer', fontWeight: 600,
          }}
        >
          {loading ? 'Capturing...' : 'Capture'}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fee', border: '1px solid #f99', borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {meta && (
        <div style={{ padding: 12, background: '#f5f5f0', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          <strong>{meta.time}</strong> &middot; {meta.title} &middot; <code>{meta.finalUrl}</code>
        </div>
      )}

      {imgSrc && (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
          <img src={imgSrc} alt="Screenshot" style={{ width: '100%', display: 'block' }} />
        </div>
      )}
    </div>
  );
}
