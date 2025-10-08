'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ReadingListItem,
  loadReadingList,
  addToReadingList,
  removeFromReadingList,
  archiveReadingListItem,
  isValidWikipediaUrl
} from '@/lib/readingList';

export default function ReadingList() {
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load reading list from cookies on mount
  useEffect(() => {
    const items = loadReadingList();
    setReadingList(items);
    setIsLoaded(true);
  }, []);

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = newUrl.trim();

    if (!trimmedUrl) return;

    if (!isValidWikipediaUrl(trimmedUrl)) {
      alert('Please enter a valid Wikipedia article URL');
      return;
    }

    try {
      const newItem = addToReadingList(trimmedUrl);
      setReadingList(prev => [...prev, newItem]);
      setNewUrl('');
    } catch (error) {
      console.error('Error adding to reading list:', error);
      alert('Error adding article to reading list');
    }
  };

  const handleRemove = (id: string) => {
    removeFromReadingList(id);
    setReadingList(prev => prev.filter(item => item.id !== id));
  };

  const handleArchive = (id: string) => {
    archiveReadingListItem(id);
    setReadingList(prev => prev.map(item =>
      item.id === id ? { ...item, isArchived: true } : item
    ));
  };

  const getReaderUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const title = pathParts[pathParts.length - 1];
      return `/reader?article=${encodeURIComponent(title)}`;
    } catch {
      return '/reader';
    }
  };

  if (!isLoaded) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        Loading reading list...
      </div>
    );
  }

  const activeItems = readingList.filter(item => !item.isArchived);
  const archivedItems = readingList.filter(item => item.isArchived);
  const displayItems = showArchived ? archivedItems : activeItems;

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
        Your reading list is stored locally in your browser&apos;s cookies and will be lost if you clear them.
      </p>

      {/* Add URL Form */}
      <form onSubmit={handleAddUrl} className="max-w-2xl mx-auto">
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://en.wikipedia.org/wiki/Article_Name"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
          >
            Add
          </button>
        </div>
      </form>

      {/* Toggle View */}
      {(activeItems.length > 0 || archivedItems.length > 0) && (
        <div className="text-center">
          <button
            onClick={() => setShowArchived(false)}
            className={`text-sm mr-4 ${!showArchived
              ? 'text-gray-900 dark:text-white font-medium'
              : 'text-blue-600 dark:text-blue-400 hover:underline'
            }`}
          >
            Active ({activeItems.length})
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`text-sm ${showArchived
              ? 'text-gray-900 dark:text-white font-medium'
              : 'text-blue-600 dark:text-blue-400 hover:underline'
            }`}
          >
            Archived ({archivedItems.length})
          </button>
        </div>
      )}

      {/* Reading List */}
      {displayItems.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {showArchived
            ? 'No archived articles.'
            : 'No articles in your reading list yet.'
          }
        </div>
      ) : (
        <div className="space-y-3 text-left max-w-3xl mx-auto">
          {displayItems.map((item) => (
            <div key={item.id} className="border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    <Link
                      href={getReaderUrl(item.url)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {item.title}
                    </Link>
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Added {new Date(item.dateAdded).toLocaleDateString()}
                    {!item.isArchived && (
                      <span className="ml-3">
                        <button
                          onClick={() => handleArchive(item.id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Archive
                        </button>
                      </span>
                    )}
                    <span className="ml-3">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Remove
                      </button>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}