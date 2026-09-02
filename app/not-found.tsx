// Rendered (HTTP 404) for any unavailable paste — expired, view-limit reached,
// or never existed — and for unknown routes. Clear, styled error messaging.
export default function NotFound() {
  return (
    <main className="hero">
      <span className="pill">Unavailable</span>
      <h1 className="hero-title">This paste isn&rsquo;t here.</h1>
      <p className="hero-sub">
        It may have expired, reached its view limit, or never existed. Shared pastes are
        ephemeral by design.
      </p>

      <section className="card">
        <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 15 }}>
          Double-check the link you were given, or create a fresh one to share.
        </p>
      </section>

      <p className="foot">
        <a href="/">Create a new share link →</a>
      </p>
    </main>
  );
}
