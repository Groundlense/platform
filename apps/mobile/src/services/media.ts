import { Alert, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera } from 'react-native-image-picker';
import { location } from './location';
import { withStorageLock } from './storage';

/**
 * Real device-camera capture + a persistent photo upload queue.
 *
 * Photos are taken with the actual camera (react-native-image-picker) and
 * queued locally against (boreholeId, intervalNo). They are uploaded by
 * syncManager.syncWithServer() once the matching interval exists on the
 * server (server interval ids are UUIDs; local ids look like
 * `interval-<boreholeId>-<n>`). Nothing is ever faked: if the camera is
 * unavailable or permission is denied, the worker is told honestly and the
 * flow continues without a photo.
 */

const PHOTO_QUEUE_KEY = '@photo_queue';

export type PhotoPurpose =
  | 'SPT'
  | 'CORE_BOX'
  | 'CLOSURE'
  | 'CLOSURE_VIDEO'
  | 'SAMPLE'
  | 'SITE_SETUP';

export interface CapturedPhoto {
  uri: string;
  fileName: string;
  type: string; // mime type, e.g. image/jpeg
  /** Real device GPS at capture time, when available (never fabricated). */
  gpsLat?: number;
  gpsLng?: number;
  accuracyM?: number;
}

export interface QueuedPhoto {
  id: string;
  boreholeId: string;
  intervalNo: number;
  purpose: PhotoPurpose;
  uri: string;
  fileName: string;
  mimeType: string;
  takenAt: string; // ISO timestamp
  /** GPS stamp captured with the photo (uploaded with the file). */
  gpsLat?: number;
  gpsLng?: number;
  accuracyM?: number;
  /** Hard upload failures (4xx reject, or errors while network was up). */
  failCount?: number;
  /** Last failure detail, for the gallery's error badge. */
  lastFailure?: string;
  /**
   * Parked after repeated hard failures: no longer retried (so a 413-too-
   * big video or a purged cache file stops dragging a full sync every 15s)
   * but NEVER deleted — the entry stays visible with an error badge so the
   * worker knows this evidence did not reach the server.
   */
  parked?: boolean;
}

// Registered by the sync manager (avoids a module-init import cycle):
// queuing a photo kicks off its upload immediately instead of leaving it
// to wait for the next 15s background tick.
let onPhotoQueued: (() => void) | null = null;
export function setOnPhotoQueued(cb: () => void): void {
  onPhotoQueued = cb;
}

// Set once launchCamera reports there is no usable camera on this device.
// Screens use this to avoid nagging the worker about photos that are
// physically impossible to take.
let cameraKnownUnavailable = false;

async function ensureAndroidCameraPermission(
  lang: 'en' | 'hi' = 'hi'
): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
    if (alreadyGranted) return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: lang === 'en' ? 'Camera permission' : 'कैमरा अनुमति',
        message:
          lang === 'en'
            ? 'GroundLense needs the camera to photograph samples for the boring record.'
            : 'नमूनों की फोटो लेने के लिए कैमरा चाहिए।',
        buttonPositive: lang === 'en' ? 'Allow' : 'अनुमति दें',
        buttonNegative: lang === 'en' ? 'Deny' : 'मना करें',
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export const media = {
  /** True once the device has reported it has no usable camera. */
  isCameraKnownUnavailable(): boolean {
    return cameraKnownUnavailable;
  },

  /**
   * Opens the REAL camera and returns the captured file, or null if the
   * worker cancelled / the camera is unavailable / permission was denied
   * (each failure shows an honest Alert — nothing is fabricated).
   */
  async capturePhoto(
    purpose: PhotoPurpose,
    lang: 'en' | 'hi' = 'hi'
  ): Promise<CapturedPhoto | null> {
    const permitted = await ensureAndroidCameraPermission(lang);
    if (!permitted) {
      Alert.alert(
        lang === 'en'
          ? 'Camera permission denied'
          : 'कैमरा अनुमति नहीं मिली',
        lang === 'en'
          ? 'Allow camera access in phone settings to attach a real photo. You can continue without one.'
          : 'फोन सेटिंग्स में कैमरा अनुमति दें। बिना फोटो भी जारी रख सकते हैं।'
      );
      return null;
    }

    // Start acquiring a GPS fix while the worker frames the shot — silent:
    // a photo without coordinates is still a valid photo.
    const gpsPromise = location.getCurrentPosition({ silent: true });

    // maxWidth/maxHeight are what keep this from crashing the app on
    // high-megapixel phones. Requesting a re-encode (quality) forces the
    // library to decode the capture into an uncompressed bitmap first, and at
    // full sensor resolution a 48 MP shot needs ~190 MB of native heap — far
    // past the process limit, so Android kills the app ("keeps stopping")
    // rather than raising anything JS could catch. With a bound set, the
    // decode downsamples to the target instead, so peak memory depends on
    // these numbers and not on the phone's camera. 1920 px keeps enough
    // detail to read soil texture and core condition, and lands the file
    // small enough for the 2G/3G uploads these are queued for.
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 1920,
      maxHeight: 1920,
      saveToPhotos: false,
      cameraType: 'back',
    });

    if (result.didCancel) return null;

    if (result.errorCode) {
      if (result.errorCode === 'camera_unavailable') {
        cameraKnownUnavailable = true;
        Alert.alert(
          lang === 'en' ? 'Camera unavailable' : 'कैमरा उपलब्ध नहीं',
          lang === 'en'
            ? 'No usable camera was found on this device. Continue without a photo.'
            : 'इस डिवाइस पर कैमरा नहीं मिला। बिना फोटो जारी रखें।'
        );
      } else if (result.errorCode === 'permission') {
        Alert.alert(
          lang === 'en'
            ? 'Camera permission denied'
            : 'कैमरा अनुमति नहीं मिली',
          lang === 'en'
            ? 'Allow camera access in phone settings to attach a real photo.'
            : 'फोन सेटिंग्स में कैमरा अनुमति दें।'
        );
      } else {
        Alert.alert(
          lang === 'en' ? 'Camera error' : 'कैमरा त्रुटि',
          result.errorMessage ||
            (lang === 'en'
              ? 'The camera could not be opened.'
              : 'कैमरा नहीं खुल सका।')
        );
      }
      return null;
    }

    const asset = result.assets && result.assets[0];
    if (!asset?.uri) return null;

    const fix = await gpsPromise;

    const mimeType = asset.type || 'image/jpeg';
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    return {
      uri: asset.uri,
      fileName: asset.fileName || `${purpose.toLowerCase()}_${Date.now()}.${ext}`,
      type: mimeType,
      ...(fix
        ? { gpsLat: fix.lat, gpsLng: fix.lng, accuracyM: fix.accuracyM ?? undefined }
        : {}),
    };
  },

  /**
   * Records a VIDEO with the real camera (closure / rig-removal depth
   * verification). Same honesty rules as capturePhoto: null on cancel,
   * unavailability or denied permission — never a fabricated file.
   */
  async captureVideo(
    purpose: PhotoPurpose,
    lang: 'en' | 'hi' = 'hi'
  ): Promise<CapturedPhoto | null> {
    const permitted = await ensureAndroidCameraPermission(lang);
    if (!permitted) {
      Alert.alert(
        lang === 'en' ? 'Camera permission denied' : 'कैमरा अनुमति नहीं मिली',
        lang === 'en'
          ? 'Allow camera access in phone settings to record the video.'
          : 'वीडियो के लिए फोन सेटिंग्स में कैमरा अनुमति दें।'
      );
      return null;
    }

    const gpsPromise = location.getCurrentPosition({ silent: true });

    const result = await launchCamera({
      mediaType: 'video',
      videoQuality: 'low', // field uploads ride on 2G/3G — keep files small
      durationLimit: 90,
      saveToPhotos: false,
      cameraType: 'back',
    });

    if (result.didCancel) return null;

    if (result.errorCode) {
      if (result.errorCode === 'camera_unavailable') {
        cameraKnownUnavailable = true;
        Alert.alert(
          lang === 'en' ? 'Camera unavailable' : 'कैमरा उपलब्ध नहीं',
          lang === 'en'
            ? 'No usable camera was found on this device.'
            : 'इस डिवाइस पर कैमरा नहीं मिला।'
        );
      } else {
        Alert.alert(
          lang === 'en' ? 'Camera error' : 'कैमरा त्रुटि',
          result.errorMessage ||
            (lang === 'en' ? 'The camera could not be opened.' : 'कैमरा नहीं खुल सका।')
        );
      }
      return null;
    }

    const asset = result.assets && result.assets[0];
    if (!asset?.uri) return null;

    const fix = await gpsPromise;

    const mimeType = asset.type || 'video/mp4';
    return {
      uri: asset.uri,
      fileName: asset.fileName || `${purpose.toLowerCase()}_${Date.now()}.mp4`,
      type: mimeType,
      ...(fix
        ? { gpsLat: fix.lat, gpsLng: fix.lng, accuracyM: fix.accuracyM ?? undefined }
        : {}),
    };
  },

  // --- Persistent photo queue ---
  // All mutations are serialized through withStorageLock — unserialized
  // read-modify-write here could drop a queued photo or resurrect a
  // removed one (duplicate upload).

  async getPhotoQueue(): Promise<QueuedPhoto[]> {
    const data = await AsyncStorage.getItem(PHOTO_QUEUE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      console.warn('[Media] Corrupted photo queue ignored');
      return [];
    }
  },

  /** Atomic read-modify-write on the photo queue. */
  async mutatePhotoQueue(
    mutator: (queue: QueuedPhoto[]) => QueuedPhoto[],
  ): Promise<QueuedPhoto[]> {
    return withStorageLock(PHOTO_QUEUE_KEY, async () => {
      const queue = await this.getPhotoQueue();
      const next = mutator(queue);
      await AsyncStorage.setItem(PHOTO_QUEUE_KEY, JSON.stringify(next));
      return next;
    });
  },

  async savePhotoQueue(queue: QueuedPhoto[]): Promise<void> {
    await withStorageLock(PHOTO_QUEUE_KEY, () =>
      AsyncStorage.setItem(PHOTO_QUEUE_KEY, JSON.stringify(queue)),
    );
  },

  /**
   * Queues a captured photo for upload on the next successful sync.
   * Returns the stored queue entry (with its generated id).
   */
  async queuePhoto(photo: Omit<QueuedPhoto, 'id'>): Promise<QueuedPhoto> {
    const entry: QueuedPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...photo,
    };
    await this.mutatePhotoQueue((queue) => [...queue, entry]);
    // Start the upload right away (no-op offline — the photo stays queued
    // and the background sync retries it).
    onPhotoQueued?.();
    return entry;
  },

  async removePhoto(id: string): Promise<void> {
    await this.mutatePhotoQueue((queue) => queue.filter((p) => p.id !== id));
  },

  /**
   * Records a hard upload failure (server 4xx reject, or an error while the
   * network was provably up). After 3 hard failures the photo is parked —
   * kept and visible, no longer auto-retried.
   */
  async markPhotoFailure(id: string, reason: string): Promise<void> {
    await this.mutatePhotoQueue((queue) =>
      queue.map((p) => {
        if (p.id !== id) return p;
        const failCount = (p.failCount ?? 0) + 1;
        return {
          ...p,
          failCount,
          lastFailure: reason,
          parked: failCount >= 3 ? true : p.parked,
        };
      }),
    );
  },

  /** Photos still eligible for upload (not parked). */
  async getUploadablePhotos(): Promise<QueuedPhoto[]> {
    const queue = await this.getPhotoQueue();
    return queue.filter((p) => !p.parked);
  },

  /** Number of photos still waiting to upload for one borehole. */
  async pendingCountForBorehole(boreholeId: string): Promise<number> {
    const queue = await this.getPhotoQueue();
    return queue.filter((p) => p.boreholeId === boreholeId && !p.parked).length;
  },
};
