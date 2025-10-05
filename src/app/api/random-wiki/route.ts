import { NextRequest, NextResponse } from 'next/server';
import { getRandomWikipediaTitle, fetchWikipediaArticle } from '@/lib/wikipedia';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories');

    // Parse categories from comma-separated string
    const categories = categoriesParam ? categoriesParam.split(',').map(c => c.trim()).filter(c => c.length > 0) : undefined;

    const title = await getRandomWikipediaTitle(categories);

    if (!title) {
      return NextResponse.json({ error: 'Failed to get random Wikipedia title' }, { status: 500 });
    }

    const article = await fetchWikipediaArticle(title);

    if (!article) {
      return NextResponse.json({ error: 'Failed to fetch Wikipedia article' }, { status: 500 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error getting random Wikipedia article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}