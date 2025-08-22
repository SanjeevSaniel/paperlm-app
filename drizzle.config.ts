import { defineConfig } from 'drizzle-kit';
import { readFileSync } from 'fs';

// Load environment variables from .env.local manually for Drizzle Kit
try {
  const envLocal = readFileSync('.env.local', 'utf8');
  const lines = envLocal.split('\n');
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length && !process.env[key]) {
      process.env[key] = valueParts.join('=').trim();
    }
  });
} catch (error) {
  console.warn('Could not load .env.local file');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});