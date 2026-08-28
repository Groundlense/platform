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
import { useLanguage } from '../utils/LanguageContext';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';
import { api } from '../services/api';
import { media } from '../services/media';
import { location, GpsFix } from '../services/location';
import { rawDecimalCoords } from '../utils/geo';
import PhotoGallery from '../components/PhotoGallery';

function toNum(val: any): number | null {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function asList(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.intervals)) return v.intervals;
  return [];
}

function fmtDateTime(iso: any): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function StartBoringScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, isResuming } = route.params || {};
  const { lang, setLang } = useLanguage();

  const [weather, setWeather] = useState('Clear');
  const [starting, setStarting] = useState(false);
  
  const [rigPhotoCaptured, setRigPhotoCaptured] = useState(false);

  // Real resume context — computed from sessions/intervals, never invented
  const [resumeDepth, setResumeDepth] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastSession, setLastSession] = useState<any>(null);
  const [resumeReady, setResumeReady] = useState(false);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [nextRecordedInterval, setNextRecordedInterval] = useState<number | null>(null);

  // Project-level SPT spacing (set at project setup, locked once boring starts)
  const [sptIntervalM, setSptIntervalM] = useState(1.5);

  useEffect(() => {
    if (!projectId || !borehole?.id) return;
    storage.getSptInterval(projectId, borehole.id).then(setSptIntervalM).catch(() => {});
  }, [projectId, borehole?.id]);

  // Treat any borehole with recorded progress as a resume — an IN_PROGRESS
  // boring reopened from the list must continue from its last depth, never
  // restart at 0.0 m.
  const resuming =
    !!isResuming || borehole?.status === 'TERMINATED' || sessionCount > 0 || resumeDepth > 0;

  // Original coordinates as uploaded only — never a UTM-guessed conversion.
  // A wrong guess here would walk the worker to the wrong physical spot, so
  // if the value isn't already valid decimal degrees, guidance is disabled
  // (below) rather than risking a plausible-looking but wrong location.
  const plannedCoords = rawDecimalCoords(borehole?.latitude, borehole?.longitude);
  const plannedLat = plannedCoords?.lat ?? null;
  const plannedLng = plannedCoords?.lng ?? null;
  const hasPlannedCoords = plannedCoords !== null;

  // Live GPS tracker — guides the worker to the planned point
  const [gpsFix, setGpsFix] = useState<GpsFix | null>(null);
  const [gpsSearching, setGpsSearching] = useState(true);

  useEffect(() => {
    let watchId: number | null = null;
    let cancelled = false;
    (async () => {
      watchId = await location.watchPosition((fix) => {
        if (!cancelled) {
          setGpsFix(fix);
          setGpsSearching(false);
        }
      }, lang);
      if (watchId === null && !cancelled) setGpsSearching(false);
    })();
    return () => {
      cancelled = true;
      location.clearWatch(watchId);
    };
  }, []);

  const distanceM =
    gpsFix && hasPlannedCoords
      ? location.distanceMeters(gpsFix.lat, gpsFix.lng, plannedLat!, plannedLng!)
      : null;
  const bearing =
    gpsFix && hasPlannedCoords
      ? location.bearingDegrees(gpsFix.lat, gpsFix.lng, plannedLat!, plannedLng!)
      : null;
  // "Arrived" once within 30 m or within the GPS accuracy radius
  const arriveRadius = Math.max(30, gpsFix?.accuracyM ?? 0);
  const atLocation = distanceM !== null && distanceM <= arriveRadius;

  useEffect(() => {
    if (borehole?.id) {
      loadResumeContext();
    }
  }, [borehole?.id]);

  const loadResumeContext = async () => {
    try {
      const [sessionsRes, intervalsRes] = await Promise.allSettled([
        api.getBoreholeSessions(borehole.id),
        api.getBoreholeIntervals(borehole.id),
      ]);
      const serverSessions =
        sessionsRes.status === 'fulfilled' ? sessionsRes.value : [];
      const serverIntervals =
        intervalsRes.status === 'fulfilled' ? intervalsRes.value : [];
      const online = sessionsRes.status === 'fulfilled';

      const localSessions = await storage.getBoringSessions(borehole.id);
      const localIntervals = await storage.getIntervals(borehole.id);

      const depths: number[] = [];
      let maxIntervalNo = 0;

      // Ended sessions only — an open session's endDepth is still its start
      // depth (the upcoming test), which would skip or repeat a real SPT.
      for (const s of [...asList(serverSessions), ...localSessions]) {
        const ended = !!s?.endedAt || (s?.status && s.status !== 'IN_PROGRESS');
        if (!ended) continue;
        const d = toNum(s?.endDepth);
        if (d !== null) depths.push(d);
      }

      // Highest recorded SPT wins. Interval number is the reliable index:
      // after SPT 15 the next is 16, even if a paused session still says 15.0 m.
      for (const iv of [...asList(serverIntervals), ...localIntervals]) {
        const d = toNum(iv?.toDepth);
        if (d !== null) depths.push(d);
        const no = Number(iv?.intervalNo);
        if (Number.isInteger(no) && no > maxIntervalNo) maxIntervalNo = no;
      }

      const depth = depths.length > 0 ? Math.max(...depths) : 0;

      const history =
        online && asList(serverSessions).length > 0 ? serverSessions : localSessions;
      const sorted = [...asList(history)].sort(
        (a, b) => new Date(a.startedAt || 0).getTime() - new Date(b.startedAt || 0).getTime()
      );
      const open = [...sorted].reverse().find(
        (s) => !s?.endedAt && (!s?.status || s.status === 'IN_PROGRESS')
      );

      setSessionCount(sorted.length);
      setLastSession(sorted.length > 0 ? sorted[sorted.length - 1] : null);
      setResumeDepth(depth > 0 ? depth : 0);
      setNextRecordedInterval(maxIntervalNo > 0 ? maxIntervalNo + 1 : null);
      setOpenSessionId(open?.id ?? null);
    } catch (err) {
      console.warn('Could not load resume context', err);
    } finally {
      setResumeReady(true);
    }
  };

  // currentDepth handed to the SPT loop is the depth of the UPCOMING test
  // (the bottom of the interval about to be drilled). A fresh boring never
  // tests at 0.0 m — the first SPT happens one interval down (e.g. 1.5 m).
  // A resumed boring continues at the next grid depth after the deepest
  // recorded data. Prefer max(intervalNo)+1 when intervals exist so a stale
  // 15.0 m pause cannot send the worker back to SPT 11 after SPT 15.
  const startDepth = resuming
    ? nextRecordedInterval != null
      ? Math.round(nextRecordedInterval * sptIntervalM * 100) / 100
      : Math.round((Math.floor(resumeDepth / sptIntervalM + 1e-9) + 1) * sptIntervalM * 100) / 100
    : sptIntervalM;
  const nextIntervalNo =
    nextRecordedInterval != null
      ? nextRecordedInterval
      : Math.max(1, Math.round(startDepth / sptIntervalM));

  // Real camera capture — queued locally, uploaded on sync once the first
  // interval of this session exists on the server.
  const handleRigPhoto = async () => {
    const shot = await media.capturePhoto('SITE_SETUP', lang);
    if (!shot) return; // cancelled / unavailable / denied — honest Alert already shown
    await media.queuePhoto({
      boreholeId: borehole.id,
      intervalNo: nextIntervalNo,
      purpose: 'SITE_SETUP',
      uri: shot.uri,
      fileName: shot.fileName,
      mimeType: shot.type,
      gpsLat: shot.gpsLat,
      gpsLng: shot.gpsLng,
      accuracyM: shot.accuracyM,
      takenAt: new Date().toISOString(),
    });
    setRigPhotoCaptured(true);
  };

  const handleOpenMaps = () => {
    if (!hasPlannedCoords) return;
    // Drop a pin instead of requesting a route: boreholes are usually
    // off-road, and Google's walking router answers "can't find a way
    // there" for points with no path network nearby. From the pin the
    // worker starts directions in whatever mode Google can actually route.
    //
    // geo: first — it opens the device's native maps app directly (no API
    // key involved, works with any installed maps app). The https link is
    // the fallback for devices with no maps app: it opens in the browser.
    const label = encodeURIComponent(borehole?.boreholeCode || 'Borehole');
    const geoUrl = `geo:${plannedLat},${plannedLng}?q=${plannedLat},${plannedLng}(${label})`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${plannedLat},${plannedLng}`;
    Linking.openURL(geoUrl).catch(() => {
      Linking.openURL(webUrl).catch(() => {
        Alert.alert(
          lang === 'hi' ? 'मैप नहीं खुला' : 'Could not open maps',
          lang === 'hi'
            ? `कोई मैप ऐप/ब्राउज़र नहीं मिला। निर्देशांक: ${plannedLat}, ${plannedLng}`
            : `No maps app or browser found on this device. Coordinates: ${plannedLat}, ${plannedLng}`,
        );
      });
    });
  };

  const handleStartBoring = async () => {
    if (starting) return;
    if (!resumeReady) return;

    // Far from the planned point? Confirm before starting — the deviation
    // is recorded either way, never hidden.
    if (distanceM !== null && distanceM > 100) {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          lang === 'hi' ? 'नियोजित स्थान से दूर' : 'Away from planned point',
          lang === 'hi'
            ? `आप नियोजित स्थान से ${location.formatDistance(distanceM)} दूर हैं। फिर भी शुरू करें?`
            : `You appear to be ${location.formatDistance(distanceM)} from the planned borehole location. Start anyway? The deviation will be recorded.`,
          [
            { text: lang === 'hi' ? 'रद्द करें' : 'Cancel', onPress: () => resolve(false) },
            { text: lang === 'hi' ? 'फिर भी शुरू करें' : 'Start anyway', onPress: () => resolve(true) },
          ],
        );
      });
      if (!proceed) return;
    }

    setStarting(true);
    try {
      const arrivalFix = gpsFix ?? (await location.getCurrentPosition({ silent: true, lang }));

      // Reuse the open session. Starting a second one here used to seed
      // endDepth at this screen's startDepth (e.g. SPT 11 / 16.5 m) while
      // SPT 12–15 were already recorded — the next reopen then jumped back.
      let sessionId = openSessionId || `sess-${Date.now()}`;
      if (!openSessionId) {
        try {
          const serverSession = await api.startBoringSession(borehole.id, startDepth);
          if (serverSession?.id) {
            sessionId = serverSession.id;
          }
        } catch (apiErr) {
          // Offline — keep the locally generated session id
        }
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

      if (!openSessionId) {
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

        await syncManager.queueOperation(
          'BORING',
          borehole.id,
          'UPDATE',
          {
            status: 'IN_PROGRESS',
            weather,
            startedAt: newSession.startedAt,
            ...(arrivalFix
              ? {
                  actualLat: arrivalFix.lat,
                  actualLng: arrivalFix.lng,
                  actualAccuracyM: arrivalFix.accuracyM ?? undefined,
                }
              : {}),
          },
          sessionId
        );
      }

      navigation.replace('SPTEntry', {
        borehole: updated.find((bh: any) => bh.id === borehole.id) || borehole,
        projectId,
        sessionId,
        currentDepth: startDepth,
        intervalNo: nextIntervalNo,
        sessionNumber: sessionCount + (openSessionId ? 0 : 1),
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
          <Text style={styles.errorTitle}>{lang === 'hi' ? 'कोई बोरहोल नहीं चुना गया' : 'No borehole selected'}</Text>
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
            <Text style={styles.resumeTitle}>↩ {lang === 'hi' ? 'पिछले सेशन से जारी' : 'Resuming from previous session'}</Text>
            <View style={styles.resumeRow}>
              <Text style={styles.resumeLbl}>{lang === 'hi' ? 'यहाँ रुका' : 'Terminated at'}</Text>
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
              <Text style={styles.resumeLbl}>{lang === 'hi' ? 'कारण' : 'Reason'}</Text>
              <Text style={styles.resumeVal}>
                {lastSession?.terminationReason || (lang === 'hi' ? 'दर्ज नहीं' : 'Not recorded')}
              </Text>
            </View>
            {!!lastSession?.worker && (
              <View style={styles.resumeRow}>
                <Text style={styles.resumeLbl}>{lang === 'hi' ? 'पिछला कर्मचारी' : 'Previous worker'}</Text>
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
                <Text style={styles.resumeLbl}>{lang === 'hi' ? 'पिछला सेशन' : 'Previous session'}</Text>
                <Text style={styles.resumeVal}>Session {sessionCount}</Text>
              </View>
            )}
            <View style={styles.resumeRow}>
              <Text style={styles.resumeLbl}>{lang === 'hi' ? 'अगला SPT' : 'Next SPT at'}</Text>
              <Text style={[styles.resumeVal, styles.resumeValRust]}>
                {startDepth.toFixed(1)}m · Session {sessionCount + 1} · Interval {nextIntervalNo}
              </Text>
            </View>
            <Text style={styles.resumeAuto}>{lang === 'hi' ? 'गहराई अपने आप मिली' : 'Restart depth auto-detected from recorded data'}</Text>
          </View>
        )}

        {/* Planned location card — real coordinates from the engineer's plan */}
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>📍 {lang === 'hi' ? 'नियोजित स्थान' : 'Planned location'}</Text>
          {hasPlannedCoords ? (
            <Text style={styles.locationCoords}>
              Lat {plannedLat!.toFixed(6)} · Lng {plannedLng!.toFixed(6)}
            </Text>
          ) : borehole?.latitude != null && borehole?.longitude != null ? (
            // Values exist but aren't decimal degrees — almost always an
            // unconverted UTM (Easting/Northing) import. Say so explicitly
            // instead of pretending nothing was uploaded.
            <Text style={styles.locationMissing}>
              {lang === 'hi'
                ? 'निर्देशांक UTM (ईस्टिंग/नॉर्थिंग) में हैं — वेब पोर्टल के सेटअप टैब में "Fix coordinates" से बदलवाएं'
                : 'Coordinates are UTM (Easting/Northing) — ask the office to convert them via "Fix coordinates" in the portal Setup tab'}
            </Text>
          ) : (
            <Text style={styles.locationMissing}>
              {lang === 'hi' ? 'निर्देशांक उपलब्ध नहीं' : 'Planned coordinates not set for this borehole'}
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

        {/* Live GPS tracker — real device position vs the planned point */}
        {hasPlannedCoords && (
          <View style={[styles.trackerCard, atLocation && styles.trackerCardOk]}>
            {gpsFix && distanceM !== null ? (
              atLocation ? (
                <>
                  <Text style={styles.trackerOkTitle}>✓ {lang === 'hi' ? 'आप सही स्थान पर हैं' : 'You are at the borehole location'}</Text>
                  <Text style={styles.trackerSub}>
                    {location.formatDistance(distanceM)} from planned point · GPS ±
                    {gpsFix.accuracyM != null ? Math.round(gpsFix.accuracyM) : '—'}m
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.trackerRow}>
                    <Text style={styles.trackerArrow}>
                      {bearing !== null ? location.compassLabel(bearing).arrow : '•'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trackerDistance}>
                        {location.formatDistance(distanceM)} {lang === 'hi' ? 'दूर' : 'away'}
                      </Text>
                      {bearing !== null && (
                        <Text style={styles.trackerDirection}>
                          {lang === 'hi'
                            ? `${location.compassLabel(bearing).hi} जाएँ`
                            : `Walk ${location.compassLabel(bearing).en}`}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.trackerSub}>
                    You: {gpsFix.lat.toFixed(6)}, {gpsFix.lng.toFixed(6)} · GPS ±
                    {gpsFix.accuracyM != null ? Math.round(gpsFix.accuracyM) : '—'}m — updates live
                  </Text>
                </>
              )
            ) : gpsSearching ? (
              <Text style={styles.trackerSearching}>📡 {lang === 'hi' ? 'GPS खोज रहा है…' : 'Getting GPS fix… move to open sky'}</Text>
            ) : (
              <Text style={styles.trackerSearching}>
                {lang === 'hi' ? 'GPS उपलब्ध नहीं — लोकेशन अनुमति दें' : 'GPS unavailable — allow location permission and move to open sky'}
              </Text>
            )}
          </View>
        )}

        {/* Rig photo */}
        <Text style={styles.fieldLabel}>{lang === 'hi' ? 'रिग की फोटो' : 'Rig photo'}</Text>
        <TouchableOpacity
          style={[styles.cameraBtn, rigPhotoCaptured && styles.cameraBtnDone]}
          onPress={handleRigPhoto}
        >
          <Text style={[styles.cameraBtnText, rigPhotoCaptured && styles.cameraBtnTextDone]}>
            {rigPhotoCaptured
              ? lang === 'hi' ? '✓ फोटो ले लिया गया' : '✓ Rig Photo Captured'
              : lang === 'hi' ? '📷 रिग की फोटो लें' : '📷 Capture Rig Photo'}
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

        {/* Photos of this borehole — queued + synced, tap for geo-tag details */}
        <PhotoGallery borehole={borehole} lang={lang} />

        <TouchableOpacity
          style={styles.startBtn}
          onPress={handleStartBoring}
          disabled={starting || !resumeReady}
        >
          <Text style={styles.startBtnText}>
            {!resumeReady
              ? lang === 'hi' ? 'गहराई पढ़ी जा रही है…' : 'Reading last recorded depth…'
              : `▶ ${
                  resuming
                    ? `${t('resume', lang)} — ${lang === 'hi' ? 'अगला SPT' : 'next SPT'} ${startDepth.toFixed(1)}m (SPT ${nextIntervalNo})`
                    : `${t('startBoringBtn', lang)} — ${lang === 'hi' ? 'पहला SPT' : 'first SPT'} ${startDepth.toFixed(1)}m`
                }`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

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
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 21,
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
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 16,
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
    fontSize: 17,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.amber,
    marginBottom: 6,
  },
  resumeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  resumeLbl: {
    fontSize: 14,
    color: colors.grayMid,
  },
  resumeVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.grayDark,
    flexShrink: 1,
    textAlign: 'right',
  },
  resumeValRust: {
    color: colors.rust,
  },
  resumeAuto: {
    fontSize: 15,
    color: colors.grayMid,
    marginTop: 4,
  },
  trackerCard: {
    backgroundColor: colors.amberLight,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  trackerCardOk: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenMid,
  },
  trackerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  trackerArrow: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.amber,
    width: 44,
    textAlign: 'center',
  },
  trackerDistance: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.grayDark,
  },
  trackerDirection: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.amber,
    marginTop: 2,
  },
  trackerOkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.greenDark,
  },
  trackerSub: {
    fontSize: 14,
    color: colors.grayMid,
    marginTop: 6,
  },
  trackerSearching: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amber,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.blueDark,
  },
  locationCoords: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 16,
    color: colors.blueDark,
    marginTop: 4,
  },
  locationMissing: {
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.amber,
  },
  infoBoxAmberSub: {
    fontSize: 14,
    color: colors.grayMid,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 14,
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
    fontSize: 17,
    color: colors.grayDark,
    fontWeight: '700',
  },
  cameraBtnTextDone: {
    color: colors.greenDark,
  },
  horizontalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '700',
  },
});
