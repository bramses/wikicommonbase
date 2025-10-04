import { NextRequest, NextResponse } from 'next/server';
import { db, entries } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const [entry] = await db.select()
      .from(entries)
      .where(eq(entries.id, id));

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({
      entry: {
        id: entry.id,
        data: entry.data,
        metadata: entry.metadata,
        created_at: entry.createdAt,
        updated_at: entry.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}