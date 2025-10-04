import { NextRequest, NextResponse } from 'next/server';
import { db, entries } from '@/lib/db';
import { getEmbedding } from '@/lib/openai';
import { EntryMetadata } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { data, metadata }: { data: string; metadata: EntryMetadata } = await request.json();

    if (!data || !metadata) {
      return NextResponse.json({ error: 'Missing data or metadata' }, { status: 400 });
    }

    const embedding = await getEmbedding(data);

    const [newEntry] = await db.insert(entries).values({
      data,
      metadata,
      embedding: embedding,
    }).returning();

    return NextResponse.json({
      success: true,
      entry: newEntry
    });
  } catch (error) {
    console.error('Error adding entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}