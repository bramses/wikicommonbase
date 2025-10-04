'use client';

import { useState, useEffect } from 'react';
import { Entry } from '@/lib/types';

export default function Ledger() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Entry[]>>({});
  const [loading, setLoading] = useState(true);
  const [groupByArticleSection, setGroupByArticleSection] = useState(false);

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
          Group by Article > Section
        </label>
      </div>

      {groupByArticleSection ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([key, groupEntries]) => (
            <div key={key} className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">{key}</h2>
              <div className="space-y-4">
                {groupEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} onOpen={openInReader} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onOpen={openInReader} />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryCard({ entry, onOpen }: { entry: Entry; onOpen: (entry: Entry) => void }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
              Joined to: {entry.metadata.joins.length} highlight{entry.metadata.joins.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}