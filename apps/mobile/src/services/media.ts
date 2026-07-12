import { Alert, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera } from 'react-native-image-picker';
import { location } from './location';

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
}

// Set once launchCamera reports there is no usable camera on this device.
// Screens use this to avoid nagging the worker about photos that are
// physically impossible to take.
let cameraKnownUnavailable = false;

async function ensureAndroidCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
    if (alreadyGranted) return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera permission / कैमरा अनुमति',
        message:
          'GroundLense needs the camera to photograph samples for the boring record. / नमूनों की फोटो लेने के लिए कैमरा चाहिए।',
        buttonPositive: 'Allow / अनुमति दें',
        buttonNegative: 'Deny / मना करें',
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
  async capturePhoto(purpose: PhotoPurpose): Promise<CapturedPhoto | null> {
    const permitted = await ensureAndroidCameraPermission();
    if (!permitted) {
      Alert.alert(
        'Camera permission denied / कैमरा अनुमति नहीं मिली',
        'Allow camera access in phone settings to attach a real photo. You can continue without one. / फोन सेटिंग्स में कैमरा अनुमति दें। बिना फोटो भी जारी रख सकते हैं।'
      );
      return null;
    }

    // Start acquiring a GPS fix while the worker frames the shot — silent:
    // a photo without coordinates is still a valid photo.
    const gpsPromise = location.getCurrentPosition({ silent: true });

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.7,
      saveToPhotos: false,
      cameraType: 'back',
    });

    if (result.didCancel) return null;

    if (result.errorCode) {
      if (result.errorCode === 'camera_unavailable') {
        cameraKnownUnavailable = true;
        Alert.alert(
          'Camera unavailable / कैमरा उपलब्ध नहीं',
          'No usable camera was found on this device. Continue without a photo. / इस डिवाइस पर कैमरा नहीं मिला। बिना फोटो जारी रखें।'
        );
      } else if (result.errorCode === 'permission') {
        Alert.alert(
          'Camera permission denied / कैमरा अनुमति नहीं मिली',
          'Allow camera access in phone settings to attach a real photo. / फोन सेटिंग्स में कैमरा अनुमति दें।'
        );
      } else {
        Alert.alert(
          'Camera error / कैमरा त्रुटि',
          result.errorMessage ||
            'The camera could not be opened. / कैमरा नहीं खुल सका।'
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

  // --- Persistent photo queue ---

  async getPhotoQueue(): Promise<QueuedPhoto[]> {
    const data = await AsyncStorage.getItem(PHOTO_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async savePhotoQueue(queue: QueuedPhoto[]): Promise<void> {
    await AsyncStorage.setItem(PHOTO_QUEUE_KEY, JSON.stringify(queue));
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
    const queue = await this.getPhotoQueue();
    queue.push(entry);
    await this.savePhotoQueue(queue);
    return entry;
  },

  async removePhoto(id: string): Promise<void> {
    const queue = await this.getPhotoQueue();
    await this.savePhotoQueue(queue.filter((p) => p.id !== id));
  },

  /** Number of photos still waiting to upload for one borehole. */
  async pendingCountForBorehole(boreholeId: string): Promise<number> {
    const queue = await this.getPhotoQueue();
    return queue.filter((p) => p.boreholeId === boreholeId).length;
  },
};
