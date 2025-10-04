'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { Entry } from '@/lib/types';

export default function Ledger() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Entry[]>>({});
  const [loading, setLoading] = useState(true);
  const [groupByArticleSection, setGroupByArticleSection] = useState(true);
  const [joinedEntriesCache, setJoinedEntriesCache] = useState<Record<string, Entry[]>>({});
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchEntries();
  }, [groupByArticleSection]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/entries', window.location.origin);
      if (groupByArticleSection) {
        url.searchParams.set('groupBy', 'article-section');
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (groupByArticleSection) {
          setGrouped(data.grouped);
          setEntries([]);
        } else {
          setEntries(data.entries);
          setGrouped({});
        }
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
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
              <h2
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: '600',
                  color: 'var(--foreground)',
                  marginBottom: 'var(--space-xl)'
                }}
              >
                {key}
              </h2>
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