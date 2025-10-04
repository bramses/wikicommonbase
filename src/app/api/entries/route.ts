import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Entry } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy');
    const limit = parseInt(searchParams.get('limit') || '50');

    const client = await pool.connect();

    try {
      let query = `
        SELECT id, data, metadata, created_at, updated_at
        FROM entries
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const result = await client.query(query, [limit]);

      const entries: Entry[] = result.rows.map(row => ({
        ...row,
        metadata: JSON.parse(row.metadata)
      }));

      if (groupBy === 'article-section') {
        const grouped = entries.reduce((acc, entry) => {
          const key = `${entry.metadata.article}${entry.metadata.section ? ` > ${entry.metadata.section}` : ''}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(entry);
          return acc;
        }, {} as Record<string, Entry[]>);

        return NextResponse.json({ grouped, total: entries.length });
      }

      return NextResponse.json({ entries, total: entries.length });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}