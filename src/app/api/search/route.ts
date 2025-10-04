import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getEmbedding } from '@/lib/openai';
import { Entry, SearchResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 }: { query: string; limit?: number } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const queryEmbedding = await getEmbedding(query);
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, data, metadata, created_at, updated_at,
         1 - (embedding <=> $1::vector) as similarity
         FROM entries
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [`[${queryEmbedding.join(',')}]`, limit]
      );

      const searchResults: SearchResult[] = result.rows.map(row => ({
        entry: {
          ...row,
          metadata: JSON.parse(row.metadata)
        } as Entry,
        similarity: row.similarity
      }));

      return NextResponse.json({ results: searchResults });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error searching entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}