import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { colors } from '../utils/theme';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';
import { media } from '../services/media';
import { useLanguage } from '../utils/LanguageContext';

const WEATHERING_GRADES = [
  { key: 'FRESH', en: 'Fresh', hi: 'ताज़ा' },
  { key: 'SLIGHTLY', en: 'Slightly weathered', hi: 'हल्का अपक्षय' },
  { key: 'MODERATELY', en: 'Moderately weathered', hi: 'मध्यम अपक्षय' },
  { key: 'HIGHLY', en: 'Highly weathered', hi: 'अत्यधिक अपक्षय' },
] as const;

export default function RockCoringScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, sessionId, currentDepth, intervalNo } = route.params ?? {};

  const { lang, setLang } = useLanguage();

  // Inputs always start empty — values come from the actual core run.
  const [runLength, setRunLength] = useState(''); // cm
  const [tcr, setTcr] = useState(''); // total core recovery in cm
  const [rqdPieces, setRqdPieces] = useState(''); // sum of pieces >= 10cm in cm
  const [weathering, setWeathering] = useState<string | null>(null);

  const [photoCaptured, setPhotoCaptured] = useState(false);

  // "Continue boring" after a core run: the worker confirms the SPT
  // interval to use below the rock band instead of the app assuming one.
  const [intervalPrompt, setIntervalPrompt] = useState<{
    nextDepth: number;
    borehole: any;
  } | null>(null);
  const [sptIntervalStr, setSptIntervalStr] = useState('');

  const handleContinueBoring = async () => {
    if (!intervalPrompt) return;
    const chosen = parseFloat(sptIntervalStr);
    if (!Number.isFinite(chosen) || chosen <= 0 || chosen > 10) {
      Alert.alert(
        lang === 'hi' ? 'अमान्य अंतराल' : 'Invalid interval',
        lang === 'hi'
          ? 'SPT अंतराल मीटर में दर्ज करें (जैसे 1.5)।'
          : 'Enter the SPT interval in meters (e.g. 1.5).'
      );
      return;
    }
    await storage.setBoreholeSptInterval(borehole.id, chosen);
    const target = intervalPrompt;
    setIntervalPrompt(null);
    // currentDepth is the depth of the UPCOMING SPT test: one chosen
    // interval below the bottom of the rock run just recorded.
    navigation.replace('SPTEntry', {
      borehole: target.borehole,
      projectId,
      sessionId,
      currentDepth: Math.round((target.nextDepth + chosen) * 100) / 100,
      intervalNo: intervalNo + 1,
    });
  };

  // Real camera capture — photo is queued locally and uploaded on sync
  // once this interval exists on the server.
  const handleTakePhoto = async () => {
    const shot = await media.capturePhoto('CORE_BOX', lang);
    if (!shot) return; // cancelled / unavailable / denied — honest Alert already shown
    await media.queuePhoto({
      boreholeId: borehole.id,
      intervalNo,
      purpose: 'CORE_BOX',
      uri: shot.uri,
      fileName: shot.fileName,
      mimeType: shot.type,
      gpsLat: shot.gpsLat,
      gpsLng: shot.gpsLng,
      accuracyM: shot.accuracyM,
      takenAt: new Date().toISOString(),
    });
    setPhotoCaptured(true);
  };

  // Missing navigation params — never fabricate a borehole.
  if (!borehole?.id || currentDepth == null || intervalNo == null) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Rock Coring</Text>
        </View>
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 18, color: colors.redMid, fontWeight: '700' }}>
            {lang === 'hi'
              ? 'डेटा नहीं मिला — सूची से दोबारा खोलें।'
              : 'Boring data missing — reopen from the boring list.'}
          </Text>
          <TouchableOpacity style={[styles.saveBtn, { marginTop: 16 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.saveBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Math calculations
  const run = parseFloat(runLength) || 0;
  const recovery = parseFloat(tcr) || 0;
  const solidPieces = parseFloat(rqdPieces) || 0;

  const tcrPercentage = run > 0 ? Math.round((recovery / run) * 100) : 0;
  const rqdPercentage = run > 0 ? Math.round((solidPieces / run) * 100) : 0;

  const getRqdRating = (rqd: number, l: 'en' | 'hi') => {
    if (rqd < 25) return l === 'hi' ? 'बहुत खराब' : 'Very Poor';
    if (rqd < 50) return l === 'hi' ? 'खराब' : 'Poor';
    if (rqd < 75) return l === 'hi' ? 'मध्यम' : 'Fair';
    if (rqd < 90) return l === 'hi' ? 'अच्छा' : 'Good';
    return l === 'hi' ? 'उत्कृष्ट' : 'Excellent';
  };

  const handleSave = async () => {
    if (run <= 0) {
      Alert.alert(
        'Run length required',
        lang === 'hi' ? 'रन लंबाई दर्ज करें' : 'Enter the core run length in cm.'
      );
      return;
    }
    if (!weathering) {
      Alert.alert(
        'Weathering grade required',
        lang === 'hi' ? 'अपक्षय ग्रेड चुनें' : 'Select the rock weathering grade (IS 4078).'
      );
      return;
    }
    if (recovery > run || solidPieces > recovery) {
      Alert.alert('Invalid values', 'Core recovery cannot exceed run length, and RQD pieces cannot exceed total recovery.');
      return;
    }

    // Never block on the photo when the device has no camera, but if one
    // exists, ask before saving the run without a core-box photo.
    if (!photoCaptured && !media.isCameraKnownUnavailable()) {
      Alert.alert(
        lang === 'hi' ? 'फोटो नहीं ली गई' : 'No photo attached',
        lang === 'hi'
          ? 'रन सुरक्षित करने से पहले कोर बॉक्स फोटो लें?'
          : 'Take the core box photo before saving this run?',
        [
          { text: lang === 'hi' ? 'फोटो लें' : '📷 Take photo', onPress: () => { handleTakePhoto(); } },
          { text: lang === 'hi' ? 'बिना फोटो जारी रखें' : 'Continue without photo', onPress: () => { performSave(); } },
        ]
      );
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    const grade = WEATHERING_GRADES.find((g) => g.key === weathering);
    const runMeters = run / 100;
    const nextDepth = Math.round((currentDepth + runMeters) * 100) / 100;

    try {
      const rockRecord = {
        id: `interval-${borehole.id}-${intervalNo}`,
        boreholeId: borehole.id,
        intervalNo,
        fromDepth: currentDepth,
        toDepth: nextDepth,
        soilDescription: `Rock coring run — ${grade?.en ?? weathering}. TCR: ${tcrPercentage}%, RQD: ${rqdPercentage}% (${getRqdRating(rqdPercentage, lang)})`,
        isCompleted: true,
        remarks: `TCR=${tcr}cm, RQD=${rqdPieces}cm. Run=${runLength}cm. Weathering=${grade?.en ?? weathering}.`,
        observedAt: new Date().toISOString(),
      };

      const intervals = await storage.getIntervals(borehole.id);
      intervals.push(rockRecord);
      await storage.saveIntervals(borehole.id, intervals);

      // Queue Sync Operation
      await syncManager.queueOperation(
        'SPT_RECORD',
        rockRecord.id,
        'CREATE',
        rockRecord,
        sessionId
      );

      // Update current depth of borehole
      const cachedBoreholes = await storage.getBoreholes(projectId);
      const updated = cachedBoreholes.map((bh: any) => {
        if (bh.id === borehole.id) {
          return {
            ...bh,
            currentDepth: nextDepth,
          };
        }
        return bh;
      });
      await storage.saveBoreholes(projectId, updated);
      const updatedBorehole = updated.find((bh: any) => bh.id === borehole.id) ?? borehole;

      // Loop exit by the borehole's REAL planned depth, mirroring the SPT
      // loop in SampleCollection. Without this the coring loop never ends
      // on its own — "Next run" kept returning here even past target depth.
      const plannedDepth = parseFloat(borehole.plannedDepth);
      const targetReached = !isNaN(plannedDepth) && plannedDepth > 0 && nextDepth >= plannedDepth;

      if (targetReached) {
        Alert.alert(
          lang === 'hi' ? 'लक्ष्य गहराई पूर्ण' : 'Target Depth Reached',
          lang === 'hi'
            ? `नियोजित गहराई ${plannedDepth.toFixed(1)}m पूरी हुई। समापन पर जाएं।`
            : `Planned depth ${plannedDepth.toFixed(1)}m reached (run recorded down to ${nextDepth.toFixed(2)}m). Proceed to closure.`,
          [
            {
              text: lang === 'hi' ? 'समाप्त करें' : 'Boring Closure',
              onPress: () => {
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'BoringList', params: { projectId } },
                    { name: 'BoringClosure', params: { borehole: updatedBorehole, projectId, sessionId } },
                  ],
                });
              },
            },
          ]
        );
        return;
      }

      // Rejoin the main boring loop (Screen 4) at the new depth — rock
      // coring is a detour from Soil Description, and the worker re-enters
      // it from there if the next interval is still rock.
      Alert.alert(
        lang === 'hi' ? 'रन डेटा सुरक्षित' : 'Core Run Saved',
        `TCR: ${tcrPercentage}% · RQD: ${rqdPercentage}% (${getRqdRating(rqdPercentage, lang)}) recorded down to ${nextDepth.toFixed(2)}m.`,
        [
          {
            text: lang === 'hi' ? `बोरिंग जारी रखें (${nextDepth.toFixed(2)}m से)` : `Continue boring (from ${nextDepth.toFixed(2)}m)`,
            onPress: async () => {
              // Ask the worker to confirm the SPT interval below the rock
              // band — never assume the pre-rock spacing still applies.
              const effective = await storage.getSptInterval(projectId, borehole.id);
              setSptIntervalStr(String(effective));
              setIntervalPrompt({ nextDepth, borehole: updatedBorehole });
            },
          },
          {
            text: lang === 'hi' ? 'समाप्त' : 'End coring → Closure',
            onPress: () => {
              // Reset (not replace/navigate): the rig-setup → start-boring →
              // SPT/soil → rock-coring chain leading here should be cleared
              // from the back stack once coring is done, otherwise Back from
              // Closure re-enters those stale mid-flow screens — which is
              // what made the Rock flow feel like it was "stuck in a loop"
              // (Back kept landing you back inside Soil Description with
              // "Rock" still selected, letting you re-enter Rock Coring).
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'BoringList', params: { projectId } },
                  { name: 'BoringClosure', params: { borehole: updatedBorehole, projectId, sessionId } },
                ],
              });
            },
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to save rock coring run');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {borehole.boreholeCode} · Rock Coring (Screen 8)
          </Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>{lang === 'hi' ? 'En' : 'हिं'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>
          {lang === 'hi' ? `कोरिंग रन ${currentDepth}m से` : `Coring run from ${currentDepth}m`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.rockBanner}>
          <Text style={styles.rockVal}>⛰️ Rock Coring Mode</Text>
          <Text style={styles.rockSub}>
            {lang === 'hi' ? 'टीसीआर और आरक्यूडी गणना' : 'TCR & RQD auto-calculated'}
          </Text>
        </View>

        {/* Weathering grade (IS 4078) */}
        <Text style={styles.fieldLabel}>
          {lang === 'hi' ? 'अपक्षय ग्रेड' : 'Weathering grade (IS 4078)'}
        </Text>
        <View style={styles.weatherGrid}>
          {WEATHERING_GRADES.map((g) => (
            <TouchableOpacity
              key={g.key}
              style={[styles.weatherTile, weathering === g.key && styles.weatherTileActive]}
              onPress={() => setWeathering(g.key)}
            >
              <Text style={[styles.weatherTileText, weathering === g.key && styles.weatherTileTextActive]}>
                {lang === 'hi' ? g.hi : g.en}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>
            {lang === 'hi' ? 'रन लंबाई (सेमी)' : 'Core Run Length (cm)'}
          </Text>
          <TextInput
            style={styles.input}
            value={runLength}
            onChangeText={setRunLength}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.grayMid}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>
            {lang === 'hi' ? 'कुल कोर रिकवरी' : 'Total Core Recovery (TCR) (cm)'}
          </Text>
          <TextInput
            style={styles.input}
            value={tcr}
            onChangeText={setTcr}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.grayMid}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>
            {lang === 'hi' ? '10सेमी से बड़े ठोस टुकड़े' : 'Solid Core Pieces > 10cm (RQD) (cm)'}
          </Text>
          <TextInput
            style={styles.input}
            value={rqdPieces}
            onChangeText={setRqdPieces}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.grayMid}
          />
        </View>

        {/* Core box photo — opens the real device camera */}
        <TouchableOpacity
          style={[styles.photoBtn, photoCaptured && styles.photoBtnDone]}
          onPress={handleTakePhoto}
        >
          <Text style={[styles.photoBtnText, photoCaptured && styles.photoBtnTextDone]}>
            {photoCaptured
              ? (lang === 'hi' ? 'फोटो ली गई' : '✓ Photo captured — uploads on sync')
              : (lang === 'hi' ? 'कोर बॉक्स फोटो' : '📷 Core Box Photo')}
          </Text>
        </TouchableOpacity>

        {/* Real-time Math Outputs */}
        <View style={styles.calcResults}>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>{lang === 'hi' ? 'कोर रिकवरी %:' : 'TCR'}</Text>
            <Text style={styles.calcVal}>{tcrPercentage}%</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>{lang === 'hi' ? 'रॉक गुणवत्ता %:' : 'RQD'}</Text>
            <Text style={styles.calcVal}>{rqdPercentage}%</Text>
          </View>
          <View style={[styles.calcRow, styles.lastRow]}>
            <Text style={styles.calcLabel}>{lang === 'hi' ? 'रॉक ग्रेड:' : 'Rock Quality Rating'}</Text>
            <Text style={styles.ratingVal}>{getRqdRating(rqdPercentage, lang)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {lang === 'hi' ? 'सुरक्षित करें →' : 'Save Run & Continue'}
          </Text>
        </TouchableOpacity>

        {/* Exit the coring loop without closing the borehole — end-of-day /
            equipment pauses happen mid-rock too, not only during SPT. */}
        <TouchableOpacity
          style={styles.terminateBtn}
          onPress={() =>
            navigation.navigate('Terminate', {
              borehole,
              projectId,
              currentDepth,
            })
          }
        >
          <Text style={styles.terminateBtnText}>
            {lang === 'hi' ? '⏸ बोरिंग रोकें/थकावट' : '⏸ Terminate / Pause'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SPT interval confirmation before rejoining the SPT loop */}
      <Modal
        visible={intervalPrompt !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setIntervalPrompt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {lang === 'hi' ? 'SPT अंतराल की पुष्टि करें' : 'Confirm SPT interval'}
            </Text>
            <Text style={styles.modalSub}>
              {lang === 'hi'
                ? `${intervalPrompt?.nextDepth.toFixed(2)}m से बोरिंग जारी रहेगी। आगे के SPT टेस्ट किस अंतराल पर होंगे?`
                : `Boring continues from ${intervalPrompt?.nextDepth.toFixed(2)}m. At what interval should the next SPT tests run?`}
            </Text>
            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                value={sptIntervalStr}
                onChangeText={setSptIntervalStr}
                keyboardType="decimal-pad"
                placeholder="1.5"
                placeholderTextColor={colors.grayMid}
                autoFocus
              />
              <Text style={styles.modalUnit}>m</Text>
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIntervalPrompt(null)}
              >
                <Text style={styles.modalCancelText}>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOkBtn} onPress={handleContinueBoring}>
                <Text style={styles.modalOkText}>
                  {lang === 'hi' ? 'जारी रखें →' : 'Continue →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  rockBanner: {
    backgroundColor: colors.grayDark,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  rockVal: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FAC775',
  },
  rockSub: {
    fontSize: 15,
    color: colors.grayBorder,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.grayMid,
    marginBottom: 4,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  weatherTile: {
    width: '48%',
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  weatherTileActive: {
    backgroundColor: colors.grayDark,
    borderColor: colors.grayDark,
  },
  weatherTileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.grayDark,
  },
  weatherTileTextActive: {
    color: '#FAC775',
    fontWeight: '700',
  },
  photoBtn: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.greenMid,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  photoBtnDone: {
    backgroundColor: colors.greenLight,
  },
  photoBtnText: {
    fontSize: 16,
    color: colors.greenMid,
    fontWeight: '700',
  },
  photoBtnTextDone: {
    color: colors.greenDark,
  },
  input: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 17,
    color: colors.grayDark,
  },
  calcResults: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 8,
    padding: 10,
    marginVertical: 12,
  },
  calcRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayBorder,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  calcLabel: {
    fontSize: 14,
    color: colors.grayMid,
  },
  calcVal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.rust,
  },
  ratingVal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.greenMid,
  },
  saveBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  terminateBtn: {
    borderWidth: 0.5,
    borderColor: colors.redMid,
    backgroundColor: colors.redLight,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  terminateBtnText: {
    color: colors.redMid,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.grayDark,
  },
  modalSub: {
    fontSize: 14,
    color: colors.grayMid,
    marginTop: 6,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 20,
    fontWeight: '700',
    color: colors.grayDark,
    width: 100,
    textAlign: 'center',
  },
  modalUnit: {
    fontSize: 16,
    color: colors.grayMid,
    fontWeight: '600',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: colors.grayLight,
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.grayDark,
    fontWeight: '600',
  },
  modalOkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: colors.rustMid,
  },
  modalOkText: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '700',
  },
});
