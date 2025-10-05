import { Suspense } from 'react';
import Link from 'next/link';
import DistractionFreeReader from '@/components/DistractionFreeReader';
import { fetchWikipediaArticle } from '@/lib/wikipedia';
import { getCategoriesFromParams, createUrlWithCategories } from '@/lib/categories';

interface ReaderPageProps {
  searchParams: Promise<{
    article?: string;
    highlight?: string;
    categories?: string;
  }>;
}

export default async function ReaderPage({ searchParams }: ReaderPageProps) {
  const params = await searchParams;
  let articleTitle = params.article;
  const highlight = params.highlight;

  // Get categories from URL params or localStorage
  const searchParamsObj = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParamsObj.set(key, value);
  });
  const categories = getCategoriesFromParams(searchParamsObj);

  // If no article specified, get a random one
  if (!articleTitle) {
    const { getRandomWikipediaTitle } = await import('@/lib/wikipedia');
    const randomTitle = await getRandomWikipediaTitle(categories);
    articleTitle = randomTitle || 'Wikipedia';
  }

  const content = await fetchWikipediaArticle(articleTitle);

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <p className="mb-4">The article &quot;{articleTitle}&quot; could not be loaded.</p>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Try:</p>
          <ul className="text-sm text-gray-600 list-disc pl-6 space-y-1">
            <li>Checking the article title spelling</li>
            <li>Using the exact Wikipedia page title</li>
            <li>Loading a random article instead</li>
          </ul>
        </div>
        <div className="mt-6 space-x-4">
          <Link
            href={createUrlWithCategories('/reader', categories)}
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Random Article
          </Link>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!content.fullContent && !content.extract) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">No Content Available</h1>
        <p className="mb-4">The article &quot;{articleTitle}&quot; exists but has no readable content.</p>
        <Link
          href={createUrlWithCategories('/reader', categories)}
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Random Article
        </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading article content...</div>}>
      <DistractionFreeReader content={content} initialHighlight={highlight} categories={categories} />
    </Suspense>
  );
}