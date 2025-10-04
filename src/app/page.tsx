import Link from "next/link";

export default function Home() {
  return (
    <div
      className="min-h-screen animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, var(--background) 0%, var(--surface) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="page-content space-y-generous">
        <div className="space-y-comfortable">
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '700',
              color: 'var(--foreground)',
              letterSpacing: '-0.03em',
              marginBottom: 'var(--space-xl)'
            }}
          >
            Wikipedia Commonbase
          </h1>
          <p
            style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--foreground-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              maxWidth: '600px',
              margin: '0 auto var(--space-2xl)'
            }}
          >
            A distraction-free Wikipedia reading experience with highlighting and connection features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">📖 Distraction-Free Reader</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Navigate Wikipedia articles sentence by sentence with keyboard controls.
              Highlight interesting passages and paragraphs as you read.
            </p>
            <Link
              href="/reader"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Reading
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">📥 Inbox</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Review unconnected highlights and join them with related content.
              Keep your knowledge graph organized and connected.
            </p>
            <Link
              href="/inbox"
              className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              View Inbox
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">🔗 Join Highlights</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect related highlights using semantic search. Build a web of
              knowledge by joining passages that share common themes or ideas.
            </p>
            <Link
              href="/join"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Join Highlights
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">📚 Highlight Ledger</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              View all your saved highlights in a searchable table. Group by article
              and section, or browse chronologically.
            </p>
            <Link
              href="/ledger"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Ledger
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">🕸️ Knowledge Graph</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Visualize your highlights and their connections in an interactive graph.
              Explore the relationships between different concepts and ideas.
            </p>
            <Link
              href="/graph"
              className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Explore Graph
            </Link>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-4">Getting Started</h3>
          <div className="max-w-2xl mx-auto text-left space-y-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
              <p>Press <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">R</kbd> in the reader to load a random Wikipedia article</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
              <p>Use <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">↑↓</kbd> to navigate sentences, <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">S</kbd> to highlight sentences, <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">P</kbd> to highlight paragraphs</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</span>
              <p>Visit the Join page to connect related highlights using semantic search</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">4</span>
              <p>Explore your knowledge graph to discover unexpected connections</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
