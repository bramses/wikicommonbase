'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Entry } from '@/lib/types';

export default function Inbox() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const router = useRouter();
  const ENTRIES_PER_PAGE = 20;

  useEffect(() => {
    fetchUnconnectedEntries();
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMoreEntries();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, page]);

  const fetchUnconnectedEntries = async (pageNumber = 0, append = false) => {
    if (pageNumber === 0) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const url = new URL('/api/entries', window.location.origin);
      url.searchParams.set('limit', ENTRIES_PER_PAGE.toString());
      url.searchParams.set('offset', (pageNumber * ENTRIES_PER_PAGE).toString());

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const allEntries = data.entries;

        // Filter entries that have no joins
        const unconnectedEntries = allEntries.filter(
          (entry: Entry) => entry.metadata.joins.length === 0
        );

        if (append) {
          setEntries(prev => {
            // Deduplicate entries by ID
            const existingIds = new Set(prev.map(entry => entry.id));
            const uniqueNewEntries = unconnectedEntries.filter((entry: Entry) => !existingIds.has(entry.id));
            return [...prev, ...uniqueNewEntries];
          });
        } else {
          setEntries(unconnectedEntries);
        }

        // Check if we should continue loading more
        setHasMore(allEntries.length === ENTRIES_PER_PAGE);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('Error fetching unconnected entries:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreEntries = async () => {
    if (!loadingMore && hasMore) {
      await fetchUnconnectedEntries(page + 1, true);
    }
  };

  const openInJoinPage = (entry: Entry) => {
    // Navigate to join page with this entry as current
    router.push(`/join?current=${entry.id}`);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading inbox...</div>;
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="wide-content space-y-generous">
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2xl)' }}>
          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: '700',
              color: 'var(--foreground)',
              letterSpacing: '-0.02em'
            }}
          >
            Inbox ({entries.length})
          </h1>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--foreground-secondary)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Unconnected highlights - click to join with others
          </div>
        </div>

        {entries.length === 0 && !loading ? (
          <div
            className="text-center card"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2xl)',
              color: 'var(--foreground-secondary)'
            }}
          >
            <h2
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: '600',
                color: 'var(--foreground)',
                marginBottom: 'var(--space-md)'
              }}
            >
              🎉 Inbox Empty!
            </h2>
            <p>All your highlights are connected to others. Great job building connections!</p>
          </div>
        ) : (
          <div className="space-y-comfortable">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="card cursor-pointer transition-all"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-xl)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onClick={() => openInJoinPage(entry)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 'var(--space-lg)' }}>
                  <div className="lg:col-span-2">
                    <p
                      className="text-reading"
                      style={{
                        fontSize: 'var(--text-base)',
                        lineHeight: 'var(--leading-relaxed)',
                        color: 'var(--foreground)',
                        marginBottom: 'var(--space-md)'
                      }}
                    >
                      {entry.data}
                    </p>
                    {entry.metadata.img_url && (
                      <img
                        src={entry.metadata.img_url}
                        alt="Entry image"
                        style={{
                          maxWidth: '20rem',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 'var(--space-md)'
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--foreground-secondary)',
                      fontFamily: 'Inter, sans-serif',
                      minWidth: 0,
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}
                    className="space-y-comfortable"
                  >
                    <div style={{ minWidth: 0, maxWidth: '100%' }}>
                      <div
                        style={{
                          color: 'var(--accent)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: '500',
                          textAlign: 'left',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: 0,
                          whiteSpace: 'normal'
                        }}
                      >
                        {entry.metadata.article}
                        {entry.metadata.section && ` > ${entry.metadata.section}`}
                      </div>
                    </div>
                    <div style={{ color: 'var(--foreground-muted)' }}>
                      Added: {new Date(entry.created_at).toLocaleString()}
                    </div>
                    <div
                      style={{
                        color: 'var(--warning)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: '500',
                        padding: 'var(--space-xs) var(--space-sm)',
                        background: 'var(--warning-soft)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-block'
                      }}
                    >
                      Unconnected
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator for infinite scroll */}
        {loadingMore && (
          <div
            className="text-center"
            style={{
              padding: 'var(--space-2xl)',
              fontSize: 'var(--text-sm)',
              color: 'var(--foreground-secondary)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Loading more entries...
          </div>
        )}

        {/* End of results indicator */}
        {!hasMore && !loading && entries.length > 0 && (
          <div
            className="text-center"
            style={{
              padding: 'var(--space-2xl)',
              fontSize: 'var(--text-sm)',
              color: 'var(--foreground-muted)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            No more entries to load
          </div>
        )}
      </div>
    </div>
  );
}