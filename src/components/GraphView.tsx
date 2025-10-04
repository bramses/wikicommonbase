'use client';

import { useState, useEffect } from 'react';
import { Entry } from '@/lib/types';
import UMAPVisualization from './UMAPVisualization';

export default function GraphView() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/entries?includeEmbeddings=true&limit=all');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched entries for graph:', data.entries.length);
        setEntries(data.entries);
      }
    } catch (error) {
      console.error('Error fetching entries for graph:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (entry: Entry) => {
    setSelectedEntry(entry);
  };

  const closeModal = () => {
    setSelectedEntry(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg mb-2">Loading knowledge graph...</div>
          <div className="text-sm text-gray-600">
            Fetching highlights and computing embeddings
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <UMAPVisualization
        entries={entries}
        onNodeClick={handleNodeClick}
      />

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Highlight Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Content</h3>
                <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                  {selectedEntry.data}
                </p>
              </div>

              {selectedEntry.metadata.img_url && (
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Image</h3>
                  <img
                    src={selectedEntry.metadata.img_url}
                    alt="Highlight image"
                    className="max-w-full rounded-lg"
                  />
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Source</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedEntry.metadata.article}
                  {selectedEntry.metadata.section && ` > ${selectedEntry.metadata.section}`}
                </p>
              </div>

              {selectedEntry.metadata.joins && selectedEntry.metadata.joins.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Connected Highlights ({selectedEntry.metadata.joins.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedEntry.metadata.joins.map((joinId) => {
                      const joinedEntry = entries.find(e => e.id === joinId);
                      return joinedEntry ? (
                        <div
                          key={joinId}
                          className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => setSelectedEntry(joinedEntry)}
                        >
                          <p className="truncate">{joinedEntry.data}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {joinedEntry.metadata.article}
                          </p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Added</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(selectedEntry.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    article: selectedEntry.metadata.article,
                    highlight: selectedEntry.data,
                    scrollToHighlight: 'true'
                  });
                  window.open(`/reader?${params.toString()}`, '_blank');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View in Reader
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}