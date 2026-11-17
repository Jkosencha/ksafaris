// Creates the first Owner account for the staff dashboard.
// Usage: npm run create-owner -- --email owner@example.com --name "Jane Doe"
// The password is typed at a hidden prompt (never on the command line).
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';

const MIN_LENGTH = 12;
const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' } } });
const email = values.email?.trim().toLowerCase();
const name = values.name?.trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
  console.error('Usage: npm run create-owner -- --email owner@example.com --name "Jane Doe"');
  process.exit(1);
}
const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL (or DATABASE_URL_DIRECT) is not set in .env');
  process.exit(1);
}

/** Reads a line without echoing it to the screen. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.startsWith(question)) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const password = await askHidden(`Password for ${email} (at least ${MIN_LENGTH} characters): `);
if (password.length < MIN_LENGTH) {
  console.error(`Password must be at least ${MIN_LENGTH} characters.`);
  process.exit(1);
}
if ((await askHidden('Type it again: ')) !== password) {
  console.error('The passwords did not match.');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });
try {
  const passwordHash = await hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const [existing] = await sql`select id from users where email = ${email}`;
  if (existing) {
    console.error(`An account for ${email} already exists.`);
    process.exitCode = 1;
  } else {
    await sql`insert into users (email, name, password_hash, role) values (${email}, ${name}, ${passwordHash}, 'owner')`;
    console.log(`Owner account created for ${name} <${email}>. Sign in at /office/login.`);
  }
} finally {
  await sql.end();
}
