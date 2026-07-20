import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';
import { media } from '../services/media';
import PhotoGallery from '../components/PhotoGallery';

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startIso?: string | null, endIso?: string | null): string {
  if (!startIso || !endIso) return '—';
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const mins = Math.round(ms / 60000);
  return `${Math.floor(mins / 60)} hrs ${mins % 60} min`;
}

export default function BoringClosureScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, readOnly } = route.params;
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  // Input states
  const [signed, setSigned] = useState(readOnly ? true : false);

  // Real aggregates from the offline store — this screen is the legal record,
  // every value must come from what the worker actually entered.
  const [summary, setSummary] = useState<{
    startIso: string | null;
    endIso: string | null;
    finalDepth: number | null;
    intervalCount: number;
    sptSamples: number;
    udsSamples: number;
    waterTable: { depth: number; readingType?: string } | null;
    rockAtDepth: number | null;
    rqdText: string | null;
    workerName: string;
  } | null>(null);

  // GWT confirmation defaults to what was actually recorded
  const [gwtEncountered, setGwtEncountered] = useState<boolean | null>(null);

  const [maxIntervalNo, setMaxIntervalNo] = useState<number>(1);

  const [photoCaptured, setPhotoCaptured] = useState(false);
  // Real queued-photo count for this borehole (uploads happen on sync)
  const [pendingPhotos, setPendingPhotos] = useState(0);

  useEffect(() => {
    (async () => {
      const [sessions, intervals, samples, waterObs, user] = await Promise.all([
        storage.getBoringSessions(borehole.id),
        storage.getIntervals(borehole.id),
        storage.getSamples(borehole.id),
        storage.getWaterTable(borehole.id),
        storage.getUser(),
      ]);

      const sessionStarts = sessions
        .map((s: any) => s.startedAt)
        .filter(Boolean)
        .sort();
      const sessionEnds = sessions
        .map((s: any) => s.endedAt)
        .filter(Boolean)
        .sort();

      const completedIntervals = intervals.filter((iv: any) => iv.isCompleted);
      const deepest = completedIntervals.reduce(
        (max: number | null, iv: any) =>
          Number.isFinite(Number(iv.toDepth)) && (max === null || Number(iv.toDepth) > max)
            ? Number(iv.toDepth)
            : max,
        null as number | null,
      );

      const maxIvNo = completedIntervals.reduce(
        (max: number, iv: any) => (iv.intervalNo > max ? iv.intervalNo : max),
        1
      );
      setMaxIntervalNo(maxIvNo);

      // Prefer the IS 6935 24-hr stable reading, else the latest observation
      const stable = [...waterObs].reverse().find((o: any) => o.readingType === 'STABILIZED_LEVEL');
      const latestObs = stable ?? (waterObs.length ? waterObs[waterObs.length - 1] : null);

      const rockIntervals = completedIntervals.filter((iv: any) =>
        String(iv.soilDescription ?? '').startsWith('Rock coring'),
      );
      const firstRock = rockIntervals.length
        ? rockIntervals.reduce((min: any, iv: any) =>
            Number(iv.fromDepth) < Number(min.fromDepth) ? iv : min,
          )
        : null;
      const lastRock = rockIntervals.length ? rockIntervals[rockIntervals.length - 1] : null;
      const rqdMatch = lastRock
        ? String(lastRock.soilDescription).match(/RQD:\s*(\d+%\s*\([^)]*\))/)
        : null;

      setSummary({
        startIso: sessionStarts[0] ?? borehole.startedAt ?? null,
        endIso: sessionEnds.length ? sessionEnds[sessionEnds.length - 1] : new Date().toISOString(),
        finalDepth: deepest ?? (Number.isFinite(Number(borehole.currentDepth)) ? Number(borehole.currentDepth) : null),
        intervalCount: completedIntervals.length,
        sptSamples: samples.filter((s: any) => s.sampleType === 'DISTURBED').length,
        udsSamples: samples.filter((s: any) => s.sampleType === 'UNDISTURBED').length,
        waterTable: latestObs
          ? { depth: Number(latestObs.depth), readingType: latestObs.readingType }
          : null,
        rockAtDepth: firstRock ? Number(firstRock.fromDepth) : null,
        rqdText: rqdMatch ? rqdMatch[1] : null,
        workerName: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.employeeCode || 'Worker',
      });

      setGwtEncountered(latestObs ? true : false);
      setPendingPhotos(await media.pendingCountForBorehole(borehole.id));
    })();
  }, [borehole.id, borehole.currentDepth, borehole.startedAt]);

  const handleSignature = () => {
    if (readOnly || !summary) return;
    setSigned(true);
    Alert.alert(
      'Signed / हस्ताक्षरित',
      `Recorded as ${summary.workerName} at ${formatTime(new Date().toISOString())}. (Drawn signature pad coming soon.)`
    );
  };

  // Real camera capture — the closure photo attaches to the deepest
  // completed interval and uploads on the next successful sync.
  const handleFinalPhoto = async () => {
    if (readOnly) return;
    const shot = await media.capturePhoto('CLOSURE');
    if (!shot) return; // cancelled / unavailable / denied — honest Alert already shown
    await media.queuePhoto({
      boreholeId: borehole.id,
      intervalNo: maxIntervalNo,
      purpose: 'CLOSURE',
      uri: shot.uri,
      fileName: shot.fileName,
      mimeType: shot.type,
      gpsLat: shot.gpsLat,
      gpsLng: shot.gpsLng,
      accuracyM: shot.accuracyM,
      takenAt: new Date().toISOString(),
    });
    setPhotoCaptured(true);
    setPendingPhotos(await media.pendingCountForBorehole(borehole.id));
  };

  const handleSubmit = async () => {
    if (gwtEncountered === null) {
      Alert.alert('GWT Confirmation Required', 'Confirm the water table status before submitting (IS 1892).');
      return;
    }
    if (!signed) {
      Alert.alert('Signature Required', 'Please sign the document before submitting');
      return;
    }

    try {
      const cachedBoreholes = await storage.getBoreholes(projectId);
      const updated = cachedBoreholes.map((bh: any) => {
        if (bh.id === borehole.id) {
          return {
            ...bh,
            status: 'COMPLETED',
            closedAt: new Date().toISOString(),
          };
        }
        return bh;
      });

      await storage.saveBoreholes(projectId, updated);

      // Queue Sync Operation
      await syncManager.queueOperation(
        'BORING',
        borehole.id,
        'UPDATE',
        { status: 'COMPLETED', completedAt: new Date() }
      );

      // Kick off sync in the background — the closure is already saved and
      // queued locally, so the user gets instant confirmation and the data
      // reaches the main DB on the next network window (a full sync round
      // can take minutes on slow networks; never block the field worker).
      syncManager.syncWithServer().catch(() => {});

      Alert.alert(
        'Boring Submitted & Locked / सबमिट और लॉक हो गया',
        'Data locked and queued for sync. / डेटा लॉक हो गया और सिंक के लिए कतार में है।',
        [
          {
            text: 'Return to list / बोरिंग सूची',
            onPress: () => navigation.navigate('BoringList', { projectId }),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to close borehole');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {borehole.boreholeCode} · {readOnly ? 'Boring Locked' : 'Close Boring'}
          </Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>{lang === 'hi' ? 'En' : 'हिं'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Summary + submit</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Date / Time Card Grid — real session timestamps */}
        <View style={styles.dateGrid}>
          <View style={styles.dateCard}>
            <Text style={styles.dateLabel}>Start</Text>
            <Text style={styles.dateVal}>{formatDate(summary?.startIso)}</Text>
            <Text style={styles.dateTime}>{formatTime(summary?.startIso)}</Text>
          </View>
          <View style={styles.dateCard}>
            <Text style={styles.dateLabel}>End</Text>
            <Text style={styles.dateVal}>{formatDate(summary?.endIso)}</Text>
            <Text style={styles.dateTime}>{formatTime(summary?.endIso)}</Text>
          </View>
        </View>

        {/* Logging Statistics — aggregated from the worker's actual entries */}
        <View style={styles.statsBlock}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Total depth / कुल गहराई</Text>
            <Text style={styles.sumVal}>
              {summary?.finalDepth != null ? `${summary.finalDepth.toFixed(1)} m` : '—'}
            </Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Duration / कुल समय</Text>
            <Text style={styles.sumVal}>{formatDuration(summary?.startIso, summary?.endIso)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>SPT intervals / एसपीटी अंतराल</Text>
            <Text style={styles.sumVal}>
              {summary ? `${summary.intervalCount} entries` : '—'}
            </Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Samples / नमूने</Text>
            <Text style={styles.sumVal}>
              {summary ? `${summary.sptSamples} SPT · ${summary.udsSamples} UDS` : '—'}
            </Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Photos uploaded / फोटो</Text>
            <Text style={styles.sumVal}>
              {pendingPhotos > 0
                ? `${pendingPhotos} queued — uploads on sync / सिंक पर अपलोड`
                : 'None / कोई नहीं'}
            </Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Water table / भूजल स्तर</Text>
            <Text style={styles.sumVal}>
              {summary?.waterTable
                ? `${summary.waterTable.depth.toFixed(2)}m${summary.waterTable.readingType === 'STABILIZED_LEVEL' ? ' (24hr final)' : ' (during drilling)'}`
                : 'Not recorded'}
            </Text>
          </View>
          {summary?.rockAtDepth != null && (
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Rock at depth / रॉक गहराई</Text>
              <Text style={styles.sumVal}>{summary.rockAtDepth.toFixed(1)} m</Text>
            </View>
          )}
          {summary?.rqdText != null && (
            <View style={[styles.sumRow, styles.lastSumRow]}>
              <Text style={styles.sumLabel}>RQD / रॉक गुणवत्ता</Text>
              <Text style={styles.sumVal}>{summary.rqdText}</Text>
            </View>
          )}
        </View>

        {/* Water Table Confirmation */}
        <View style={styles.gwtConfirmBlock}>
          <Text style={styles.gwtConfirmTitle}>
            GWT confirmation / भूजल स्तर पुष्टि (IS 1892)
          </Text>
          <View style={styles.gwtBtnRow}>
            <TouchableOpacity
              style={[styles.gwtBtn, gwtEncountered === true && styles.gwtBtnSelected]}
              onPress={() => !readOnly && setGwtEncountered(true)}
            >
              <Text style={[styles.gwtBtnText, gwtEncountered === true && styles.gwtBtnTextSelected]}>
                {summary?.waterTable
                  ? `✓ Water table found at ${summary.waterTable.depth.toFixed(2)}m`
                  : '✓ Water table encountered'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gwtBtn, gwtEncountered === false && styles.gwtBtnSelected]}
              onPress={() => !readOnly && setGwtEncountered(false)}
            >
              <Text style={[styles.gwtBtnText, gwtEncountered === false && styles.gwtBtnTextSelected]}>
                GWT not encountered
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.gwtSubHint}>
            IS 1892 mandatory — must confirm one before submit
          </Text>
        </View>

        {/* Final photo — opens the real device camera */}
        <TouchableOpacity
          style={[styles.cameraBtn, photoCaptured && styles.cameraBtnDone]}
          onPress={handleFinalPhoto}
          disabled={readOnly}
        >
          <Text style={[styles.cameraBtnText, photoCaptured && styles.cameraBtnTextDone]}>
            {photoCaptured
              ? '✓ Photo captured — uploads on sync / फोटो ली गई'
              : '📷 Final Borehole Photo / बोरहोल फोटो'}
          </Text>
        </TouchableOpacity>

        {/* Photos of this borehole — queued + synced, tap for geo-tag details */}
        <PhotoGallery borehole={borehole} />

        {/* Signature Box — real logged-in worker, typed-name confirmation */}
        <TouchableOpacity
          style={[styles.signatureBox, signed && styles.signatureBoxSigned]}
          onPress={handleSignature}
        >
          {signed && summary ? (
            <Text style={styles.signatureText}>✍️ {summary.workerName}</Text>
          ) : (
            <Text style={styles.signaturePlaceholder}>
              Tap to sign as {summary?.workerName ?? '…'} / हस्ताक्षर करने के लिए टैप करें
            </Text>
          )}
        </TouchableOpacity>

        {/* Lock submission */}
        {!readOnly ? (
          <>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>🔒 {t('lockSubmit', lang)}</Text>
            </TouchableOpacity>
            <Text style={styles.warningText}>
              {t('lockWarning', lang)}
            </Text>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, styles.disabledBtn]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.submitBtnText}>← Return to List</Text>
          </TouchableOpacity>
        )}
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
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dateCard: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
  },
  dateLabel: {
    fontSize: 15,
    color: colors.grayMid,
  },
  dateVal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grayDark,
    marginTop: 2,
  },
  dateTime: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.rust,
    marginTop: 1,
  },
  statsBlock: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    marginBottom: 12,
  },
  sumRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayLight,
  },
  lastSumRow: {
    borderBottomWidth: 0,
  },
  sumLabel: {
    fontSize: 14,
    color: colors.grayMid,
  },
  sumVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.grayDark,
  },
  gwtConfirmBlock: {
    backgroundColor: colors.blueLight,
    borderWidth: 0.5,
    borderColor: '#85B7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  gwtConfirmTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.blueDark,
    marginBottom: 6,
  },
  gwtBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gwtBtn: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 4,
    paddingVertical: 6,
    alignItems: 'center',
  },
  gwtBtnSelected: {
    backgroundColor: colors.blueDark,
  },
  gwtBtnText: {
    fontSize: 15,
    color: colors.grayDark,
  },
  gwtBtnTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  gwtSubHint: {
    fontSize: 15,
    color: colors.blueDark,
    marginTop: 4,
    textAlign: 'center',
  },
  cameraBtn: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.greenMid,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cameraBtnDone: {
    backgroundColor: colors.greenLight,
  },
  cameraBtnText: {
    fontSize: 16,
    color: colors.greenMid,
    fontWeight: '700',
  },
  cameraBtnTextDone: {
    color: colors.greenDark,
  },
  signatureBox: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signatureBoxSigned: {
    backgroundColor: colors.white,
    borderColor: colors.rustMid,
  },
  signaturePlaceholder: {
    fontSize: 16,
    color: colors.grayMid,
  },
  signatureText: {
    fontSize: 21,
    fontFamily: 'serif',
    fontStyle: 'italic',
    color: colors.rustMid,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    backgroundColor: colors.grayMid,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  warningText: {
    fontSize: 14,
    color: colors.grayMid,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
});
