'use client';

import { useState, useEffect, useCallback } from 'react';
import { Entry, SearchResult } from '@/lib/types';

export default function JoinView() {
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [joinedEntries, setJoinedEntries] = useState<Entry[]>([]);
  const [showJoinedList, setShowJoinedList] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRandomHighlight();
  }, []);

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
    if (entry.metadata.joins.length === 0) {
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
      setJoinedEntries(results.filter(Boolean));
    } catch (error) {
      console.error('Error loading joined entries:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 20 })
      });

      if (response.ok) {
        const { results } = await response.json();
        setSearchResults(results);
        setSelectedResultIndex(0);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setSelectedResultIndex(prev => Math.max(0, prev - 1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setSelectedResultIndex(prev => Math.min(searchResults.length - 1, prev + 1));
        break;
      case 'j':
      case 'J':
        event.preventDefault();
        await joinSelectedEntry();
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        await loadRandomHighlight();
        break;
    }
  }, [searchResults, selectedResultIndex]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const joinSelectedEntry = async () => {
    if (!currentEntry || searchResults.length === 0) return;

    const selectedResult = searchResults[selectedResultIndex];
    if (!selectedResult) return;

    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id1: currentEntry.id,
          id2: selectedResult.entry.id
        })
      });

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
        setJoinedEntries(prev => [...prev, selectedResult.entry]);

        // Clear search
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error joining entries:', error);
    }
  };

  if (!currentEntry) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Join Highlights</h1>

      {/* Current Highlight */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Highlight</h2>
        <p className="text-lg mb-4">{currentEntry.data}</p>
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
      <div className="mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder="Search for highlights to join..."
          className="w-full p-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
        />
      </div>

      {/* Search Results */}
      {loading && <div className="text-center mb-8">Searching...</div>}

      {searchResults.length > 0 && (
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold">Search Results:</h3>
          {searchResults.map((result, index) => (
            <div
              key={result.entry.id}
              className={`
                border rounded-lg p-4 cursor-pointer transition-colors
                ${index === selectedResultIndex
                  ? 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
              onClick={() => setSelectedResultIndex(index)}
            >
              <p className="mb-2">{result.entry.data}</p>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {result.entry.metadata.article}
                  {result.entry.metadata.section && ` > ${result.entry.metadata.section}`}
                </span>
                <span>Similarity: {(result.similarity * 100).toFixed(1)}%</span>
              </div>
              {result.entry.metadata.img_url && (
                <img
                  src={result.entry.metadata.img_url}
                  alt="Result image"
                  className="max-w-xs rounded-lg mt-2"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Joined Highlights */}
      {joinedEntries.length > 0 && (
        <div className="border-t pt-8">
          <button
            onClick={() => setShowJoinedList(!showJoinedList)}
            className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-blue-600"
          >
            <span>{showJoinedList ? '▼' : '▶'}</span>
            Currently Joined Highlights ({joinedEntries.length})
          </button>

          {showJoinedList && (
            <div className="space-y-4">
              {joinedEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 bg-green-50 dark:bg-green-900">
                  <p className="mb-2">{entry.data}</p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.metadata.article}
                    {entry.metadata.section && ` > ${entry.metadata.section}`}
                  </div>
                  {entry.metadata.img_url && (
                    <img
                      src={entry.metadata.img_url}
                      alt="Joined highlight image"
                      className="max-w-xs rounded-lg mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded shadow-lg text-sm">
        <div>↑↓: Navigate results</div>
        <div>J: Join selected highlight</div>
        <div>R: New random highlight</div>
      </div>
    </div>
  );
}