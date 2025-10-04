import { NextRequest, NextResponse } from 'next/server';
import { db, entries } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { id1, id2 }: { id1: string; id2: string } = await request.json();

    if (!id1 || !id2) {
      return NextResponse.json({ error: 'Missing id1 or id2' }, { status: 400 });
    }

    if (id1 === id2) {
      return NextResponse.json({ error: 'Cannot join entry to itself' }, { status: 400 });
    }

    // Use a transaction with Drizzle
    const result = await db.transaction(async (tx) => {
      // Get both entries
      const [entry1] = await tx.select().from(entries).where(eq(entries.id, id1));
      const [entry2] = await tx.select().from(entries).where(eq(entries.id, id2));

      if (!entry1 || !entry2) {
        throw new Error('One or both entries not found');
      }

      // Update metadata for both entries
      const metadata1 = entry1.metadata as any;
      const metadata2 = entry2.metadata as any;

      if (!metadata1.joins.includes(id2)) {
        metadata1.joins.push(id2);
      }
      if (!metadata2.joins.includes(id1)) {
        metadata2.joins.push(id1);
      }

      // Update both entries
      await tx.update(entries)
        .set({
          metadata: metadata1,
          updatedAt: sql`NOW()`
        })
        .where(eq(entries.id, id1));

      await tx.update(entries)
        .set({
          metadata: metadata2,
          updatedAt: sql`NOW()`
        })
        .where(eq(entries.id, id2));

      return { id1, id2 };
    });

    return NextResponse.json({ success: true, joined: [result.id1, result.id2] });
  } catch (error) {
    console.error('Error joining entries:', error);

    if (error instanceof Error && error.message === 'One or both entries not found') {
      return NextResponse.json({ error: 'One or both entries not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}