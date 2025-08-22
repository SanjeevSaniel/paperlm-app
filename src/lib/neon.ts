import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL environment variable is not set');
}

// Create the connection
const sql = neon(process.env.NEON_DATABASE_URL);

// Create Drizzle instance
export const db = drizzle(sql);

// Test connection function
export async function testNeonConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ NeonDB connected successfully:', result[0]?.current_time);
    return true;
  } catch (error) {
    console.error('❌ NeonDB connection failed:', error);
    return false;
  }
}

// Raw SQL executor (for when we need direct SQL access)
export { sql };