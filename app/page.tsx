'use client';

import { useState, type FormEvent } from 'react';

export default function Home() {
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setUrl(null);
    setCopied(false);
    setBusy(true);
    try {
      const body: Record<string, unknown> = { content };
      if (ttl.trim() !== '') body.ttl_seconds = Number(ttl);
      if (maxViews.trim() !== '') body.max_views = Number(maxViews);

      const res = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Something went wrong');
      } else {
        setUrl(data.url);
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — link is still selectable */
    }
  }

  return (
    <main className="hero">
      <span className="pill">Share text, minus the friction</span>
      <h1 className="hero-title">
        Paste it. Link it. <span className="accent">Share it.</span>
      </h1>
      <p className="hero-sub">
        Drop in any text, set an optional expiry or view limit, and get a link you can share.
        The paste disappears the moment it should.
      </p>

      <section className="card">
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your text here…"
              required
            />
          </div>

          <div className="field grid2">
            <div>
              <label htmlFor="ttl">Expire after</label>
              <input
                id="ttl"
                type="number"
                min={1}
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                placeholder="seconds"
              />
              <span className="hint">Optional — leave blank for no expiry.</span>
            </div>
            <div>
              <label htmlFor="views">Max views</label>
              <input
                id="views"
                type="number"
                min={1}
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
                placeholder="e.g. 5"
              />
              <span className="hint">Optional — leave blank for unlimited.</span>
            </div>
          </div>

          <button className="btn" type="submit" disabled={busy || content.length === 0}>
            {busy ? 'Creating…' : 'Create share link'}
          </button>
        </form>

        {url && (
          <div className="result">
            <span className="result-label">Your link is ready</span>
            <div className="result-row">
              <a className="result-link" href={url}>
                {url}
              </a>
              <button type="button" className="copy-btn" onClick={copy}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </section>

      <p className="foot">No account. No tracking. Just a link.</p>
    </main>
  );
}
