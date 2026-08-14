import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { useLanguage } from '../utils/LanguageContext';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';
import { media } from '../services/media';

export default function SampleCollectionScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, sessionId, currentDepth, intervalNo, sptData, soilData } = route.params;
  const { lang, setLang } = useLanguage();

  // Sample states
  const [sampleType, setSampleType] = useState<'DISTURBED' | 'UNDISTURBED'>('DISTURBED');
  const [sealedConfirmed, setSealedConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  // UDS-specific states (prototype Screen 9)
  const [tubePenetration, setTubePenetration] = useState('');
  const [tubeRecovery, setTubeRecovery] = useState('');
  const [waxConfirmed, setWaxConfirmed] = useState(false);
  const [uprightConfirmed, setUprightConfirmed] = useState(false);

  // Real count of samples already recorded at this depth (drives sequence number)
  const [samplesAtDepth, setSamplesAtDepth] = useState(0);

  const isUds = sampleType === 'UNDISTURBED';
  const isRockBranch = soilData?.isRock === true || soilData?.soilType === 'Rock';

  useEffect(() => {
    let active = true;
    storage.getSamples(borehole.id).then((samples: any[]) => {
      if (!active) return;
      const count = samples.filter(
        (s: any) => typeof s.sampleDepth === 'number' && Math.abs(s.sampleDepth - currentDepth) < 0.05
      ).length;
      setSamplesAtDepth(count);
    });
    return () => {
      active = false;
    };
  }, [borehole.id, currentDepth]);

  // Derive sample ID generically from boreholeCode (GL-BH-XXXX-NN → GL-BH{NN})
  // Format per prototype: GL-BH{n}-{depth}-S{seq} / -U{seq}
  const typeChar = isUds ? 'U' : 'S';
  const bhNumMatch = (borehole.boreholeCode || '').match(/-(\d+)$/);
  const bhPrefix = bhNumMatch ? `GL-BH${bhNumMatch[1]}` : (borehole.boreholeCode || 'GL-BH');
  const sampleSeq = samplesAtDepth + 1;
  const sampleId = `${bhPrefix}-${currentDepth.toFixed(1)}-${typeChar}${sampleSeq}`;

  // UDS recovery ratio (computed from real inputs)
  const penetrationCm = parseFloat(tubePenetration);
  const recoveryCm = parseFloat(tubeRecovery);
  const recoveryRatio =
    !isNaN(penetrationCm) && penetrationCm > 0 && !isNaN(recoveryCm)
      ? Math.round((recoveryCm / penetrationCm) * 100)
      : null;

  const [slatePhotoCaptured, setSlatePhotoCaptured] = useState(false);
  const [sealedPhotoCaptured, setSealedPhotoCaptured] = useState(false);

  // Real camera capture — photo is queued locally and uploaded on sync
  // once this interval exists on the server.
  const handleCapturePhoto = async (photoType: 'Slate Board Photo' | 'Sealed Tube Photo') => {
    const shot = await media.capturePhoto('SAMPLE', lang);
    if (!shot) return; // cancelled / unavailable / denied — honest Alert already shown
    await media.queuePhoto({
      boreholeId: borehole.id,
      intervalNo,
      purpose: 'SAMPLE',
      uri: shot.uri,
      fileName: shot.fileName,
      mimeType: shot.type,
      gpsLat: shot.gpsLat,
      gpsLng: shot.gpsLng,
      accuracyM: shot.accuracyM,
      takenAt: new Date().toISOString(),
    });
    if (photoType === 'Slate Board Photo') {
      setSlatePhotoCaptured(true);
    } else {
      setSealedPhotoCaptured(true);
    }
  };

  const udsChecksOk = !isUds || (waxConfirmed && uprightConfirmed);

  const handleNextDepth = async () => {
    if (isUds && !udsChecksOk) {
      Alert.alert(
        lang === 'hi' ? 'पुष्टि जरूरी' : 'Confirmation required',
        lang === 'hi'
          ? 'दोनों चेकबॉक्स टिक करना जरूरी है।'
          : 'Both ends waxed & sealed AND stored upright must be ticked before continuing.'
      );
      return;
    }

    if (isUds && recoveryRatio !== null && !isNaN(penetrationCm) && !isNaN(recoveryCm) && recoveryCm > penetrationCm) {
      Alert.alert(
        'Invalid values',
        lang === 'hi'
          ? 'रिकवरी पेनेट्रेशन से ज्यादा नहीं हो सकती।'
          : 'Recovery cannot exceed tube penetration.'
      );
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      const sptIntervalM = await storage.getSptInterval(projectId, borehole.id);

      // 1. Create the interval record locally
      const intervalRecord = {
        id: `interval-${borehole.id}-${intervalNo}`,
        boreholeId: borehole.id,
        intervalNo,
        fromDepth: currentDepth - sptIntervalM < 0 ? 0 : currentDepth - sptIntervalM,
        toDepth: currentDepth,
        soilDescription: soilData.description,
        nValue: sptData.correctedN,
        isCompleted: true,
        blow1: sptData.blow1,
        blow2: sptData.blow2,
        blow3: sptData.blow3,
        nCorrected: sptData.correctedN,
        isRefusal: sptData.isRefusal,
        penetrationMm: sptData.penetrationMm,
        dilatancyApplied: sptData.dilatancyApplied,
        observedAt: new Date().toISOString(),
      };

      // 2. Create the sample record locally — 14-day lab deadline persisted in payload
      const createdAt = new Date();
      const labDeadline = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      const sampleRecord: any = {
        id: `sample-${Date.now()}`,
        intervalId: intervalRecord.id,
        sampleNumber: sampleId,
        sampleType,
        sampleDepth: currentDepth,
        condition: sealedConfirmed ? 'SEALED' : 'UNSEALED',
        labDeadline: labDeadline.toISOString(),
        createdAt: createdAt.toISOString(),
      };
      if (isUds) {
        sampleRecord.tubePenetrationCm = isNaN(penetrationCm) ? undefined : penetrationCm;
        sampleRecord.recoveryCm = isNaN(recoveryCm) ? undefined : recoveryCm;
        sampleRecord.recoveryRatioPct = recoveryRatio !== null ? recoveryRatio : undefined;
        sampleRecord.waxSealedBothEnds = waxConfirmed;
        sampleRecord.storedUpright = uprightConfirmed;
      }

      // Save to local storage — upsert by the deterministic interval id so
      // re-submitting this interval (back-navigation) replaces the local
      // row instead of duplicating it.
      const intervals = await storage.getIntervals(borehole.id);
      const nextIntervals = intervals.filter((iv: any) => iv.id !== intervalRecord.id);
      nextIntervals.push(intervalRecord);
      await storage.saveIntervals(borehole.id, nextIntervals);

      const samples = await storage.getSamples(borehole.id);
      samples.push(sampleRecord);
      await storage.saveSamples(borehole.id, samples);

      // 3. Queue sync queue writes
      await syncManager.queueOperation(
        'SPT_RECORD',
        intervalRecord.id,
        'CREATE',
        intervalRecord,
        sessionId
      );

      await syncManager.queueOperation(
        'SAMPLE',
        sampleRecord.id,
        'CREATE',
        sampleRecord,
        sessionId
      );

      // Update current depth of borehole
      const cachedBoreholes = await storage.getBoreholes(projectId);
      const updated = cachedBoreholes.map((bh: any) => {
        if (bh.id === borehole.id) {
          return {
            ...bh,
            currentDepth: currentDepth,
          };
        }
        return bh;
      });
      await storage.saveBoreholes(projectId, updated);
      const updatedBorehole = updated.find((bh: any) => bh.id === borehole.id) || borehole;

      // Rock branch: soil description said Rock — exit the SPT loop into core mode
      if (isRockBranch) {
        Alert.alert(
          lang === 'hi' ? 'चट्टान मिली' : 'Rock encountered',
          'Switching to rock coring mode (Screen 8).',
          [
            {
              text: lang === 'hi' ? 'कोरिंग शुरू करें' : 'Start coring',
              onPress: () =>
                navigation.replace('RockCoring', {
                  borehole: updatedBorehole,
                  projectId,
                  sessionId,
                  currentDepth,
                  intervalNo: intervalNo + 1,
                }),
            },
          ]
        );
        return;
      }

      // Loop exit by the borehole's REAL planned depth (no magic numbers).
      // If plannedDepth is missing, keep looping — worker exits via Terminate.
      const nextDepth = Math.round((currentDepth + sptIntervalM) * 100) / 100;
      const nextInterval = intervalNo + 1;
      const plannedDepth = parseFloat(borehole.plannedDepth);
      const targetReached = !isNaN(plannedDepth) && plannedDepth > 0 && currentDepth >= plannedDepth;

      if (targetReached) {
        Alert.alert(
          lang === 'hi' ? 'लक्ष्य गहराई पूर्ण' : 'Target Depth Reached',
          lang === 'hi'
            ? 'नियोजित गहराई पूरी हुई।'
            : `Planned depth ${plannedDepth.toFixed(1)}m reached. Proceed to closure.`,
          [
            {
              text: lang === 'hi' ? 'समाप्त करें' : 'Boring Closure',
              onPress: () =>
                navigation.navigate('BoringClosure', {
                  borehole: updatedBorehole,
                  projectId,
                }),
            },
          ]
        );
      } else {
        // Return back to Screen 4 (SPT entry) for the next depth
        navigation.replace('SPTEntry', {
          borehole: updatedBorehole,
          projectId,
          sessionId,
          currentDepth: nextDepth,
          intervalNo: nextInterval,
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save interval data');
    } finally {
      setSaving(false);
    }
  };

  const formattedDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
  const nextDisabled = !udsChecksOk;

  return (
    <View style={[styles.container, isUds && styles.containerUds]}>
      {/* Header */}
      <View style={[styles.headerBar, isUds && styles.headerBarUds]}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {borehole.boreholeCode} · {isUds ? 'UDS Sample' : t('sampleCollection', lang)}
          </Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>{lang === 'hi' ? 'En' : 'हिं'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Depth {currentDepth.toFixed(1)}m</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Loop tracker */}
        <View style={styles.loopBar}>
          <Text style={styles.loopText}>Interval {intervalNo} · Step 3 of 3</Text>
        </View>

        {/* Sample Type Selection */}
        <Text style={styles.fieldLabel}>{t('sampleType', lang)}</Text>
        <View style={styles.horizontalRow}>
          <TouchableOpacity
            style={[styles.tileHalf, !isUds && styles.tileHalfActive]}
            onPress={() => setSampleType('DISTURBED')}
          >
            <Text style={[styles.tileText, !isUds && styles.tileTextActive]}>
              {lang === 'hi' ? 'विक्षुब्ध नमूना' : 'Disturbed SPT'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tileHalf, isUds && styles.tileHalfActiveUds]}
            onPress={() => setSampleType('UNDISTURBED')}
          >
            <Text style={[styles.tileText, isUds && styles.tileTextActiveUds]}>
              {lang === 'hi' ? 'अविक्षुब्ध' : 'UDS Thin wall'}
            </Text>
          </TouchableOpacity>
        </View>

        {isUds ? (
          <View style={styles.udsCareBox}>
            <Text style={styles.udsCareTitle}>
              {lang === 'hi' ? 'अविक्षुब्ध नमूना — ध्यान से रखें' : 'Undisturbed sample — handle with care'}
            </Text>
          </View>
        ) : null}

        {/* Dynamic Sample ID display card */}
        <View style={[styles.sampleIdBox, isUds && styles.sampleIdBoxUds]}>
          <Text style={[styles.sampleIdLabel, isUds && styles.sampleIdLabelUds]}>
            {lang === 'hi' ? 'ट्यूब पर लिखें' : t('writeOnTube', lang)}
          </Text>
          <Text style={styles.sampleIdVal}>{sampleId}</Text>
          <Text style={[styles.sampleIdHint, isUds && styles.sampleIdLabelUds]}>
            {isUds
              ? (lang === 'hi' ? 'ट्यूब और बॉक्स दोनों पर लिखें' : 'Write on tube AND core box')
              : (lang === 'hi' ? 'मार्कर से साफ लिखें' : 'Use marker pen clearly')}
          </Text>
        </View>

        {/* UDS-only: tube penetration / recovery inputs */}
        {isUds ? (
          <View style={styles.udsInputRow}>
            <View style={styles.udsInputHalf}>
              <Text style={styles.fieldLabel}>{lang === 'hi' ? 'पेनेट्रेशन' : 'Tube penetration (cm)'}</Text>
              <TextInput
                style={styles.input}
                value={tubePenetration}
                onChangeText={setTubePenetration}
                keyboardType="numeric"
                placeholder="e.g. 45"
                placeholderTextColor={colors.grayMid}
              />
            </View>
            <View style={styles.udsInputHalf}>
              <Text style={styles.fieldLabel}>{lang === 'hi' ? 'रिकवरी' : 'Recovery (cm)'}</Text>
              <TextInput
                style={styles.input}
                value={tubeRecovery}
                onChangeText={setTubeRecovery}
                keyboardType="numeric"
                placeholder="e.g. 42"
                placeholderTextColor={colors.grayMid}
              />
            </View>
          </View>
        ) : null}

        {isUds ? (
          <View style={styles.recoveryRow}>
            <Text style={styles.recoveryLabel}>{lang === 'hi' ? 'रिकवरी अनुपात' : 'Recovery ratio'}</Text>
            <Text style={styles.recoveryVal}>
              {recoveryRatio !== null ? `${recoveryRatio}%` : '— enter values above'}
            </Text>
          </View>
        ) : null}

        {/* Slate board photo — real capture, uploads on sync */}
        <View style={styles.slateContainer}>
          <Text style={styles.slateTitle}>📋 {lang === 'hi' ? 'स्लेट बोर्ड फोटो जरूरी' : 'Slate board photo required'}</Text>
          <Text style={styles.slateSub}>
            Hold slate showing: BH ID · Depth · Date (like: {bhPrefix} · {currentDepth.toFixed(1)}m · {new Date().toLocaleDateString('en-GB')})
          </Text>
          <TouchableOpacity
            style={[styles.cameraBtn, slatePhotoCaptured && styles.cameraBtnDone]}
            onPress={() => handleCapturePhoto('Slate Board Photo')}
          >
            <Text style={[styles.cameraText, slatePhotoCaptured && styles.cameraTextDone]}>
              {slatePhotoCaptured
                ? (lang === 'hi' ? 'फोटो ले लिया गया' : '✓ Slate Board Photo Captured')
                : (lang === 'hi' ? 'स्लेट फोटो लें' : '📷 Capture Slate Photo')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sealed tube photo — real capture, uploads on sync */}
        <TouchableOpacity
          style={[styles.cameraBtnWide, sealedPhotoCaptured && styles.cameraBtnDone]}
          onPress={() => handleCapturePhoto('Sealed Tube Photo')}
        >
          <Text style={[styles.cameraTextWide, sealedPhotoCaptured && styles.cameraTextDone]}>
            {sealedPhotoCaptured
              ? (lang === 'hi' ? 'फोटो ले लिया गया' : '✓ Sealed Tube Photo Captured')
              : (lang === 'hi' ? `📷 सील ट्यूब फोटो` : `📷 ${t('sealedPhoto', lang)}`)}
          </Text>
        </TouchableOpacity>

        {/* Sealing confirmation — worker attestation (no photo claimed) */}
        <TouchableOpacity
          style={[styles.confirmBox, sealedConfirmed && styles.confirmBoxDone]}
          onPress={() => setSealedConfirmed(!sealedConfirmed)}
        >
          <Text style={[styles.confirmText, sealedConfirmed && styles.confirmTextDone]}>
            {sealedConfirmed
              ? (lang === 'hi' ? 'नमूना सील हो गया' : '✓ Sample sealed confirmed')
              : (lang === 'hi' ? 'सील की पुष्टि करें' : 'Tap to confirm sample sealed')}
          </Text>
        </TouchableOpacity>

        {/* UDS mandatory confirmations */}
        {isUds ? (
          <>
            <View style={styles.udsVerificationCard}>
              <Text style={styles.udsVerificationTitle}>
                {lang === 'hi' ? 'दोनों तरफ मोम लगाना जरूरी है (IS 2132)' : 'Wax seal — BOTH ends mandatory'}
              </Text>
            </View>
            <View style={styles.checkRow}>
              <TouchableOpacity
                style={[styles.checkTile, waxConfirmed && styles.checkTileDone]}
                onPress={() => setWaxConfirmed(!waxConfirmed)}
              >
                <Text style={[styles.checkTileText, waxConfirmed && styles.checkTileTextDone]}>
                  {waxConfirmed ? '✓ ' : '☐ '}{lang === 'hi' ? 'मोम सील' : 'Both ends waxed & sealed'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkTile, uprightConfirmed && styles.checkTileDone]}
                onPress={() => setUprightConfirmed(!uprightConfirmed)}
              >
                <Text style={[styles.checkTileText, uprightConfirmed && styles.checkTileTextDone]}>
                  {uprightConfirmed ? '✓ ' : '☐ '}{lang === 'hi' ? 'सीधा रखा' : 'Stored upright in box'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {/* 14-day countdown timer */}
        <View style={styles.timerBox}>
          <Text style={styles.timerTitle}>⏰ {t('labTimer', lang)}</Text>
          <Text style={styles.timerSub}>Must reach lab by: {formattedDeadline} (saved with sample)</Text>
        </View>

        {/* Next depth action button */}
        <TouchableOpacity
          style={[styles.nextBtn, isUds && styles.nextBtnUds, (nextDisabled || saving) && styles.nextBtnDisabled]}
          onPress={handleNextDepth}
          disabled={nextDisabled || saving}
        >
          <Text style={styles.nextBtnText}>
            {isRockBranch
              ? (lang === 'hi' ? 'रॉक कोरिंग →' : 'Save → Rock coring')
              : (lang === 'hi' ? 'अगली गहराई →' : 'Next depth')}
          </Text>
        </TouchableOpacity>
        {nextDisabled ? (
          <Text style={styles.blockHint}>
            {lang === 'hi' ? 'दोनों पुष्टि टिक करें' : 'Tick both UDS confirmations to continue'}
          </Text>
        ) : null}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  containerUds: {
    backgroundColor: colors.pageBg, // maintains warm page bg
  },
  headerBar: {
    backgroundColor: colors.rust,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBarUds: {
    backgroundColor: colors.blueDark, // blue theme for undisturbed UDS samples
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
  loopBar: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 6,
    marginBottom: 10,
  },
  loopText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.amber,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.grayMid,
    marginBottom: 4,
    marginTop: 4,
  },
  horizontalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tileHalf: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tileHalfActive: {
    backgroundColor: colors.rustLight,
    borderColor: colors.rustMid,
    borderWidth: 1.5,
  },
  tileHalfActiveUds: {
    backgroundColor: colors.blueLight,
    borderColor: colors.blueDark,
    borderWidth: 1.5,
  },
  tileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grayDark,
    textAlign: 'center',
  },
  tileTextActive: {
    color: colors.rust,
    fontWeight: '700',
  },
  tileTextActiveUds: {
    color: colors.blueDark,
    fontWeight: '700',
  },
  udsCareBox: {
    backgroundColor: colors.blueLight,
    borderWidth: 0.5,
    borderColor: '#85B7EB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  udsCareTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.blueDark,
  },
  udsCareSub: {
    fontSize: 15,
    color: colors.grayMid,
    marginTop: 2,
  },
  sampleIdBox: {
    backgroundColor: colors.greenDark,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  sampleIdBoxUds: {
    backgroundColor: colors.blueDark,
  },
  sampleIdLabel: {
    fontSize: 14,
    color: '#A5D6A7',
    marginBottom: 4,
  },
  sampleIdLabelUds: {
    color: '#B5D4F4',
  },
  sampleIdVal: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 22,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 1,
  },
  sampleIdHint: {
    fontSize: 15,
    color: '#C8E6C9',
    marginTop: 4,
  },
  udsInputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  udsInputHalf: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 17,
    color: colors.grayDark,
  },
  recoveryRow: {
    backgroundColor: colors.grayLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recoveryLabel: {
    fontSize: 14,
    color: colors.grayMid,
  },
  recoveryVal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.blueDark,
  },
  slateContainer: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  slateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.amber,
  },
  slateSub: {
    fontSize: 15,
    color: '#633806',
    marginTop: 2,
  },
  cameraBtn: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cameraBtnWide: {
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
  cameraText: {
    fontSize: 14,
    color: colors.grayDark,
    fontWeight: '700',
  },
  cameraTextWide: {
    fontSize: 14,
    color: colors.grayDark,
    fontWeight: '700',
  },
  cameraTextDone: {
    color: colors.greenDark,
  },
  confirmBox: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.greenMid,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmBoxDone: {
    backgroundColor: colors.greenLight,
  },
  confirmText: {
    fontSize: 16,
    color: colors.greenMid,
    fontWeight: '700',
  },
  confirmTextDone: {
    color: colors.greenDark,
  },
  udsVerificationCard: {
    backgroundColor: colors.redLight,
    borderWidth: 0.5,
    borderColor: colors.redMid,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  udsVerificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.redMid,
  },
  udsVerificationSub: {
    fontSize: 15,
    color: colors.grayMid,
    marginTop: 2,
  },
  checkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  checkTile: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  checkTileDone: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenMid,
    borderWidth: 1.5,
  },
  checkTileText: {
    fontSize: 14,
    color: colors.grayDark,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkTileTextDone: {
    color: colors.greenDark,
    fontWeight: '700',
  },
  timerBox: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 8,
    marginBottom: 16,
  },
  timerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.amber,
  },
  timerSub: {
    fontSize: 15,
    color: '#633806',
    marginTop: 2,
  },
  nextBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  nextBtnUds: {
    backgroundColor: colors.blueDark,
  },
  nextBtnDisabled: {
    backgroundColor: colors.grayMid,
    opacity: 0.7,
  },
  nextBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  blockHint: {
    fontSize: 15,
    color: colors.redMid,
    textAlign: 'center',
    marginBottom: 24,
  },
});
