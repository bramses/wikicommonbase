import { NextRequest, NextResponse } from 'next/server';
import { db, entries } from '@/lib/db';
import { Entry } from '@/lib/types';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await db.select({
      id: entries.id,
      data: entries.data,
      metadata: entries.metadata,
      created_at: entries.createdAt,
      updated_at: entries.updatedAt,
    })
    .from(entries)
    .orderBy(desc(entries.createdAt))
    .limit(limit);

    const entriesData: Entry[] = result.map(row => ({
      id: row.id,
      data: row.data,
      metadata: row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    if (groupBy === 'article-section') {
      const grouped = entriesData.reduce((acc, entry) => {
        const key = `${entry.metadata.article}${entry.metadata.section ? ` > ${entry.metadata.section}` : ''}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(entry);
        return acc;
      }, {} as Record<string, Entry[]>);

      return NextResponse.json({ grouped, total: entriesData.length });
    }

    return NextResponse.json({ entries: entriesData, total: entriesData.length });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}