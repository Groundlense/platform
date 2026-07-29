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
/**
 * USE_LOCAL_API — flip to true ONLY when the API is running on this
 * computer (docker-compose, port 8000) AND the app runs in the Android
 * EMULATOR. 10.0.2.2 is the emulator's alias for the host machine; on a
 * physical phone it points at nothing, so every request fails with
 * "Network Error" and the app behaves as if it were offline.
 *
 * Default false: debug builds talk to the same production API as release
 * builds — works on any device with no local setup.
 * (Physical-device alternative for local dev: `adb reverse tcp:8000
 * tcp:8000` and use http://localhost:8000/api/v1.)
 */
const USE_LOCAL_API = false;

export const API_BASE_URL =
  __DEV__ && USE_LOCAL_API
    ? 'http://10.0.2.2:8000/api/v1'
    : 'https://platform-1bi0.onrender.com/api/v1';
