import { SvelteKitAuth } from '@auth/sveltekit';
import PostgresAdapter from '@auth/pg-adapter';
import GitHub from '@auth/sveltekit/providers/github';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, AUTH_SECRET } from '$env/static/private';
import { Pool } from 'pg';

// Create a PostgreSQL connection pool for Auth.js
const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'friendship',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    GitHub({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    }),
  ],
  secret: AUTH_SECRET,
  trustHost: true,
  callbacks: {
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Persist the OAuth access_token to the token right after signin
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});