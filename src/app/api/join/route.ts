import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { id1, id2 }: { id1: string; id2: string } = await request.json();

    if (!id1 || !id2) {
      return NextResponse.json({ error: 'Missing id1 or id2' }, { status: 400 });
    }

    if (id1 === id2) {
      return NextResponse.json({ error: 'Cannot join entry to itself' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const entry1Result = await client.query('SELECT * FROM entries WHERE id = $1', [id1]);
      const entry2Result = await client.query('SELECT * FROM entries WHERE id = $2', [id2]);

      if (entry1Result.rows.length === 0 || entry2Result.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'One or both entries not found' }, { status: 404 });
      }

      const entry1 = entry1Result.rows[0];
      const entry2 = entry2Result.rows[0];

      const metadata1 = JSON.parse(entry1.metadata);
      const metadata2 = JSON.parse(entry2.metadata);

      if (!metadata1.joins.includes(id2)) {
        metadata1.joins.push(id2);
      }
      if (!metadata2.joins.includes(id1)) {
        metadata2.joins.push(id1);
      }

      await client.query(
        'UPDATE entries SET metadata = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(metadata1), id1]
      );

      await client.query(
        'UPDATE entries SET metadata = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(metadata2), id2]
      );

      await client.query('COMMIT');

      return NextResponse.json({ success: true, joined: [id1, id2] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error joining entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}