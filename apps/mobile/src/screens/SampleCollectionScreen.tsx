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
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';

export default function SampleCollectionScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, sessionId, currentDepth, intervalNo, sptData, soilData } = route.params;
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

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

  // No camera module is installed — honest disabled state, never claim a photo exists.
  const handlePhotoUnavailable = () => {
    Alert.alert(
      'Camera integration coming soon / कैमरा जल्द',
      'Photo capture is not available in this version. Continue without photo — it is not required to save the sample. / इस संस्करण में फोटो सुविधा नहीं है।'
    );
  };

  const udsChecksOk = !isUds || (waxConfirmed && uprightConfirmed);

  const handleNextDepth = async () => {
    if (isUds && !udsChecksOk) {
      Alert.alert(
        'Confirmation required / पुष्टि जरूरी',
        'Both ends waxed & sealed AND stored upright must be ticked before continuing. / दोनों चेकबॉक्स टिक करना जरूरी है।'
      );
      return;
    }

    if (isUds && recoveryRatio !== null && !isNaN(penetrationCm) && !isNaN(recoveryCm) && recoveryCm > penetrationCm) {
      Alert.alert('Invalid values', 'Recovery cannot exceed tube penetration. / रिकवरी पेनेट्रेशन से ज्यादा नहीं हो सकती।');
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      // 1. Create the interval record locally
      const intervalRecord = {
        id: `interval-${borehole.id}-${intervalNo}`,
        boreholeId: borehole.id,
        intervalNo,
        fromDepth: currentDepth - 1.5 < 0 ? 0 : currentDepth - 1.5,
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

      // Save to local storage
      const intervals = await storage.getIntervals(borehole.id);
      intervals.push(intervalRecord);
      await storage.saveIntervals(borehole.id, intervals);

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
          'Rock encountered / चट्टान मिली',
          'Switching to rock coring mode (Screen 8).',
          [
            {
              text: 'Start coring / कोरिंग शुरू करें',
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
      const nextDepth = currentDepth + 1.5;
      const nextInterval = intervalNo + 1;
      const plannedDepth = parseFloat(borehole.plannedDepth);
      const targetReached = !isNaN(plannedDepth) && plannedDepth > 0 && currentDepth >= plannedDepth;

      if (targetReached) {
        Alert.alert(
          'Target Depth Reached / लक्ष्य गहराई पूर्ण',
          `Planned depth ${plannedDepth.toFixed(1)}m reached. Proceed to closure. / नियोजित गहराई पूरी हुई।`,
          [
            {
              text: 'Boring Closure / समाप्त करें',
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
              Disturbed SPT / विक्षुब्ध नमूना
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tileHalf, isUds && styles.tileHalfActiveUds]}
            onPress={() => setSampleType('UNDISTURBED')}
          >
            <Text style={[styles.tileText, isUds && styles.tileTextActiveUds]}>
              UDS Thin wall / अविक्षुब्ध
            </Text>
          </TouchableOpacity>
        </View>

        {isUds ? (
          <View style={styles.udsCareBox}>
            <Text style={styles.udsCareTitle}>Undisturbed sample — handle with care</Text>
            <Text style={styles.udsCareSub}>अविक्षुब्ध नमूना — ध्यान से रखें</Text>
          </View>
        ) : null}

        {/* Dynamic Sample ID display card */}
        <View style={[styles.sampleIdBox, isUds && styles.sampleIdBoxUds]}>
          <Text style={[styles.sampleIdLabel, isUds && styles.sampleIdLabelUds]}>
            {t('writeOnTube', lang)} / ट्यूब पर लिखें
          </Text>
          <Text style={styles.sampleIdVal}>{sampleId}</Text>
          <Text style={[styles.sampleIdHint, isUds && styles.sampleIdLabelUds]}>
            {isUds
              ? 'Write on tube AND core box / ट्यूब और बॉक्स दोनों पर लिखें'
              : 'Use marker pen clearly / मार्कर से साफ लिखें'}
          </Text>
        </View>

        {/* UDS-only: tube penetration / recovery inputs */}
        {isUds ? (
          <View style={styles.udsInputRow}>
            <View style={styles.udsInputHalf}>
              <Text style={styles.fieldLabel}>Tube penetration (cm) / पेनेट्रेशन</Text>
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
              <Text style={styles.fieldLabel}>Recovery (cm) / रिकवरी</Text>
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
            <Text style={styles.recoveryLabel}>Recovery ratio / रिकवरी अनुपात</Text>
            <Text style={styles.recoveryVal}>
              {recoveryRatio !== null ? `${recoveryRatio}%` : '— enter values above'}
            </Text>
          </View>
        ) : null}

        {/* Slate board instructions — photo capture honestly unavailable */}
        <View style={styles.slateContainer}>
          <Text style={styles.slateTitle}>📋 Slate board photo required / स्लेट बोर्ड फोटो जरूरी</Text>
          <Text style={styles.slateSub}>
            Hold slate showing: BH ID · Depth · Date (like: {bhPrefix} · {currentDepth.toFixed(1)}m · {new Date().toLocaleDateString('en-GB')})
          </Text>
          <TouchableOpacity style={styles.disabledCameraBtn} onPress={handlePhotoUnavailable}>
            <Text style={styles.disabledCameraText}>
              📷 Camera integration coming soon / कैमरा जल्द
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sealed tube photo — honestly unavailable, does not block */}
        <TouchableOpacity style={styles.disabledCameraBtnWide} onPress={handlePhotoUnavailable}>
          <Text style={styles.disabledCameraText}>
            📷 {t('sealedPhoto', lang)} — camera coming soon / कैमरा जल्द
          </Text>
        </TouchableOpacity>

        {/* Sealing confirmation — worker attestation (no photo claimed) */}
        <TouchableOpacity
          style={[styles.confirmBox, sealedConfirmed && styles.confirmBoxDone]}
          onPress={() => setSealedConfirmed(!sealedConfirmed)}
        >
          <Text style={[styles.confirmText, sealedConfirmed && styles.confirmTextDone]}>
            {sealedConfirmed ? '✓ Sample sealed confirmed / नमूना सील हो गया' : 'Tap to confirm sample sealed / सील की पुष्टि करें'}
          </Text>
        </TouchableOpacity>

        {/* UDS mandatory confirmations */}
        {isUds ? (
          <>
            <View style={styles.udsVerificationCard}>
              <Text style={styles.udsVerificationTitle}>Wax seal — BOTH ends mandatory</Text>
              <Text style={styles.udsVerificationSub}>दोनों तरफ मोम लगाना जरूरी है (IS 2132)</Text>
            </View>
            <View style={styles.checkRow}>
              <TouchableOpacity
                style={[styles.checkTile, waxConfirmed && styles.checkTileDone]}
                onPress={() => setWaxConfirmed(!waxConfirmed)}
              >
                <Text style={[styles.checkTileText, waxConfirmed && styles.checkTileTextDone]}>
                  {waxConfirmed ? '✓ ' : '☐ '}Both ends waxed & sealed / मोम सील
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkTile, uprightConfirmed && styles.checkTileDone]}
                onPress={() => setUprightConfirmed(!uprightConfirmed)}
              >
                <Text style={[styles.checkTileText, uprightConfirmed && styles.checkTileTextDone]}>
                  {uprightConfirmed ? '✓ ' : '☐ '}Stored upright in box / सीधा रखा
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
            {isRockBranch ? 'Save → Rock coring / रॉक कोरिंग →' : 'Next depth / अगली गहराई →'}
          </Text>
        </TouchableOpacity>
        {nextDisabled ? (
          <Text style={styles.blockHint}>
            Tick both UDS confirmations to continue / दोनों पुष्टि टिक करें
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 14,
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
    fontSize: 9,
    color: colors.white,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 10,
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
    fontSize: 9,
    fontWeight: '700',
    color: colors.amber,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 9,
    color: colors.grayMid,
    marginBottom: 4,
    marginTop: 4,
  },
  horizontalRow: {
    flexDirection: 'row',
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
    fontSize: 9,
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
    fontSize: 9,
    fontWeight: '700',
    color: colors.blueDark,
  },
  udsCareSub: {
    fontSize: 8,
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
    fontSize: 9,
    color: '#A5D6A7',
    marginBottom: 4,
  },
  sampleIdLabelUds: {
    color: '#B5D4F4',
  },
  sampleIdVal: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 1,
  },
  sampleIdHint: {
    fontSize: 8,
    color: '#C8E6C9',
    marginTop: 4,
  },
  udsInputRow: {
    flexDirection: 'row',
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
    fontSize: 11,
    color: colors.grayDark,
  },
  recoveryRow: {
    backgroundColor: colors.grayLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recoveryLabel: {
    fontSize: 9,
    color: colors.grayMid,
  },
  recoveryVal: {
    fontSize: 10,
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
    fontSize: 9,
    fontWeight: '700',
    color: colors.amber,
  },
  slateSub: {
    fontSize: 8,
    color: '#633806',
    marginTop: 2,
  },
  disabledCameraBtn: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  disabledCameraBtnWide: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    opacity: 0.7,
  },
  disabledCameraText: {
    fontSize: 9,
    color: colors.grayMid,
    fontWeight: '700',
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
    fontSize: 10,
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
    fontSize: 9,
    fontWeight: '700',
    color: colors.redMid,
  },
  udsVerificationSub: {
    fontSize: 8,
    color: colors.grayMid,
    marginTop: 2,
  },
  checkRow: {
    flexDirection: 'row',
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
    fontSize: 9,
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
    fontSize: 9,
    fontWeight: '700',
    color: colors.amber,
  },
  timerSub: {
    fontSize: 8,
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
    fontSize: 12,
    fontWeight: '700',
  },
  blockHint: {
    fontSize: 8,
    color: colors.redMid,
    textAlign: 'center',
    marginBottom: 24,
  },
});
