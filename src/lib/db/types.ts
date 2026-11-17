// The database type, shared by services so tests can pass in a test database.
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;
