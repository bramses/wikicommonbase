import { NextRequest, NextResponse } from 'next/server';
import { db, entries } from '@/lib/db';
import { Entry, EntryMetadata } from '@/lib/types';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy');
    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? undefined : parseInt(limitParam || '50');
    const offsetParam = searchParams.get('offset');
    const offset = parseInt(offsetParam || '0');
    const includeEmbeddings = searchParams.get('includeEmbeddings') === 'true';

    const selectFields = {
      id: entries.id,
      data: entries.data,
      metadata: entries.metadata,
      created_at: entries.createdAt,
      updated_at: entries.updatedAt,
      ...(includeEmbeddings && { embedding: entries.embedding }),
    };

    const queryBuilder = db.select(selectFields)
      .from(entries)
      .orderBy(desc(entries.createdAt));

    let query;
    if (limit !== undefined) {
      if (offset > 0) {
        query = queryBuilder.limit(limit).offset(offset);
      } else {
        query = queryBuilder.limit(limit);
      }
    } else {
      if (offset > 0) {
        query = queryBuilder.offset(offset);
      } else {
        query = queryBuilder;
      }
    }

    const result = await query;

    const entriesData: Entry[] = result.map(row => ({
      id: row.id,
      data: row.data,
      metadata: row.metadata as EntryMetadata,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ...(includeEmbeddings && (row as { embedding?: number[] }).embedding && { embedding: (row as { embedding?: number[] }).embedding }),
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