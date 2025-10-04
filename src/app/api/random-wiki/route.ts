import { NextRequest, NextResponse } from 'next/server';
import { getRandomWikipediaTitle, fetchWikipediaArticle } from '@/lib/wikipedia';

export async function GET() {
  try {
    const title = await getRandomWikipediaTitle();

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