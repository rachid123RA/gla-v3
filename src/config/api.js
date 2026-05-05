import { Platform } from 'react-native';

/**
 * Base URL for the Flask API.
 *
 * Prefer configuring it explicitly so it works on real devices:
 * - EXPO_PUBLIC_API_URL=http://192.168.x.x:5000
 *
 * Fallbacks:
 * - Web: http://localhost:5001
 * - Android emulator: http://10.0.2.2:5001 (maps to host localhost)
 * - iOS simulator: http://localhost:5001
 */
export function getApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && typeof fromEnv === 'string') return fromEnv.replace(/\/$/, '');

  // Note: macOS can have port 5000 reserved; we default to 5001.
  if (Platform.OS === 'android') return 'http://10.0.2.2:5001';
  return 'http://localhost:5001';
}

