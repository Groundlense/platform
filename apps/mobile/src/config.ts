/**
 * Central app configuration.
 *
 * API_BASE_URL
 * ------------
 * Default points to the ANDROID EMULATOR loopback address:
 *   10.0.2.2 is how the Android emulator reaches the host machine's
 *   `localhost` (where the NestJS API runs on port 3000 in development).
 *
 * You MUST change this single constant when running anywhere else:
 *   - iOS simulator:        'http://localhost:3000/api/v1'
 *   - Physical device:      'http://<your-computer-LAN-IP>:3000/api/v1'
 *                           (device and computer on the same Wi-Fi network)
 *   - Production:           'https://<your-api-domain>/api/v1'
 *
 * All API calls go through services/api.ts, which imports this constant,
 * so this is the only place that needs editing.
 */
export const API_BASE_URL = 'http://10.0.2.2:8000/api/v1';
