import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Entry } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM entries WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }

      const entry: Entry = {
        ...result.rows[0],
        metadata: JSON.parse(result.rows[0].metadata)
      };

      return NextResponse.json({ entry });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}