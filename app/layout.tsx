import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeToggle from './theme-toggle';

// Applied before paint so a stored theme choice doesn't flash the wrong colors.
const themeInit = `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

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
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
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
                <svg viewBox="0 0 32 32" width="20" height="20">
                  <g fill="#ffffff">
                    <rect x="8.5" y="10.1" width="10" height="2.6" rx="1.3" />
                    <rect x="8.5" y="15" width="15" height="2.6" rx="1.3" fillOpacity="0.9" />
                    <rect x="8.5" y="19.9" width="11.5" height="2.6" rx="1.3" fillOpacity="0.9" />
                  </g>
                  <circle cx="21.6" cy="11.4" r="3.1" fill="#0b2e57" />
                  <circle cx="21.6" cy="11.4" r="2.5" fill="#7fe0ff" />
                </svg>
              </span>
              <span className="brand-name">sharetxt</span>
            </a>
            <div className="topbar-right">
              <span className="brand-badge">Ephemeral by design</span>
              <ThemeToggle />
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
