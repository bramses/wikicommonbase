'use client';

import Link from "next/link";
import { useState, useEffect } from 'react';
import CategoryFilter from '@/components/CategoryFilter';
import ReadingList from '@/components/ReadingList';
import { loadSelectedCategories, saveSelectedCategories, createUrlWithCategories } from '@/lib/categories';

export default function Home() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load categories from localStorage on mount
  useEffect(() => {
    setSelectedCategories(loadSelectedCategories());
    setIsLoaded(true);
  }, []);

  // Save categories to localStorage when they change
  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories);
    saveSelectedCategories(categories);
  };

  // Don't render until we've loaded from localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 py-8 text-center">

        {/* Header Section */}
        <header className="pb-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Wikipedia Commonbase
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            A distraction-free Wikipedia reading experience with highlighting and connection features
          </p>
        </header>

        {/* Category Filter */}
        <div className="mb-8">
          <CategoryFilter
            selectedCategories={selectedCategories}
            onCategoriesChange={handleCategoriesChange}
          />
        </div>

        {/* Reading List */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Reading List
          </h2>
          <ReadingList />
        </section>

        {/* Main Content Sections */}
        <main className="space-y-8">

          {/* Reading Tools Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Reading Tools
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  <Link
                    href={createUrlWithCategories('/reader', selectedCategories)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Distraction-Free Reader
                  </Link>
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Navigate Wikipedia articles sentence by sentence with keyboard controls.
                  Highlight interesting passages and paragraphs as you read.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  <Link
                    href="/inbox"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Inbox
                  </Link>
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Review unconnected highlights and join them with related content.
                  Keep your knowledge graph organized and connected.
                </p>
              </div>
            </div>
          </section>

          {/* Organization Tools Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Organization Tools
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  <Link
                    href="/join"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Join Highlights
                  </Link>
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect related highlights using semantic search. Build a web of
                  knowledge by joining passages that share common themes or ideas.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  <Link
                    href="/ledger"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Highlight Ledger
                  </Link>
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  View all your saved highlights in a searchable table. Group by article
                  and section, or browse chronologically.
                </p>
              </div>
            </div>
          </section>

          {/* Visualization Tools Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Visualization
            </h2>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                <Link
                  href="/graph"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Knowledge Graph
                </Link>
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Visualize your highlights and their connections in an interactive graph.
                Explore the relationships between different concepts and ideas.
              </p>
            </div>
          </section>

          {/* Getting Started Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Getting Started
            </h2>
            <ol className="space-y-3 text-gray-600 dark:text-gray-400 text-left max-w-2xl mx-auto">
              <li>
                <strong>1.</strong> Press <kbd className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">R</kbd> in the reader to load a random Wikipedia article
              </li>
              <li>
                <strong>2.</strong> Use <kbd className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">↑↓</kbd> to navigate sentences, <kbd className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">S</kbd> to highlight sentences, <kbd className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">P</kbd> to highlight paragraphs
              </li>
              <li>
                <strong>3.</strong> Visit the <Link href="/join" className="text-blue-600 dark:text-blue-400 hover:underline">Join page</Link> to connect related highlights using semantic search
              </li>
              <li>
                <strong>4.</strong> Explore your <Link href="/graph" className="text-blue-600 dark:text-blue-400 hover:underline">knowledge graph</Link> to discover unexpected connections
              </li>
            </ol>
          </section>

        </main>
      </div>
    </div>
  );
}
