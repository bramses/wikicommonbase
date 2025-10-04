import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import { getEmbedding, imageToText } from '@/lib/openai';
import { EntryMetadata } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, metadata }: { imageUrl: string; metadata: Omit<EntryMetadata, 'img_url'> } = await request.json();

    if (!imageUrl || !metadata) {
      return NextResponse.json({ error: 'Missing imageUrl or metadata' }, { status: 400 });
    }

    const data = await imageToText(imageUrl);
    const id = uuidv4();
    const embedding = await getEmbedding(data);
    const now = new Date();

    const fullMetadata: EntryMetadata = {
      ...metadata,
      img_url: imageUrl
    };

    const client = await pool.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS entries (
          id UUID PRIMARY KEY,
          data TEXT NOT NULL,
          metadata JSONB NOT NULL,
          embedding vector(1536),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS entries_embedding_idx ON entries
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
      `);

      const result = await client.query(
        'INSERT INTO entries (id, data, metadata, embedding, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, data, JSON.stringify(fullMetadata), `[${embedding.join(',')}]`, now, now]
      );

      return NextResponse.json({
        success: true,
        entry: {
          ...result.rows[0],
          metadata: JSON.parse(result.rows[0].metadata)
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding image entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}