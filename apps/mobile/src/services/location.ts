/**
 * Real device GPS — position capture, live watching, and geodesy helpers
 * for guiding field workers to the planned borehole location.
 *
 * No position is ever fabricated: every value comes from the device's
 * location provider, and callers receive `null` (with an honest Alert on
 * explicit denial) when GPS is unavailable.
 */
import { Alert, PermissionsAndroid, Platform } from 'react-native';

export interface GpsFix {
  lat: number;
  lng: number;
  /** Horizontal accuracy radius in meters, when the provider reports it. */
  accuracyM: number | null;
  takenAt: string;
}

/**
 * Lazy, guarded access to the native geolocation module. If the app binary
 * was built before the library was installed (native module not linked),
 * GPS features degrade to an honest "unavailable" state instead of crashing
 * the whole app. A full rebuild (`npx react-native run-android`) enables GPS.
 */
let geolocationModule: any | null | undefined; // undefined = not probed yet
function getGeolocation(): any | null {
  if (geolocationModule !== undefined) return geolocationModule;
  try {
    const mod = require('@react-native-community/geolocation').default;
    mod.setRNConfiguration({
      skipPermissionRequests: true, // we request explicitly below
      locationProvider: 'auto',
    });
    geolocationModule = mod;
  } catch (err) {
    console.warn(
      '[Location] Native geolocation module not linked — rebuild the app with `npx react-native run-android` to enable GPS. Features degrade honestly until then.',
      err,
    );
    geolocationModule = null;
  }
  return geolocationModule;
}

let permissionDenied = false;

async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location needed / लोकेशन चाहिए',
        message:
          'GroundLense uses GPS to guide you to the borehole and to stamp field photos with the true location. / GPS से बोरहोल तक पहुँचने और फोटो पर सही लोकेशन दर्ज करने के लिए।',
        buttonPositive: 'Allow / अनुमति दें',
        buttonNegative: 'Deny / मना करें',
      },
    );
    const ok = granted === PermissionsAndroid.RESULTS.GRANTED;
    permissionDenied = !ok;
    return ok;
  } catch {
    return false;
  }
}

function toFix(pos: any): GpsFix {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracyM: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
    takenAt: new Date(pos.timestamp || Date.now()).toISOString(),
  };
}

export const location = {
  /** True once the user has explicitly denied — callers can stop nagging. */
  isPermissionKnownDenied(): boolean {
    return permissionDenied;
  },

  /**
   * One-shot position. `silent: true` (used for photo stamping) never shows
   * an Alert — a photo without GPS is still a valid photo.
   */
  async getCurrentPosition(opts?: { silent?: boolean }): Promise<GpsFix | null> {
    const Geolocation = getGeolocation();
    if (!Geolocation) {
      if (!opts?.silent) {
        Alert.alert(
          'GPS needs an app rebuild / GPS के लिए ऐप री-इंस्टॉल करें',
          'This app build does not include the GPS module yet. Reinstall/update the app to enable location. / ऐप को अपडेट करें।',
        );
      }
      return null;
    }
    const permitted = await ensureLocationPermission();
    if (!permitted) {
      if (!opts?.silent) {
        Alert.alert(
          'Location unavailable / लोकेशन उपलब्ध नहीं',
          'Allow location permission in Settings to use GPS guidance. / GPS मार्गदर्शन के लिए सेटिंग्स में लोकेशन अनुमति दें।',
        );
      }
      return null;
    }

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (pos: any) => resolve(toFix(pos)),
        () => {
          // Retry once on low accuracy/timeout with relaxed settings
          Geolocation.getCurrentPosition(
            (pos: any) => resolve(toFix(pos)),
            (err: any) => {
              if (!opts?.silent) {
                Alert.alert(
                  'GPS fix failed / GPS नहीं मिला',
                  `Move to open sky and try again. / खुले आसमान में जाकर दोबारा कोशिश करें। (${err?.message ?? 'no fix'})`,
                );
              }
              resolve(null);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      );
    });
  },

  /**
   * Live tracking for the reach-the-borehole screen. Returns a watch id;
   * ALWAYS clear it with clearWatch on unmount.
   */
  async watchPosition(onFix: (fix: GpsFix) => void): Promise<number | null> {
    const Geolocation = getGeolocation();
    if (!Geolocation) return null;
    const permitted = await ensureLocationPermission();
    if (!permitted) return null;
    return Geolocation.watchPosition(
      (pos: any) => onFix(toFix(pos)),
      () => {},
      { enableHighAccuracy: true, distanceFilter: 2, interval: 3000 } as any,
    );
  },

  clearWatch(watchId: number | null) {
    const Geolocation = getGeolocation();
    if (Geolocation && watchId !== null) Geolocation.clearWatch(watchId);
  },

  /** Great-circle distance in meters (haversine). */
  distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  },

  /** Initial bearing (degrees clockwise from north) from A to B. */
  bearingDegrees(aLat: number, aLng: number, bLat: number, bLng: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const y = Math.sin(toRad(bLng - aLng)) * Math.cos(toRad(bLat));
    const x =
      Math.cos(toRad(aLat)) * Math.sin(toRad(bLat)) -
      Math.sin(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.cos(toRad(bLng - aLng));
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  },

  /** Bilingual compass label + arrow for a bearing. */
  compassLabel(bearing: number): { arrow: string; en: string; hi: string } {
    const dirs = [
      { arrow: '↑', en: 'north', hi: 'उत्तर' },
      { arrow: '↗', en: 'north-east', hi: 'उत्तर-पूर्व' },
      { arrow: '→', en: 'east', hi: 'पूर्व' },
      { arrow: '↘', en: 'south-east', hi: 'दक्षिण-पूर्व' },
      { arrow: '↓', en: 'south', hi: 'दक्षिण' },
      { arrow: '↙', en: 'south-west', hi: 'दक्षिण-पश्चिम' },
      { arrow: '←', en: 'west', hi: 'पश्चिम' },
      { arrow: '↖', en: 'north-west', hi: 'उत्तर-पश्चिम' },
    ];
    return dirs[Math.round(bearing / 45) % 8];
  },

  formatDistance(m: number): string {
    return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
  },
};
