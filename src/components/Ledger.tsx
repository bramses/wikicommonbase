'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { Entry } from '@/lib/types';

export default function Ledger() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Entry[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [groupByArticleSection, setGroupByArticleSection] = useState(true);
  const [joinedEntriesCache, setJoinedEntriesCache] = useState<Record<string, Entry[]>>({});
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const ENTRIES_PER_PAGE = 20;

  useEffect(() => {
    // Reset state when switching modes
    setEntries([]);
    setGrouped({});
    setPage(0);
    setHasMore(true);
    fetchEntries();
  }, [groupByArticleSection]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 // Load more when 1000px from bottom
      ) {
        loadMoreEntries();
      }
    };

    // Add scroll listener for both modes
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [groupByArticleSection, loadingMore, hasMore, page]);

  const fetchEntries = async (pageNumber = 0, append = false) => {
    if (pageNumber === 0) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const url = new URL('/api/entries', window.location.origin);
      if (groupByArticleSection) {
        url.searchParams.set('groupBy', 'article-section');
        url.searchParams.set('limit', ENTRIES_PER_PAGE.toString());
        url.searchParams.set('offset', (pageNumber * ENTRIES_PER_PAGE).toString());
      } else {
        url.searchParams.set('limit', ENTRIES_PER_PAGE.toString());
        url.searchParams.set('offset', (pageNumber * ENTRIES_PER_PAGE).toString());
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (groupByArticleSection) {
          if (append) {
            setGrouped(prev => {
              const newGrouped = { ...prev };
              Object.entries(data.grouped).forEach(([key, entries]) => {
                if (newGrouped[key]) {
                  // Deduplicate entries in each group
                  const existingIds = new Set(newGrouped[key].map(entry => entry.id));
                  const uniqueNewEntries = entries.filter(entry => !existingIds.has(entry.id));
                  newGrouped[key] = [...newGrouped[key], ...uniqueNewEntries];
                } else {
                  newGrouped[key] = entries;
                }
              });
              return newGrouped;
            });
          } else {
            setGrouped(data.grouped);
          }
          setEntries([]);
          // Check if we have more data for grouped mode
          const totalEntries = Object.values(data.grouped).flat().length;
          setHasMore(totalEntries === ENTRIES_PER_PAGE);
          setPage(pageNumber);
        } else {
          const newEntries = data.entries;
          if (append) {
            setEntries(prev => {
              // Deduplicate entries by ID
              const existingIds = new Set(prev.map(entry => entry.id));
              const uniqueNewEntries = newEntries.filter(entry => !existingIds.has(entry.id));
              return [...prev, ...uniqueNewEntries];
            });
          } else {
            setEntries(newEntries);
          }
          setHasMore(newEntries.length === ENTRIES_PER_PAGE);
          setPage(pageNumber);
        }
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreEntries = async () => {
    if (!loadingMore && hasMore) {
      await fetchEntries(page + 1, true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const openInReader = (entry: Entry) => {
    const params = new URLSearchParams({
      article: entry.metadata.article,
      highlight: entry.data,
      scrollToHighlight: 'true'
    });
    window.open(`/reader?${params.toString()}`, '_blank');
  };

  const fetchJoinedEntries = async (joinIds: string[]): Promise<Entry[]> => {
    try {
      const promises = joinIds.map(async (id) => {
        if (joinedEntriesCache[id]) {
          return joinedEntriesCache[id][0];
        }

        const response = await fetch(`/api/entries/${id}`);
        if (response.ok) {
          const { entry } = await response.json();
          return entry;
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validEntries = results.filter(Boolean);

      // Update cache
      const newCache = { ...joinedEntriesCache };
      validEntries.forEach(entry => {
        newCache[entry.id] = [entry];
      });
      setJoinedEntriesCache(newCache);

      return validEntries;
    } catch (error) {
      console.error('Error fetching joined entries:', error);
      return [];
    }
  };

  const exportToMarkdown = (entries: Entry[], title: string) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString();
    };

    let markdown = `# ${title}\n\n`;

    entries.forEach((entry) => {
      markdown += `## ${entry.metadata.article}`;
      if (entry.metadata.section) {
        markdown += ` > ${entry.metadata.section}`;
      }
      markdown += `\n\n`;

      markdown += `${entry.data}\n\n`;

      if (entry.metadata.img_url) {
        markdown += `![Entry image](${entry.metadata.img_url})\n\n`;
      }

      markdown += `*Added: ${formatDate(entry.created_at)}*\n\n`;

      if (entry.metadata.joins.length > 0) {
        markdown += `*Connected to ${entry.metadata.joins.length} other highlight${entry.metadata.joins.length !== 1 ? 's' : ''}*\n\n`;
      }

      markdown += `---\n\n`;
    });

    return markdown;
  };

  const exportSectionToMarkdown = (sectionKey: string, sectionEntries: Entry[]) => {
    const markdown = exportToMarkdown(sectionEntries, sectionKey);

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sectionKey.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAllToMarkdown = () => {
    let allEntries: Entry[] = [];
    let title = 'Highlight Ledger';

    if (groupByArticleSection) {
      // Flatten all grouped entries
      allEntries = Object.values(grouped).flat();
      title = 'Highlight Ledger - Grouped by Article & Section';
    } else {
      allEntries = entries;
      title = 'Highlight Ledger - Chronological';
    }

    const markdown = exportToMarkdown(allEntries, title);

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'highlight_ledger.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scrollToEntry = (entryId: string) => {
    const element = entryRefs.current[entryId];
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // Add a subtle highlight effect
      element.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
      setTimeout(() => {
        element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
      }, 2000);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading ledger...</div>;
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
            Highlight Ledger
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={exportAllToMarkdown}
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--foreground-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-elevated)';
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--foreground-secondary)';
              }}
            >
              Export to Markdown
            </button>
            <label
              className="flex items-center"
              style={{
                gap: 'var(--space-sm)',
                fontSize: 'var(--text-sm)',
                color: 'var(--foreground-secondary)',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <input
                type="checkbox"
                checked={groupByArticleSection}
                onChange={(e) => setGroupByArticleSection(e.target.checked)}
                style={{
                  width: '1rem',
                  height: '1rem',
                  accentColor: 'var(--accent)'
                }}
              />
              Group by Article - Section
            </label>
          </div>
        </div>

      {groupByArticleSection ? (
        <div className="space-y-generous">
          {Object.entries(grouped).map(([key, groupEntries]) => (
            <div
              key={key}
              className="card"
              style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-2xl)'
              }}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-xl)' }}>
                <h2
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: '600',
                    color: 'var(--foreground)',
                    margin: 0
                  }}
                >
                  {key}
                </h2>
                <button
                  onClick={() => exportSectionToMarkdown(key, groupEntries)}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--foreground-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-elevated)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--foreground-secondary)';
                  }}
                >
                  Export Section
                </button>
              </div>
              <div className="space-y-comfortable">
                {groupEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onOpen={openInReader}
                    onScrollToEntry={scrollToEntry}
                    fetchJoinedEntries={fetchJoinedEntries}
                    ref={(el) => entryRefs.current[entry.id] = el}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-comfortable">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onOpen={openInReader}
              onScrollToEntry={scrollToEntry}
              fetchJoinedEntries={fetchJoinedEntries}
              ref={(el) => entryRefs.current[entry.id] = el}
            />
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
      {!hasMore && !loading && (entries.length > 0 || Object.keys(grouped).length > 0) && (
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

interface EntryCardProps {
  entry: Entry;
  onOpen: (entry: Entry) => void;
  onScrollToEntry: (entryId: string) => void;
  fetchJoinedEntries: (joinIds: string[]) => Promise<Entry[]>;
}

const EntryCard = forwardRef<HTMLDivElement, EntryCardProps>(
  ({ entry, onOpen, onScrollToEntry, fetchJoinedEntries }, ref) => {
    const [joinedEntries, setJoinedEntries] = useState<Entry[]>([]);
    const [showJoinedDetails, setShowJoinedDetails] = useState(false);

    const loadJoinedEntries = async () => {
      if (entry.metadata.joins.length > 0 && joinedEntries.length === 0) {
        const entries = await fetchJoinedEntries(entry.metadata.joins);
        setJoinedEntries(entries);
      }
      setShowJoinedDetails(!showJoinedDetails);
    };

    return (
      <div
        ref={ref}
        className="card transition-all"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-xl)',
          boxShadow: 'var(--shadow-sm)'
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
              <button
                onClick={() => onOpen(entry)}
                style={{
                  color: 'var(--accent)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  whiteSpace: 'normal'
                }}
                className="hover:underline"
              >
                {entry.metadata.article}
                {entry.metadata.section && ` > ${entry.metadata.section}`}
              </button>
            </div>
            <div style={{ color: 'var(--foreground-muted)' }}>
              Added: {new Date(entry.created_at).toLocaleString()}
            </div>
            {entry.metadata.joins.length > 0 && (
              <div>
                <button
                  onClick={loadJoinedEntries}
                  style={{
                    color: 'var(--success)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover:underline cursor-pointer"
                >
                  {showJoinedDetails ? '▼' : '▶'} Joined to: {entry.metadata.joins.length} highlight{entry.metadata.joins.length !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        </div>

        {showJoinedDetails && joinedEntries.length > 0 && (
          <div
            style={{
              marginTop: 'var(--space-lg)',
              paddingTop: 'var(--space-lg)',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--foreground-secondary)',
                marginBottom: 'var(--space-md)',
                fontWeight: '500'
              }}
            >
              Connected highlights:
            </div>
            <div className="space-y-comfortable">
              {joinedEntries.map((joinedEntry) => (
                <button
                  key={joinedEntry.id}
                  onClick={() => onScrollToEntry(joinedEntry.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--space-md)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover:shadow-sm"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-elevated)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--foreground)',
                      marginBottom: 'var(--space-xs)'
                    }}
                    className="truncate"
                  >
                    {joinedEntry.data}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--foreground-muted)'
                    }}
                  >
                    {joinedEntry.metadata.article}
                    {joinedEntry.metadata.section && ` > ${joinedEntry.metadata.section}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

EntryCard.displayName = 'EntryCard';