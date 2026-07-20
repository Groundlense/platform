import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL } from '../config';
import { api } from '../services/api';
import { media } from '../services/media';
import { storage } from '../services/storage';
import { colors, typography } from '../utils/theme';

/**
 * Photos of one borehole — queued (waiting for sync) and already synced —
 * with a tap-to-open lightbox showing the full geo-tag record: sub-structure,
 * structure type, chainage, span, capture GPS and time, like the banner
 * burned into the uploaded image. All values are real: borehole context from
 * the record, GPS/time from the device at capture; missing values show "—".
 */

interface GalleryPhoto {
  key: string;
  uri: string;
  headers?: Record<string, string>;
  pending: boolean;
  purpose: string | null;
  intervalNo: number | null;
  gpsLat: number | null;
  gpsLng: number | null;
  accuracyM: number | null;
  takenAt: string | null;
}

function num(v: any): number | null {
  const n = Number(v);
  return v != null && Number.isFinite(n) ? n : null;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

function fmtGps(p: GalleryPhoto): string {
  if (p.gpsLat == null || p.gpsLng == null) return 'Not captured / दर्ज नहीं';
  const acc = p.accuracyM != null ? ` (±${Math.round(p.accuracyM)} m)` : '';
  return `${Math.abs(p.gpsLat).toFixed(6)}°${p.gpsLat >= 0 ? 'N' : 'S'}, ${Math.abs(p.gpsLng).toFixed(6)}°${p.gpsLng >= 0 ? 'E' : 'W'}${acc}`;
}

export default function PhotoGallery({ borehole }: { borehole: any }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);

  const load = useCallback(async () => {
    try {
      const result: GalleryPhoto[] = [];

      // 1. Locally queued photos (not yet synced)
      const queue = await media.getPhotoQueue();
      for (const q of queue.filter((p) => p.boreholeId === borehole.id)) {
        result.push({
          key: `local-${q.id}`,
          uri: q.uri,
          pending: true,
          purpose: q.purpose,
          intervalNo: q.intervalNo,
          gpsLat: num(q.gpsLat),
          gpsLng: num(q.gpsLng),
          accuracyM: num(q.accuracyM),
          takenAt: q.takenAt ?? null,
        });
      }

      // 2. Photos already on the server (reachable only with network — an
      // offline device simply shows its queued photos)
      const token = await storage.getToken();
      if (token) {
        const intervals = await storage.getIntervals(borehole.id);
        const serverIntervals = intervals.filter(
          (iv: any) =>
            typeof iv.id === 'string' &&
            iv.id.length > 0 &&
            !iv.id.startsWith('interval-'),
        );
        for (const iv of serverIntervals) {
          try {
            const rows = await api.getIntervalMedia(iv.id);
            for (const m of Array.isArray(rows) ? rows : []) {
              if (!m.mimeType?.startsWith('image/')) continue;
              result.push({
                key: `server-${m.id}`,
                uri: `${API_BASE_URL}/media/${m.id}/file`,
                headers: { Authorization: `Bearer ${token}` },
                pending: false,
                purpose: m.photoType ?? null,
                intervalNo: iv.intervalNo ?? null,
                gpsLat: num(m.gpsLat),
                gpsLng: num(m.gpsLng),
                accuracyM: num(m.accuracyM),
                takenAt: m.takenAt ?? m.createdAt ?? null,
              });
            }
          } catch {
            // offline / interval fetch failed — show what we have
          }
        }
      }

      setPhotos(result);
    } finally {
      setLoading(false);
    }
  }, [borehole?.id]);

  useEffect(() => {
    if (borehole?.id) load();
  }, [borehole?.id, load]);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.rustMid} />
      </View>
    );
  }

  if (photos.length === 0) return null; // nothing captured yet — no empty box

  const detailRows: Array<[string, string]> = selected
    ? [
        ['Location / Sub-structure', [borehole.boreholeCode, borehole.name && borehole.name !== borehole.boreholeCode ? borehole.name : null].filter(Boolean).join(' · ')],
        ['Structure Type', borehole.structureType || '—'],
        ['Chainage', borehole.chainage || '—'],
        ['Span', borehole.span || '—'],
        ['GPS (capture)', fmtGps(selected)],
        ['Date / Time', fmtDateTime(selected.takenAt)],
        ['Type', `${selected.purpose ?? '—'}${selected.intervalNo != null ? ` · interval #${selected.intervalNo}` : ''}`],
        ['Status', selected.pending ? '⏳ Waiting for sync / सिंक बाकी' : '✓ Synced / सिंक हो गया'],
      ]
    : [];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        📷 Photos / फोटो ({photos.length})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {photos.map((p) => (
          <TouchableOpacity key={p.key} style={styles.thumbBox} onPress={() => setSelected(p)}>
            <Image
              source={{ uri: p.uri, headers: p.headers }}
              style={styles.thumb}
              resizeMode="cover"
            />
            {p.pending && <Text style={styles.pendingBadge}>⏳</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Brand row — logo + wordmark, like the stamped image */}
            <View style={styles.modalBrand}>
              <View style={styles.modalBrandLeft}>
                <Image
                  source={require('../assets/groundlense-logo.png')}
                  style={styles.modalLogo}
                  resizeMode="contain"
                />
                <Text style={styles.modalBrandText}>GROUNDLENSE</Text>
              </View>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView>
                <Image
                  source={{ uri: selected.uri, headers: selected.headers }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <View style={styles.detailBox}>
                  {detailRows.map(([label, value]) => (
                    <View key={label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{label}</Text>
                      <Text style={styles.detailValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    padding: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: typography.fontSizeCaption,
    fontWeight: '700',
    color: colors.grayDark,
    marginBottom: 8,
  },
  thumbBox: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.grayBorder,
  },
  thumb: {
    width: 84,
    height: 84,
  },
  pendingBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 14,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    maxHeight: '92%',
  },
  modalBrand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.rust,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalBrandLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  modalLogo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  modalBrandText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalClose: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.black,
  },
  detailBox: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: typography.fontSizeMicro,
    color: colors.grayMid,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginRight: 10,
  },
  detailValue: {
    fontSize: typography.fontSizeCaption,
    color: colors.grayDark,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
});
