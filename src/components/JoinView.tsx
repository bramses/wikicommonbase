'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Entry, SearchResult } from '@/lib/types';

export default function JoinView() {
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [joinedEntries, setJoinedEntries] = useState<Entry[]>([]);
  const [showJoinedList, setShowJoinedList] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    loadRandomHighlight();
    // Auto-focus search input when component mounts
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
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
        await loadRandomHighlight();
        searchInputRef.current?.focus();
        break;
    }
  }, [searchResults, selectedResultIndex, searchQuery, scrollToResult]);

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
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for highlights to join (press Enter to search)..."
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
              ref={el => resultRefs.current[index] = el}
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
      {console.log('Rendering, joinedEntries.length:', joinedEntries.length)}
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
        <div>/: Focus search</div>
        <div>Enter: Search</div>
        <div>↑↓: Navigate results</div>
        <div>J: Join selected highlight</div>
        <div>R: New random highlight</div>
      </div>
    </div>
  );
}