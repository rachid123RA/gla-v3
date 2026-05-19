#!/usr/bin/env node
import { createInterface } from 'readline';
import { writeFileSync, chmodSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');

const rl = createInterface({ input: process.stdin, output: process.stdout });

const tokenFromArg = process.argv[2]?.trim();

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  let token = tokenFromArg;
  if (!token) {
    console.log('\nToken GitHub (classic) — scope: repo');
    console.log('Créer : https://github.com/settings/tokens\n');
    token = await ask('Collez le token (ghp_...) : ');
  }
  rl.close();

  token = token.trim().replace(/^["']|["']$/g, '');
  if (!token) {
    console.error('Token vide.');
    process.exit(1);
  }

  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });

  if (res.status !== 200) {
    console.error(`\n❌ Token refusé (HTTP ${res.status}). Créez-en un nouveau.\n`);
    process.exit(1);
  }

  writeFileSync(envPath, `GITHUB_TOKEN=${token}\n`, 'utf8');
  chmodSync(envPath, 0o600);

  console.log('\n✅ Token enregistré dans .env.local');
  console.log('   Maintenant cliquez Run sur : npm run push\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
