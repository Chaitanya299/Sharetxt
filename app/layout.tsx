import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Sharetxt',
  description: 'Create and share text with a link — with optional expiry and view limits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="page">
          {/* Decorative molecular/hex motif — faint, purely aesthetic. */}
          <svg className="bg-decor" viewBox="0 0 560 320" aria-hidden="true">
            <g fill="none" stroke="var(--brand-soft)" strokeWidth="1.4">
              <path d="M120 40 l52 30 l0 60 l-52 30 l-52 -30 l0 -60 Z" />
              <path d="M224 100 l52 30 l0 60 l-52 30 l-52 -30 l0 -60 Z" />
              <path d="M328 40 l52 30 l0 60 l-52 30 l-52 -30 l0 -60 Z" />
              <path d="M432 100 l52 30 l0 60 l-52 30 l-52 -30 l0 -60 Z" />
            </g>
            <g fill="var(--brand-soft)">
              <circle cx="120" cy="40" r="4" />
              <circle cx="224" cy="100" r="4" />
              <circle cx="328" cy="40" r="4" />
              <circle cx="432" cy="100" r="4" />
              <circle cx="276" cy="190" r="4" />
              <circle cx="380" cy="190" r="4" />
            </g>
          </svg>

          <header className="topbar">
            <a className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M9 12h6M8.5 8.5H7a4.5 4.5 0 0 0 0 9h1.5M15.5 8.5H17a4.5 4.5 0 0 1 0 9h-1.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="brand-name">sharetxt</span>
            </a>
            <span className="brand-badge">Ephemeral by design</span>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
