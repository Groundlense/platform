import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';
import { api } from '../services/api';
import MockCameraModal from '../components/MockCameraModal';

const SPT_INTERVAL_M = 1.5;

function toNum(val: any): number | null {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function fmtDateTime(iso: any): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function StartBoringScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, isResuming } = route.params || {};
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  const [weather, setWeather] = useState('Clear');
  const [starting, setStarting] = useState(false);
  
  const [cameraVisible, setCameraVisible] = useState(false);
  const [rigPhotoCaptured, setRigPhotoCaptured] = useState(false);
  const [rigPhotoBase64, setRigPhotoBase64] = useState<string | null>(null);
  const [rigPhotoFilename, setRigPhotoFilename] = useState<string | null>(null);

  // Real resume context — computed from sessions/intervals, never invented
  const [resumeDepth, setResumeDepth] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastSession, setLastSession] = useState<any>(null);

  const resuming = !!isResuming || borehole?.status === 'TERMINATED';

  const plannedLat = toNum(borehole?.latitude);
  const plannedLng = toNum(borehole?.longitude);
  const hasPlannedCoords = plannedLat !== null && plannedLng !== null;

  useEffect(() => {
    if (borehole?.id) {
      loadResumeContext();
    }
  }, [borehole?.id]);

  const loadResumeContext = async () => {
    try {
      // Prefer the server's session history when reachable
      let sessions: any[] = [];
      try {
        const serverSessions = await api.getBoreholeSessions(borehole.id);
        if (Array.isArray(serverSessions) && serverSessions.length > 0) {
          sessions = serverSessions;
        }
      } catch (apiErr) {
        // Offline — fall back to the locally stored sessions
      }
      if (sessions.length === 0) {
        sessions = await storage.getBoringSessions(borehole.id);
      }

      const sorted = [...sessions].sort(
        (a, b) => new Date(a.startedAt || 0).getTime() - new Date(b.startedAt || 0).getTime()
      );
      const last = sorted.length > 0 ? sorted[sorted.length - 1] : null;

      let depth = toNum(last?.endDepth);

      // No session record — fall back to the deepest locally recorded interval
      if (depth === null) {
        const intervals = await storage.getIntervals(borehole.id);
        const maxTo = intervals.reduce((max: number, iv: any) => {
          const to = toNum(iv?.toDepth);
          return to !== null && to > max ? to : max;
        }, 0);
        depth = maxTo > 0 ? maxTo : null;
      }

      setSessionCount(sorted.length);
      setLastSession(last);
      setResumeDepth(depth !== null && depth > 0 ? depth : 0);
    } catch (err) {
      console.warn('Could not load resume context', err);
    }
  };

  const startDepth = resuming ? resumeDepth : 0;
  const nextIntervalNo = Math.floor(startDepth / SPT_INTERVAL_M) + 1;

  const handleOpenMaps = () => {
    if (!hasPlannedCoords) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${plannedLat},${plannedLng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Google Maps on this device.');
    });
  };

  const handleStartBoring = async () => {
    if (starting) return;
    setStarting(true);
    try {
      // Try to open a real server session; fall back to a local-only record offline
      let sessionId = `sess-${Date.now()}`;
      try {
        const serverSession = await api.startBoringSession(borehole.id, startDepth);
        if (serverSession?.id) {
          sessionId = serverSession.id;
        }
      } catch (apiErr) {
        // Offline — keep the locally generated session id
      }

      const cachedBoreholes = await storage.getBoreholes(projectId);
      const updated = cachedBoreholes.map((bh: any) => {
        if (bh.id === borehole.id) {
          return {
            ...bh,
            status: 'IN_PROGRESS',
            currentDepth: startDepth,
            weather,
          };
        }
        return bh;
      });
      await storage.saveBoreholes(projectId, updated);

      // Record the boring session locally (works offline)
      const newSession = {
        id: sessionId,
        boreholeId: borehole.id,
        startDepth,
        weather,
        startedAt: new Date().toISOString(),
        status: 'IN_PROGRESS',
      };
      const sessions = await storage.getBoringSessions(borehole.id);
      sessions.push(newSession);
      await storage.saveBoringSessions(borehole.id, sessions);

      // Queue sync actions
      await syncManager.queueOperation(
        'BORING',
        borehole.id,
        'UPDATE',
        { status: 'IN_PROGRESS', weather },
        sessionId
      );

      // Upload captured rig photo
      if (rigPhotoBase64 && rigPhotoFilename) {
        const intervalId = `interval-${borehole.id}-${nextIntervalNo}`;
        try {
          await api.uploadMedia(intervalId, rigPhotoBase64, rigPhotoFilename);
        } catch (apiErr) {
          await syncManager.queueOperation(
            'PHOTO',
            `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            'CREATE',
            {
              intervalId,
              fileName: rigPhotoFilename,
              mimeType: 'image/jpeg',
              base64Data: rigPhotoBase64,
            },
            sessionId
          );
        }
      }

      // Navigate to SPT entry loop screen
      navigation.replace('SPTEntry', {
        borehole: updated.find((bh: any) => bh.id === borehole.id) || borehole,
        projectId,
        sessionId,
        currentDepth: startDepth,
        intervalNo: nextIntervalNo,
        sessionNumber: sessionCount + 1,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to start boring');
    } finally {
      setStarting(false);
    }
  };

  // Honest error state when opened without a borehole
  if (!borehole?.id || !projectId) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>{t('startBoringBtn', lang)}</Text>
        </View>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>No borehole selected / कोई बोरहोल नहीं चुना गया</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.startBtnText}>{t('back', lang)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {borehole.boreholeCode} · {resuming ? 'Resume' : 'Start'}
          </Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>{lang === 'hi' ? 'En' : 'हिं'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>
          {resuming
            ? `Continuing from ${resumeDepth.toFixed(1)}m`
            : 'Navigate to location'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Resume banner — non-dismissable, real previous-session context */}
        {resuming && (
          <View style={styles.resumeBanner}>
            <Text style={styles.resumeTitle}>↩ Resuming from previous session / पिछले सेशन से जारी</Text>
            <View style={styles.resumeRow}>
              <Text style={styles.resumeLbl}>Terminated at / यहाँ रुका</Text>
              <Text style={styles.resumeVal}>
                {[
                  `${resumeDepth.toFixed(1)}m`,
                  fmtDateTime(lastSession?.endedAt),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <View style={styles.resumeRow}>
              <Text style={styles.resumeLbl}>Reason / कारण</Text>
              <Text style={styles.resumeVal}>
                {lastSession?.terminationReason || 'Not recorded / दर्ज नहीं'}
              </Text>
            </View>
            {!!lastSession?.worker && (
              <View style={styles.resumeRow}>
                <Text style={styles.resumeLbl}>Previous worker / पिछला कर्मचारी</Text>
                <Text style={styles.resumeVal}>
                  {[
                    [lastSession.worker.firstName, lastSession.worker.lastName]
                      .filter(Boolean)
                      .join(' '),
                    lastSession.worker.employeeCode,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            )}
            {sessionCount > 0 && (
              <View style={styles.resumeRow}>
                <Text style={styles.resumeLbl}>Previous session / पिछला सेशन</Text>
                <Text style={styles.resumeVal}>Session {sessionCount}</Text>
              </View>
            )}
            <View style={styles.resumeRow}>
              <Text style={styles.resumeLbl}>Resuming from / यहाँ से शुरू</Text>
              <Text style={[styles.resumeVal, styles.resumeValRust]}>
                {resumeDepth.toFixed(1)}m · Session {sessionCount + 1} · Interval {nextIntervalNo}
              </Text>
            </View>
            <Text style={styles.resumeAuto}>Restart depth auto-detected from recorded data / गहराई अपने आप मिली</Text>
          </View>
        )}

        {/* Planned location card — real coordinates from the engineer's plan */}
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>📍 Planned location / नियोजित स्थान</Text>
          {hasPlannedCoords ? (
            <Text style={styles.locationCoords}>
              Lat {plannedLat!.toFixed(6)} · Lng {plannedLng!.toFixed(6)}
            </Text>
          ) : (
            <Text style={styles.locationMissing}>
              Planned coordinates not set for this borehole / निर्देशांक उपलब्ध नहीं
            </Text>
          )}
          <TouchableOpacity
            style={[styles.mapButton, !hasPlannedCoords && styles.mapButtonDisabled]}
            onPress={handleOpenMaps}
            disabled={!hasPlannedCoords}
          >
            <Text style={styles.mapBtnText}>{t('openMaps', lang)}</Text>
          </TouchableOpacity>
        </View>

        {/* Honest GPS notice — no GPS module installed in this build */}
        <View style={styles.infoBoxAmber}>
          <Text style={styles.infoBoxAmberTitle}>
            GPS auto-capture coming soon / GPS जल्द आ रहा है
          </Text>
          <Text style={styles.infoBoxAmberSub}>
            GPS auto-capture requires the device app build with location permissions. Use Open
            Google Maps to navigate to the planned point.
          </Text>
        </View>

        {/* Rig photo */}
        <Text style={styles.fieldLabel}>Rig photo / रिग की फोटो</Text>
        <TouchableOpacity
          style={[styles.cameraBtn, rigPhotoCaptured && styles.cameraBtnDone]}
          onPress={() => setCameraVisible(true)}
        >
          <Text style={[styles.cameraBtnText, rigPhotoCaptured && styles.cameraBtnTextDone]}>
            {rigPhotoCaptured ? '✓ Rig Photo Captured / फोटो ले लिया गया' : '📷 Capture Rig Photo / रिग की फोटो लें'}
          </Text>
        </TouchableOpacity>

        {/* Weather Selector */}
        <Text style={styles.fieldLabel}>{t('weather', lang)}</Text>
        <View style={styles.horizontalRow}>
          {['Clear', 'Cloudy', 'Rainy', 'Hot'].map((w) => {
            const isSelected = weather === w;
            return (
              <TouchableOpacity
                key={w}
                style={[styles.tileQuarter, isSelected && styles.tileQuarterSelected]}
                onPress={() => setWeather(w)}
              >
                <Text style={[styles.tileQuarterText, isSelected && styles.tileQuarterTextSelected]}>
                  {w === 'Clear' && '☀️ Clear'}
                  {w === 'Cloudy' && '⛅ Cloudy'}
                  {w === 'Rainy' && '🌧️ Rainy'}
                  {w === 'Hot' && '🔥 Hot'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStartBoring} disabled={starting}>
          <Text style={styles.startBtnText}>
            ▶ {resuming ? `${t('resume', lang)} — ${resumeDepth.toFixed(1)}m` : t('startBoringBtn', lang)}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Simulated Viewfinder Overlay */}
      <MockCameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCapture={(base64, filename) => {
          setRigPhotoCaptured(true);
          setRigPhotoBase64(base64);
          setRigPhotoFilename(filename);
        }}
        boreholeCode={borehole.boreholeCode}
        depth={startDepth}
        photoType="Rig Photo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  headerBar: {
    backgroundColor: colors.rust,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.white,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  langText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 14,
    color: '#F5C4B3',
    marginTop: 2,
  },
  scrollContainer: {
    padding: 16,
  },
  errorBox: {
    margin: 16,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.grayDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  resumeBanner: {
    backgroundColor: colors.amberLight,
    borderWidth: 1.5,
    borderColor: colors.amber,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  resumeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.amber,
    marginBottom: 6,
  },
  resumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  resumeLbl: {
    fontSize: 12,
    color: colors.grayMid,
  },
  resumeVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.grayDark,
    flexShrink: 1,
    textAlign: 'right',
  },
  resumeValRust: {
    color: colors.rust,
  },
  resumeAuto: {
    fontSize: 11,
    color: colors.grayMid,
    marginTop: 4,
  },
  locationCard: {
    backgroundColor: colors.blueLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#85B7EB',
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.blueDark,
  },
  locationCoords: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 14,
    color: colors.blueDark,
    marginTop: 4,
  },
  locationMissing: {
    fontSize: 12,
    color: colors.grayMid,
    marginTop: 4,
  },
  mapButton: {
    backgroundColor: colors.amber,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  mapButtonDisabled: {
    backgroundColor: colors.grayBorder,
  },
  mapBtnText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
  },
  infoBoxAmber: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  infoBoxAmberTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.amber,
  },
  infoBoxAmberSub: {
    fontSize: 12,
    color: colors.grayMid,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.grayMid,
    marginBottom: 4,
    marginTop: 8,
  },
  cameraBtn: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cameraBtnDone: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenMid,
  },
  cameraBtnText: {
    fontSize: 15,
    color: colors.grayDark,
    fontWeight: '700',
  },
  cameraBtnTextDone: {
    color: colors.greenDark,
  },
  horizontalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 16,
  },
  tileQuarter: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tileQuarterSelected: {
    backgroundColor: colors.blueLight,
    borderColor: colors.blueDark,
    borderWidth: 1.5,
  },
  tileQuarterText: {
    fontSize: 12,
    color: colors.grayDark,
    fontWeight: '600',
  },
  tileQuarterTextSelected: {
    fontWeight: '700',
    color: colors.blueDark,
  },
  startBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  startBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
