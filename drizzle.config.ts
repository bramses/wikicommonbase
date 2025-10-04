import type { Config } from 'drizzle-kit';
import { loadEnvConfig } from '@next/env';

// Load environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;