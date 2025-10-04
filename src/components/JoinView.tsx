'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Entry, SearchResult } from '@/lib/types';

export default function JoinView() {
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [joinedEntries, setJoinedEntries] = useState<Entry[]>([]);
  const [showJoinedList, setShowJoinedList] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const currentEntryId = searchParams.get('current');
    if (currentEntryId) {
      loadSpecificEntry(currentEntryId);
    } else {
      loadRandomHighlight();
    }
    // Auto-focus search input when component mounts
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, [searchParams]);

  const loadSpecificEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/entries/${entryId}`);
      if (response.ok) {
        const { entry } = await response.json();
        setCurrentEntry(entry);
        await loadJoinedEntries(entry);
      }
    } catch (error) {
      console.error('Error loading specific entry:', error);
    }
  };

  const loadRandomHighlight = async () => {
    try {
      const response = await fetch('/api/random');
      if (response.ok) {
        const { entry } = await response.json();
        setCurrentEntry(entry);
        await loadJoinedEntries(entry);
      }
    } catch (error) {
      console.error('Error loading random highlight:', error);
    }
  };

  const loadJoinedEntries = async (entry: Entry) => {
    console.log('Loading joined entries for:', entry.id, 'joins:', entry.metadata.joins);

    if (entry.metadata.joins.length === 0) {
      console.log('No joins found, setting empty array');
      setJoinedEntries([]);
      return;
    }

    try {
      const joinedPromises = entry.metadata.joins.map(async (id) => {
        const response = await fetch(`/api/entries/${id}`);
        if (response.ok) {
          const { entry } = await response.json();
          return entry;
        }
        return null;
      });

      const results = await Promise.all(joinedPromises);
      const filteredResults = results.filter(Boolean);
      console.log('Loaded joined entries:', filteredResults.length);
      setJoinedEntries(filteredResults);
    } catch (error) {
      console.error('Error loading joined entries:', error);
    }
  };

  const openInReader = (entry: Entry) => {
    const params = new URLSearchParams({
      article: entry.metadata.article,
      highlight: entry.data,
      scrollToHighlight: 'true'
    });
    window.open(`/reader?${params.toString()}`, '_blank');
  };

  const searchWithRandomHighlight = async () => {
    try {
      const response = await fetch('/api/random');
      if (response.ok) {
        const { entry } = await response.json();
        setSearchQuery(entry.data);
        await handleSearch(entry.data);
      }
    } catch (error) {
      console.error('Error getting random highlight for search:', error);
    }
  };

  const handleSearch = async (query: string) => {
    console.log('handleSearch called with query:', query);
    if (!query.trim()) {
      console.log('Empty query, clearing results');
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Sending search request...');
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 20 })
      });

      console.log('Search response status:', response.status);
      if (response.ok) {
        const { results } = await response.json();
        console.log('Search results received:', results.length);
        setSearchResults(results);
        setSelectedResultIndex(0);
        // Initialize result refs array
        resultRefs.current = new Array(results.length).fill(null);
      } else {
        console.error('Search failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToResult = useCallback((index: number) => {
    const element = resultRefs.current[index];
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, []);

  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    // Handle slash key globally (even when input is focused)
    if (event.key === '/') {
      event.preventDefault();
      searchInputRef.current?.focus();
      return;
    }

    // If search input is focused, only handle Enter
    if (event.target === searchInputRef.current) {
      if (event.key === 'Enter') {
        event.preventDefault();
        await handleSearch(searchQuery);
        // Blur the input so arrow keys work for navigation
        searchInputRef.current?.blur();
      }
      // Let all other keys pass through normally when input is focused
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        if (searchResults.length > 0) {
          event.preventDefault();
          setSelectedResultIndex(prev => {
            const newIndex = Math.max(0, prev - 1);
            scrollToResult(newIndex);
            return newIndex;
          });
        }
        break;
      case 'ArrowDown':
        if (searchResults.length > 0) {
          event.preventDefault();
          setSelectedResultIndex(prev => {
            const newIndex = Math.min(searchResults.length - 1, prev + 1);
            scrollToResult(newIndex);
            return newIndex;
          });
        }
        break;
      case 'j':
      case 'J':
        event.preventDefault();
        await joinSelectedEntry();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        setSearchQuery('');
        setSearchResults([]);
        await loadRandomHighlight();
        searchInputRef.current?.focus();
        break;
      case 'o':
      case 'O':
        if (searchResults.length > 0) {
          event.preventDefault();
          const selectedResult = searchResults[selectedResultIndex];
          if (selectedResult) {
            openInReader(selectedResult.entry);
          }
        }
        break;
    }
  }, [searchResults, selectedResultIndex, searchQuery, scrollToResult, openInReader]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const joinSelectedEntry = async () => {
    if (!currentEntry || searchResults.length === 0) return;

    const selectedResult = searchResults[selectedResultIndex];
    if (!selectedResult) return;

    console.log('Attempting to join:', currentEntry.id, 'with', selectedResult.entry.id);

    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id1: currentEntry.id,
          id2: selectedResult.entry.id
        })
      });

      console.log('Join response status:', response.status);
      const data = await response.json();
      console.log('Join response data:', data);

      if (response.ok) {
        // Update the current entry's joins
        const updatedEntry = {
          ...currentEntry,
          metadata: {
            ...currentEntry.metadata,
            joins: [...currentEntry.metadata.joins, selectedResult.entry.id]
          }
        };
        setCurrentEntry(updatedEntry);

        // Add the newly joined entry to the joined entries list
        setJoinedEntries(prev => {
          console.log('Previous joined entries:', prev);
          const newJoined = [...prev, selectedResult.entry];
          console.log('New joined entries:', newJoined);
          return newJoined;
        });

        // Don't clear search results, just keep the current state
        // User can manually clear or search again if needed
        console.log('Successfully joined entry:', selectedResult.entry.id);
        console.log('Updated joinedEntries state');
      } else {
        console.error('Join failed:', data);
      }
    } catch (error) {
      console.error('Error joining entries:', error);
    }
  };

  if (!currentEntry) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-content space-y-generous">
        <h1
          style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: '700',
            color: 'var(--foreground)',
            marginBottom: 'var(--space-2xl)',
            letterSpacing: '-0.02em'
          }}
        >
          Join Highlights
        </h1>

      {/* Current Highlight */}
      <div
        className="card mb-8"
        style={{
          padding: 'var(--space-xl)'
        }}
      >
        
        <p
          className="text-reading"
          style={{
            fontSize: 'var(--text-lg)',
            lineHeight: 'var(--leading-relaxed)',
            marginBottom: 'var(--space-lg)',
            color: 'var(--foreground)'
          }}
        >
          {currentEntry.data}
        </p>
        {currentEntry.metadata.img_url && (
          <img
            src={currentEntry.metadata.img_url}
            alt="Highlight image"
            className="max-w-md rounded-lg mb-4"
          />
        )}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          From: {currentEntry.metadata.article}
          {currentEntry.metadata.section && ` > ${currentEntry.metadata.section}`}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="flex gap-3">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for highlights to join (press Enter to search)..."
            style={{
              flex: 1,
              padding: 'var(--space-lg)',
              fontSize: 'var(--text-lg)',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--foreground)',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, sans-serif'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent)';
              e.target.style.background = 'var(--background)';
              e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.background = 'var(--surface-elevated)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={searchWithRandomHighlight}
            style={{
              padding: 'var(--space-lg)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--foreground-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
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
            Random Search
          </button>
        </div>
      </div>

      {/* Search Results */}
      {loading && <div className="text-center mb-8">Searching...</div>}

      {searchResults.length > 0 && (
        <div className="space-y-6 mb-12">
          <h3
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: '600',
              color: 'var(--foreground)',
              marginBottom: 'var(--space-lg)'
            }}
          >
            Search Results:
          </h3>
          {searchResults.map((result, index) => (
            <div
              key={result.entry.id}
              ref={el => resultRefs.current[index] = el}
              className="card cursor-pointer transition-all"
              style={{
                background: index === selectedResultIndex
                  ? 'var(--accent-soft)'
                  : 'var(--surface-elevated)',
                border: '1px solid',
                borderColor: index === selectedResultIndex
                  ? 'var(--accent)'
                  : 'var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-xl)',
                marginBottom: 'var(--space-lg)'
              }}
              onClick={() => setSelectedResultIndex(index)}
              onMouseEnter={(e) => {
                if (index !== selectedResultIndex) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--background)';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== selectedResultIndex) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--surface-elevated)';
                }
              }}
            >
              <p
                className="text-reading"
                style={{
                  fontSize: 'var(--text-base)',
                  lineHeight: 'var(--leading-relaxed)',
                  color: 'var(--foreground)',
                  marginBottom: 'var(--space-md)'
                }}
              >
                {result.entry.data}
              </p>
              <div
                className="flex justify-between"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--foreground-secondary)',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                <span>
                  {result.entry.metadata.article}
                  {result.entry.metadata.section && ` > ${result.entry.metadata.section}`}
                </span>
                <span style={{ color: 'var(--accent)' }}>
                  Similarity: {(result.similarity * 100).toFixed(1)}%
                </span>
              </div>
              {result.entry.metadata.img_url && (
                <img
                  src={result.entry.metadata.img_url}
                  alt="Result image"
                  style={{
                    maxWidth: '20rem',
                    borderRadius: 'var(--radius-md)',
                    marginTop: 'var(--space-md)'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Joined Highlights */}
      {joinedEntries.length > 0 && (
        <section className="mt-12">
          <button
            onClick={() => setShowJoinedList(!showJoinedList)}
            className="flex items-center gap-2 text-base font-semibold hover:text-blue-600"
          >
            <span>{showJoinedList ? '▼' : '▶'}</span>
            Currently Joined Highlights ({joinedEntries.length})
          </button>

          {showJoinedList && (
            <div
              className="card mt-3 overflow-hidden"
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                maxHeight: '40vh',
                overflowY: 'auto',
                background: 'var(--surface-elevated)',
              }}
            >
              <ul className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {joinedEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="hover:bg-[color:var(--background)] transition-colors"
                    style={{ padding: '0.75rem 1rem' }}
                  >
                    <p
                      className="text-reading"
                      style={{
                        fontSize: 'var(--text-sm)',
                        lineHeight: 'var(--leading-snug)',
                        color: 'var(--foreground)',
                        marginBottom: '0.35rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={entry.data}
                    >
                      {entry.data}
                    </p>

                    <div
                      className="flex items-center justify-between"
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--foreground-secondary)',
                      }}
                    >
                      <span>
                        {entry.metadata.article}
                        {entry.metadata.section && ` > ${entry.metadata.section}`}
                      </span>

                      <button
                        onClick={() => openInReader(entry)}
                        className="underline-offset-2 hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        open
                      </button>
                    </div>

                    {entry.metadata.img_url && (
                      <img
                        src={entry.metadata.img_url}
                        alt=""
                        className="mt-2 rounded"
                        style={{ maxWidth: '12rem' }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Controls */}
      <div
        className="card fixed bottom-4 right-4 z-50"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(8px)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <div className="space-y-1" style={{ color: 'var(--foreground-secondary)' }}>
          <div style={{ color: 'var(--foreground)', fontWeight: '500', marginBottom: 'var(--space-sm)' }}>
            Keyboard Shortcuts
          </div>
          <div>/: Focus search</div>
          <div>Enter: Search</div>
          <div>↑↓: Navigate results</div>
          <div>J: Join selected highlight</div>
          <div>O: Open selected in reader</div>
          <div>R: New random highlight</div>
        </div>
      </div>
      </div>
    </div>
  );
}