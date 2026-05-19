#!/usr/bin/env node
/**
 * Un clic : npm run push
 * Token une fois : npm run setup
 */
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');
const REPO = 'rachid123RA/gla-v3';
const BRANCH = 'main';

function loadToken() {
  if (existsSync(envPath)) {
    const text = readFileSync(envPath, 'utf8');
    const m = text.match(/^GITHUB_TOKEN=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.GITHUB_TOKEN?.trim() || '';
}

async function validateToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  return res.status === 200;
}

const token = loadToken();
if (!token) {
  console.error('\n❌ Aucun token GitHub.');
  console.error('   Lancez UNE FOIS : npm run setup');
  console.error('   Puis           : npm run push\n');
  process.exit(1);
}

const ok = await validateToken(token);
if (!ok) {
  console.error('\n❌ Token invalide ou expiré.');
  console.error('   Relancez : npm run setup');
  console.error('   Token  : https://github.com/settings/tokens (classic, scope repo)\n');
  process.exit(1);
}

try {
  execSync('git add -A', { cwd: root, stdio: 'inherit' });
  try {
    execSync('git diff --staged --quiet', { cwd: root });
  } catch {
    execSync('git commit -m "chore: update project"', { cwd: root, stdio: 'inherit' });
  }
} catch {
  // rien à committer
}

console.log(`\n==> Push vers https://github.com/${REPO} ...\n`);

const url = `https://x-access-token:${token}@github.com/${REPO}.git`;
execSync(`git push -u "${url}" ${BRANCH}`, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
});

console.log(`\n✅ Projet sur GitHub : https://github.com/${REPO}\n`);
