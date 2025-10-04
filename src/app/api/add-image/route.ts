import { NextRequest, NextResponse } from 'next/server';
import { db, entries } from '@/lib/db';
import { getEmbedding, imageToText } from '@/lib/openai';
import { EntryMetadata } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, metadata }: { imageUrl: string; metadata: Omit<EntryMetadata, 'img_url'> } = await request.json();

    if (!imageUrl || !metadata) {
      return NextResponse.json({ error: 'Missing imageUrl or metadata' }, { status: 400 });
    }

    const data = await imageToText(imageUrl);
    const embedding = await getEmbedding(data);

    const fullMetadata: EntryMetadata = {
      ...metadata,
      img_url: imageUrl
    };

    const [newEntry] = await db.insert(entries).values({
      data,
      metadata: fullMetadata,
      embedding: embedding,
    }).returning();

    return NextResponse.json({
      success: true,
      entry: newEntry
    });
  } catch (error) {
    console.error('Error adding image entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}