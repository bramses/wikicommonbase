import { NextRequest, NextResponse } from 'next/server';
import { db, entries } from '@/lib/db';
import { getEmbedding } from '@/lib/openai';
import { SearchResult, EntryMetadata } from '@/lib/types';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 }: { query: string; limit?: number } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const queryEmbedding = await getEmbedding(query);
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    const searchResults = await db.select({
      entry: {
        id: entries.id,
        data: entries.data,
        metadata: entries.metadata,
        createdAt: entries.createdAt,
        updatedAt: entries.updatedAt,
      },
      similarity: sql<number>`1 - (${entries.embedding} <=> ${sql.raw(`'${embeddingString}'::vector`)})`
    })
    .from(entries)
    .orderBy(sql`${entries.embedding} <=> ${sql.raw(`'${embeddingString}'::vector`)}`)
    .limit(limit);

    const results: SearchResult[] = searchResults.map(row => ({
      entry: {
        id: row.entry.id,
        data: row.entry.data,
        metadata: row.entry.metadata as EntryMetadata,
        created_at: row.entry.createdAt,
        updated_at: row.entry.updatedAt,
      },
      similarity: row.similarity
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}