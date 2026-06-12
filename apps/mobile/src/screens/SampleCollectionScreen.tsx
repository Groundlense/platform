import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
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
  const [slatePhotoTaken, setSlatePhotoTaken] = useState(false);
  const [sealedPhotoTaken, setSealedPhotoTaken] = useState(false);

  // Generate unique Sample ID based on borehole, depth, and type
  const typeChar = sampleType === 'DISTURBED' ? 'S' : 'U';
  const sampleSeq = intervalNo; // Sequence matches interval number for simplicity
  // format GL-BH03-4.5-S1
  const sampleId = `${borehole.boreholeCode.replace('-0047', '')}-${currentDepth.toFixed(1)}-${typeChar}${sampleSeq}`;

  const handleSlatePhoto = () => {
    setSlatePhotoTaken(true);
    Alert.alert('Slate Photo Stamped', 'Visual check slate board photo saved.');
  };

  const handleSealedPhoto = () => {
    setSealedPhotoTaken(true);
    Alert.alert('Sealed Sample Photo Stamped', 'Geotagged tube seal photo saved.');
  };

  const handleNextDepth = async () => {
    if (!slatePhotoTaken || !sealedPhotoTaken) {
      Alert.alert('Photos Required', 'Please take both the slate board and sealed sample photos.');
      return;
    }

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

      // 2. Create the sample record locally
      const sampleRecord = {
        id: `sample-${Date.now()}`,
        intervalId: intervalRecord.id,
        sampleNumber: sampleId,
        sampleType,
        sampleDepth: currentDepth,
        condition: 'SEALED',
        createdAt: new Date().toISOString(),
      };

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

      // Loop exit condition checks
      const nextDepth = currentDepth + 1.5;
      const nextInterval = intervalNo + 1;

      if (nextDepth >= 10.5 && sampleType === 'UNDISTURBED') {
        // Redirect to UDS specific screen or closure
        Alert.alert(
          'Target Depth Reached / लक्ष्य गहराई पूर्ण',
          'Borehole logging has completed target depth. Proceed to Closure.',
          [
            {
              text: 'Go to Closure / क्लोजर पर जाएं',
              onPress: () =>
                navigation.navigate('BoringClosure', {
                  borehole: updated.find(bh => bh.id === borehole.id),
                  projectId,
                }),
            },
          ]
        );
      } else if (nextDepth >= 13.5) {
        // Simulated target depth reached
        Alert.alert(
          'Target Depth Reached / लक्ष्य गहराई पूर्ण',
          'This borehole is complete! Let\'s close the logging.',
          [
            {
              text: 'Boring Closure / समाप्त करें',
              onPress: () =>
                navigation.navigate('BoringClosure', {
                  borehole: updated.find(bh => bh.id === borehole.id),
                  projectId,
                }),
            },
          ]
        );
      } else {
        // Return back to Screen 4 (SPT entry) for the next depth
        navigation.replace('SPTEntry', {
          borehole: updated.find(bh => bh.id === borehole.id),
          projectId,
          sessionId,
          currentDepth: nextDepth,
          intervalNo: nextInterval,
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save interval data');
    }
  };

  const formattedDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');

  return (
    <View style={[styles.container, sampleType === 'UNDISTURBED' && styles.containerUds]}>
      {/* Header */}
      <View style={[styles.headerBar, sampleType === 'UNDISTURBED' && styles.headerBarUds]}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {borehole.boreholeCode} · {sampleType === 'UNDISTURBED' ? 'UDS Sample' : t('sampleCollection', lang)}
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
            style={[styles.tileHalf, sampleType === 'DISTURBED' && styles.tileHalfActive]}
            onPress={() => setSampleType('DISTURBED')}
          >
            <Text style={[styles.tileText, sampleType === 'DISTURBED' && styles.tileTextActive]}>
              Disturbed SPT / विक्षुब्ध नमूना
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tileHalf, sampleType === 'UNDISTURBED' && styles.tileHalfActiveUds]}
            onPress={() => setSampleType('UNDISTURBED')}
          >
            <Text style={[styles.tileText, sampleType === 'UNDISTURBED' && styles.tileTextActiveUds]}>
              UDS Thin wall / अविक्षुब्ध
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Sample ID display card */}
        <View style={[styles.sampleIdBox, sampleType === 'UNDISTURBED' && styles.sampleIdBoxUds]}>
          <Text style={[styles.sampleIdLabel, sampleType === 'UNDISTURBED' && styles.sampleIdLabelUds]}>
            {t('writeOnTube', lang)} / ट्यूब पर लिखें
          </Text>
          <Text style={styles.sampleIdVal}>{sampleId}</Text>
          <Text style={[styles.sampleIdHint, sampleType === 'UNDISTURBED' && styles.sampleIdLabelUds]}>
            Use marker pen clearly / मार्कर से साफ लिखें
          </Text>
        </View>

        {/* Slate board photo widget */}
        <View style={styles.slateContainer}>
          <Text style={styles.slateTitle}>📋 Slate board photo required / स्लेट बोर्ड फोटो जरूरी</Text>
          <Text style={styles.slateSub}>
            Hold slate showing: BH ID · Depth · Date (like: GL-BH03 · {currentDepth.toFixed(1)}m · {new Date().toLocaleDateString('en-GB')})
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, slatePhotoTaken && styles.actionBtnDone]}
            onPress={handleSlatePhoto}
          >
            <Text style={[styles.actionBtnText, slatePhotoTaken && styles.actionBtnTextDone]}>
              📷 {slatePhotoTaken ? '✓ Slate Board Photo Captured' : 'Take slate board photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sealed tube photo button */}
        <TouchableOpacity
          style={[styles.cameraBtn, sealedPhotoTaken && styles.cameraBtnDone]}
          onPress={handleSealedPhoto}
        >
          <Text style={[styles.cameraBtnText, sealedPhotoTaken && styles.cameraBtnTextDone]}>
            📷 {sealedPhotoTaken ? '✓ Sealed Tube Photo Logged' : t('sealedPhoto', lang)}
          </Text>
        </TouchableOpacity>

        {/* UDS Specific wax verification checkboxes */}
        {sampleType === 'UNDISTURBED' && (
          <View style={styles.udsVerificationCard}>
            <Text style={styles.udsVerificationTitle}>
              ⚠️ Wax seal - BOTH ends mandatory
            </Text>
            <Text style={styles.udsVerificationSub}>
              दोनों तरफ मोम लगाना जरूरी है। Stored upright checked.
            </Text>
          </View>
        )}

        {/* 14-day countdown timer */}
        <View style={styles.timerBox}>
          <Text style={styles.timerTitle}>⏰ {t('labTimer', lang)}</Text>
          <Text style={styles.timerSub}>Must reach lab by: {formattedDeadline}</Text>
        </View>

        {/* Next depth action button */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNextDepth}>
          <Text style={styles.nextBtnText}>Next depth / अगली गहराई →</Text>
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
  actionBtn: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnDone: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenMid,
  },
  actionBtnText: {
    fontSize: 9,
    color: colors.amber,
    fontWeight: '700',
  },
  actionBtnTextDone: {
    color: colors.greenDark,
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
    fontSize: 10,
    color: colors.greenMid,
    fontWeight: '700',
  },
  cameraBtnTextDone: {
    color: colors.greenDark,
  },
  udsVerificationCard: {
    backgroundColor: colors.redLight,
    borderWidth: 0.5,
    borderColor: colors.redMid,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
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
    marginBottom: 24,
  },
  nextBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
