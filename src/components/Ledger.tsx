'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { Entry } from '@/lib/types';

export default function Ledger() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Entry[]>>({});
  const [loading, setLoading] = useState(true);
  const [groupByArticleSection, setGroupByArticleSection] = useState(false);
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
      highlight: entry.data.substring(0, 100)
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
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Highlight Ledger</h1>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={groupByArticleSection}
            onChange={(e) => setGroupByArticleSection(e.target.checked)}
            className="w-4 h-4"
          />
          Group by Article - Section
        </label>
      </div>

      {groupByArticleSection ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([key, groupEntries]) => (
            <div key={key} className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">{key}</h2>
              <div className="space-y-4">
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
        <div className="space-y-4">
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
      <div ref={ref} className="border rounded-lg p-4 hover:shadow-md transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <p className="text-gray-800 dark:text-gray-200 mb-2">{entry.data}</p>
            {entry.metadata.img_url && (
              <img
                src={entry.metadata.img_url}
                alt="Entry image"
                className="max-w-xs rounded-lg mb-2"
              />
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <div>
              <button
                onClick={() => onOpen(entry)}
                className="text-blue-600 hover:underline"
              >
                {entry.metadata.article}
                {entry.metadata.section && ` > ${entry.metadata.section}`}
              </button>
            </div>
            <div>Added: {new Date(entry.created_at).toLocaleString()}</div>
            {entry.metadata.joins.length > 0 && (
              <div>
                <button
                  onClick={loadJoinedEntries}
                  className="text-green-600 hover:underline cursor-pointer"
                >
                  {showJoinedDetails ? '▼' : '▶'} Joined to: {entry.metadata.joins.length} highlight{entry.metadata.joins.length !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        </div>

        {showJoinedDetails && joinedEntries.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Connected highlights:</div>
            <div className="space-y-2">
              {joinedEntries.map((joinedEntry) => (
                <button
                  key={joinedEntry.id}
                  onClick={() => onScrollToEntry(joinedEntry.id)}
                  className="block w-full text-left p-2 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="text-sm truncate mb-1">{joinedEntry.data}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
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