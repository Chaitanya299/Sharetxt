import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { peekPaste, effectiveNow } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// HTML view. Renders content safely (React auto-escapes → no script execution).
// Unavailable → notFound() (HTTP 404). Does not consume a view.
export default async function PastePage({ params }: { params: { id: string } }) {
  const content = await peekPaste(params.id, effectiveNow(headers()));
  if (content === null) notFound();

  return (
    <main className="hero">
      <span className="pill">Shared paste</span>
      <h1 className="hero-title">Here it is.</h1>
      <p className="hero-sub">Someone shared this text with you via Sharetxt.</p>

      <section className="card">
        <pre className="paste">{content}</pre>
      </section>

      <p className="foot">
        <a href="/">Create your own share link →</a>
      </p>
    </main>
  );
}
