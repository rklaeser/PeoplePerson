import 'dotenv/config';
import type { Config } from 'drizzle-kit';

const dbUrl = process.env.DB_URL;

if (!dbUrl) throw Error('Database url not defined');

export default {
	schema: './src/lib/db/schema.ts',
	out: './src/lib/db/drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: dbUrl
	}
} satisfies Config;
