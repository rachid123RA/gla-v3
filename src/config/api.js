import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_PORT = '5001';

function stripTrailingSlash(url) {
  return typeof url === 'string' ? url.replace(/\/$/, '') : url;
}

/** @param {string | undefined} url */
function hostFromHttpUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/https?:\/\/([^/:]+)/i);
  return m ? m[1] : null;
}

/**
 * Hôte du PC qui exécute Metro (même IP que le packager).
 * Sur téléphone physique, évite d'utiliser localhost (qui désigne le téléphone).
 */
function collectDevHosts() {
  /** @type {string[]} */
  const hosts = [];

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) hosts.push(hostUri.split(':')[0]);

  const exgo = Constants.expoGoConfig;
  if (exgo && typeof exgo === 'object') {
    const dh = exgo.debuggerHost;
    if (typeof dh === 'string') hosts.push(dh.split(':')[0]);
  }

  const manifest = Constants.manifest;
  if (manifest && typeof manifest === 'object' && manifest.debuggerHost) {
    hosts.push(String(manifest.debuggerHost).split(':')[0]);
  }

  const scriptURL = NativeModules.SourceCode?.scriptURL;
  const fromScript = hostFromHttpUrl(scriptURL);
  if (fromScript) hosts.push(fromScript);

  return hosts;
}

function isTunnelHostname(h) {
  if (!h) return false;
  const lower = h.toLowerCase();
  return lower.includes('exp.direct') || lower.includes('ngrok');
}

function firstLanHost(hosts) {
  return hosts.find(
    (h) =>
      h &&
      !isTunnelHostname(h) &&
      h !== 'localhost' &&
      h !== '127.0.0.1' &&
      h !== '0.0.0.0'
  );
}

/**
 * Base URL for the Flask API.
 *
 * 1) `EXPO_PUBLIC_API_URL` si défini au lancement de Metro (`http://IP:5001`).
 * 2) Sinon, IP déduite du packager Expo (téléphone + Expo Go / dev).
 * 3) Sinon : émulateur Android → 10.0.2.2 ; iOS simulateur / fallback → 127.0.0.1
 */
export function getApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && typeof fromEnv === 'string') {
    return stripTrailingSlash(fromEnv);
  }

  if (Platform.OS === 'web') {
    return `http://127.0.0.1:${DEFAULT_PORT}`;
  }

  const candidates = collectDevHosts();
  const lan = firstLanHost(candidates);
  if (lan) {
    return `http://${lan}:${DEFAULT_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  return `http://127.0.0.1:${DEFAULT_PORT}`;
}
