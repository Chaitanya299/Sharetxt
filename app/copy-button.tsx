'use client';

import { useState } from 'react';

export default function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — text is still selectable on the page */
    }
  }

  return (
    <button type="button" className="copy-btn" onClick={copy}>
      {copied ? 'Copied' : label}
    </button>
  );
}
