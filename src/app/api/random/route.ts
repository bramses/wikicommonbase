import { NextResponse } from 'next/server';
import { db, entries } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const [randomEntry] = await db.select()
      .from(entries)
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (!randomEntry) {
      return NextResponse.json({ error: 'No entries found' }, { status: 404 });
    }

    const entry = {
      id: randomEntry.id,
      data: randomEntry.data,
      metadata: randomEntry.metadata,
      created_at: randomEntry.createdAt,
      updated_at: randomEntry.updatedAt,
    };

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error getting random entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}