import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { calculateRawN, calculateOverburdenCorrection, applyDilatancyCorrection, getDensityInterpretation } from '../utils/calculations';
import { api } from '../services/api';
import { syncManager } from '../services/sync';
import MockCameraModal from '../components/MockCameraModal';

export default function SPTEntryScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, sessionId, currentDepth, intervalNo } = route.params ?? {};

  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  // Blow count states — always entered fresh per interval, never pre-filled.
  const [blow15, setBlow15] = useState(0); // 0-15cm
  const [blow30, setBlow30] = useState(0); // 15-30cm
  const [blow45, setBlow45] = useState(0); // 30-45cm
  const [activeInterval, setActiveInterval] = useState<1 | 2 | 3>(1);

  // Correction flags
  const [isBelowWaterTable, setIsBelowWaterTable] = useState(false);
  const [isRefusal, setIsRefusal] = useState(false);
  const [penetrationMm, setPenetrationMm] = useState('');

  // Real recorded water table (undefined until the worker logs one)
  const [waterTableDepth, setWaterTableDepth] = useState<number | undefined>(undefined);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);

  useEffect(() => {
    if (!borehole?.id) return;
    (async () => {
      const observations = await storage.getWaterTable(borehole.id);
      if (observations.length > 0) {
        const latest = observations[observations.length - 1];
        const depth = Number(latest.depth);
        if (Number.isFinite(depth)) setWaterTableDepth(depth);
      }
    })();
  }, [borehole?.id]);

  // Missing navigation params — never fabricate a borehole.
  if (!borehole?.id || currentDepth == null || intervalNo == null) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>SPT Entry</Text>
        </View>
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 16, color: colors.redMid, fontWeight: '700' }}>
            Boring data missing — reopen from the boring list. / डेटा नहीं मिला — सूची से दोबारा खोलें।
          </Text>
          <TouchableOpacity style={[styles.nextBtn, { marginTop: 16 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.nextBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Planned interval count from the engineer's real planned depth (1.5 m spacing)
  const plannedDepthNum = Number(borehole.plannedDepth);
  const plannedIntervals = Number.isFinite(plannedDepthNum) && plannedDepthNum > 0
    ? Math.ceil(plannedDepthNum / 1.5)
    : null;

  // Computed values
  const rawN = isRefusal ? 100 : calculateRawN(blow30, blow45);

  // Overburden correction uses the real recorded WT (or none at all)
  const { correctedN: overburdenN } = calculateOverburdenCorrection(
    currentDepth,
    rawN,
    waterTableDepth
  );

  // Apply dilatancy if selected and raw/overburden N > 15
  const finalCorrectedN = isBelowWaterTable ? applyDilatancyCorrection(overburdenN) : overburdenN;
  const interpretation = getDensityInterpretation(finalCorrectedN);

  const handleIncrement = () => {
    if (activeInterval === 1) setBlow15(p => p + 1);
    if (activeInterval === 2) setBlow30(p => p + 1);
    if (activeInterval === 3) setBlow45(p => p + 1);
  };

  const handleDecrement = () => {
    if (activeInterval === 1) setBlow15(p => Math.max(0, p - 1));
    if (activeInterval === 2) setBlow30(p => Math.max(0, p - 1));
    if (activeInterval === 3) setBlow45(p => Math.max(0, p - 1));
  };

  const handleTakePhoto = () => {
    setCameraVisible(true);
  };

  const handleCapturePhoto = async (base64Data: string, filename: string) => {
    setPhotoCaptured(true);

    const intervalId = `interval-${borehole.id}-${intervalNo}`;
    try {
      await api.uploadMedia(intervalId, base64Data, filename);
    } catch {
      await syncManager.queueOperation(
        'PHOTO',
        `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        'CREATE',
        {
          intervalId,
          fileName: filename,
          mimeType: 'image/jpeg',
          base64Data,
        },
        sessionId
      );
    }
  };

  const handleNext = () => {
    if (!isRefusal && blow30 === 0 && blow45 === 0) {
      Alert.alert(
        'Blows Required / ब्लो गिनती दर्ज करें',
        'Enter the blow counts for the 15–30cm and 30–45cm drives (or mark refusal).'
      );
      return;
    }

    if (isRefusal) {
      const mm = parseInt(penetrationMm, 10);
      if (!Number.isFinite(mm) || mm <= 0 || mm > 150) {
        Alert.alert('Penetration Required', 'Enter the mm penetrated (1–150) for the refusal record.');
        return;
      }
    }

    // Pass data forward to SoilDescription screen
    navigation.navigate('SoilDescription', {
      borehole,
      projectId,
      sessionId,
      currentDepth,
      intervalNo,
      sptData: {
        blow1: blow15,
        blow2: blow30,
        blow3: blow45,
        rawN,
        correctedN: finalCorrectedN,
        isRefusal,
        penetrationMm: isRefusal ? parseInt(penetrationMm, 10) : undefined,
        dilatancyApplied: isBelowWaterTable,
      },
    });
  };

  const handleWaterTable = () => {
    navigation.navigate('WaterTable', { borehole, projectId, currentDepth });
  };

  const handleTerminate = () => {
    navigation.navigate('Terminate', { borehole, projectId, currentDepth });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {borehole.boreholeCode} · {t('sptEntry', lang)}
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
        {/* Loop progress tracker — counts derive from the real planned depth */}
        <View style={styles.loopBar}>
          <Text style={styles.loopText}>
            {plannedIntervals
              ? `Interval ${intervalNo} of ${plannedIntervals} planned`
              : `Interval ${intervalNo} — planned depth not set`}
          </Text>
          <View style={styles.loopDots}>
            {Array.from({ length: Math.min(plannedIntervals ?? intervalNo, 13) }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.loopDot,
                  i + 1 < intervalNo && styles.loopDotDone,
                  i + 1 === intervalNo && styles.loopDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Depth display banner */}
        <View style={styles.depthBanner}>
          <Text style={styles.depthVal}>{currentDepth.toFixed(1)} m</Text>
          <Text style={styles.depthSub}>
            Current depth · {activeInterval === 1 && '0–15cm interval'}
            {activeInterval === 2 && '15–30cm interval'}
            {activeInterval === 3 && '30–45cm interval'}
          </Text>
        </View>

        {/* Active interval values */}
        <Text style={styles.fieldLabel}>
          Blows count / ब्लो गिनती — tap segment to edit
        </Text>
        <View style={styles.blowGrid}>
          <TouchableOpacity
            style={[styles.blowTile, activeInterval === 1 && styles.blowTileActive]}
            onPress={() => setActiveInterval(1)}
          >
            <Text style={[styles.blowLabel, activeInterval === 1 && styles.blowTextActive]}>
              0–15cm
            </Text>
            <Text style={[styles.blowNum, activeInterval === 1 && styles.blowTextActive]}>
              {blow15}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.blowTile, activeInterval === 2 && styles.blowTileActive]}
            onPress={() => setActiveInterval(2)}
          >
            <Text style={[styles.blowLabel, activeInterval === 2 && styles.blowTextActive]}>
              15–30cm
            </Text>
            <Text style={[styles.blowNum, activeInterval === 2 && styles.blowTextActive]}>
              {blow30}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.blowTile, activeInterval === 3 && styles.blowTileActive]}
            onPress={() => setActiveInterval(3)}
          >
            <Text style={[styles.blowLabel, activeInterval === 3 && styles.blowTextActive]}>
              30–45cm
            </Text>
            <Text style={[styles.blowNum, activeInterval === 3 && styles.blowTextActive]}>
              {blow45}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Editing keypad buttons */}
        <View style={styles.editWidget}>
          <Text style={styles.editTitle}>
            Edit {activeInterval === 1 && '0-15cm'}
            {activeInterval === 2 && '15-30cm'}
            {activeInterval === 3 && '30-45cm'} blows
          </Text>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keypadBtn} onPress={handleDecrement}>
              <Text style={styles.keypadBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.keypadDisplay}>
              {activeInterval === 1 && blow15}
              {activeInterval === 2 && blow30}
              {activeInterval === 3 && blow45}
            </Text>
            <TouchableOpacity style={styles.keypadBtn} onPress={handleIncrement}>
              <Text style={styles.keypadBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Real-time geotech calculations display */}
        <View style={styles.calcResults}>
          <Text style={styles.calcLeft}>
            {t('rawN', lang)} = {rawN} · {t('correctedN', lang)} = {finalCorrectedN}
          </Text>
          <Text style={styles.calcRight}>{interpretation}</Text>
        </View>
        <Text style={styles.fieldLabel}>
          {waterTableDepth !== undefined
            ? `Overburden correction uses recorded WT at ${waterTableDepth.toFixed(2)} m`
            : 'WT not recorded yet — overburden correction assumes dry profile / भूजल स्तर दर्ज नहीं'}
        </Text>

        {/* Dilatancy prompt */}
        <View style={styles.promptBox}>
          <Text style={styles.promptText}>{t('fineSandWT', lang)}</Text>
          <View style={styles.promptAction}>
            <TouchableOpacity
              style={[styles.promptBtn, isBelowWaterTable && styles.promptBtnYes]}
              onPress={() => setIsBelowWaterTable(true)}
            >
              <Text style={[styles.promptBtnText, isBelowWaterTable && styles.promptBtnTextActive]}>
                {t('yes', lang)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.promptBtn, !isBelowWaterTable && styles.promptBtnNo]}
              onPress={() => setIsBelowWaterTable(false)}
            >
              <Text style={[styles.promptBtnText, !isBelowWaterTable && styles.promptBtnTextActive]}>
                {t('no', lang)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Refusal Toggle */}
        <TouchableOpacity
          style={[styles.refusalToggleBtn, isRefusal && styles.refusalToggleBtnActive]}
          onPress={() => setIsRefusal(!isRefusal)}
        >
          <Text style={[styles.refusalToggleBtnText, isRefusal && styles.refusalToggleBtnTextActive]}>
            ⛔ Refusal (N=100) — enter mm penetrated
          </Text>
        </TouchableOpacity>

        {isRefusal && (
          <View style={styles.refusalBox}>
            <Text style={styles.refusalTitle}>Refusal — partial penetration before N=100</Text>
            <View style={styles.refusalInputRow}>
              <TextInput
                style={styles.refusalInput}
                value={penetrationMm}
                onChangeText={setPenetrationMm}
                keyboardType="numeric"
              />
              <Text style={styles.refusalUnit}>mm penetrated (of 150mm)</Text>
            </View>
            <Text style={styles.refusalSub}>रिफ्यूजल — कितने mm तक घुसा (IS 2131)</Text>
          </View>
        )}

        {/* Photo Button — camera module not yet integrated, honest state */}
        <TouchableOpacity
          style={[styles.photoBtn, photoCaptured && styles.photoBtnDone]}
          onPress={handleTakePhoto}
        >
          <Text style={[styles.photoBtnText, photoCaptured && styles.photoBtnTextDone]}>
            {photoCaptured ? '✓ Split Spoon Photo Captured / फोटो ले लिया गया' : `📷 ${t('splitSpoonPhoto', lang)}`}
          </Text>
        </TouchableOpacity>

        {/* Multi CTA Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtnSec} onPress={handleWaterTable}>
            <Text style={styles.actionBtnSecText}>💧 {t('waterTable', lang)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnTerm} onPress={handleTerminate}>
            <Text style={styles.actionBtnTermText}>⏹ {t('terminateBtn', lang)}</Text>
          </TouchableOpacity>
        </View>

        {/* Next screen button */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>{t('next', lang)} → Soil description</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Simulated Viewfinder Overlay */}
      <MockCameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCapture={handleCapturePhoto}
        boreholeCode={borehole.boreholeCode}
        depth={currentDepth}
        photoType="Split Spoon Photo"
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
  loopBar: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  loopText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amber,
  },
  loopDots: {
    flexDirection: 'row',
    gap: 4,
  },
  loopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.grayBorder,
  },
  loopDotDone: {
    backgroundColor: colors.greenMid,
  },
  loopDotActive: {
    backgroundColor: colors.rustMid,
  },
  depthBanner: {
    backgroundColor: colors.rust,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  depthVal: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.white,
  },
  depthSub: {
    fontSize: 12,
    color: '#F5C4B3',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.grayMid,
    marginBottom: 4,
  },
  blowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  blowTile: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
  },
  blowTileActive: {
    backgroundColor: colors.rustLight,
    borderColor: colors.rustMid,
    borderWidth: 1.5,
  },
  blowLabel: {
    fontSize: 11,
    color: colors.grayMid,
  },
  blowNum: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.grayDark,
    marginTop: 2,
  },
  blowTextActive: {
    color: colors.rust,
    fontWeight: '700',
  },
  editWidget: {
    backgroundColor: colors.rustLight,
    borderColor: colors.rustMid,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  editTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.rustMid,
    textTransform: 'uppercase',
  },
  keypadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 6,
  },
  keypadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.rustMid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadBtnText: {
    fontSize: 27,
    fontWeight: '700',
    color: colors.rust,
  },
  keypadDisplay: {
    fontSize: 38,
    fontWeight: '700',
    color: colors.rust,
    minWidth: 40,
    textAlign: 'center',
  },
  calcResults: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calcLeft: {
    fontSize: 12,
    color: colors.amber,
    fontWeight: '700',
  },
  calcRight: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.greenMid,
  },
  promptBox: {
    backgroundColor: colors.blueLight,
    borderWidth: 0.5,
    borderColor: '#85B7EB',
    borderRadius: 6,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  promptText: {
    fontSize: 12,
    color: colors.blueDark,
    fontWeight: '600',
  },
  promptAction: {
    flexDirection: 'row',
    gap: 4,
  },
  promptBtn: {
    backgroundColor: colors.grayLight,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  promptBtnYes: {
    backgroundColor: colors.blueDark,
  },
  promptBtnNo: {
    backgroundColor: colors.grayMid,
  },
  promptBtnText: {
    fontSize: 11,
    color: colors.grayDark,
  },
  promptBtnTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  refusalToggleBtn: {
    backgroundColor: colors.redLight,
    borderWidth: 0.5,
    borderColor: colors.redMid,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  refusalToggleBtnActive: {
    backgroundColor: colors.redMid,
  },
  refusalToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.redMid,
  },
  refusalToggleBtnTextActive: {
    color: colors.white,
  },
  refusalBox: {
    backgroundColor: colors.redLight,
    borderWidth: 1,
    borderColor: colors.redMid,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  refusalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.redMid,
  },
  refusalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  refusalInput: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.redMid,
    borderRadius: 4,
    width: 60,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.redMid,
  },
  refusalUnit: {
    fontSize: 12,
    color: colors.grayMid,
  },
  refusalSub: {
    fontSize: 11,
    color: colors.redMid,
    marginTop: 3,
  },
  photoBtn: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.greenMid,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  photoBtnDone: {
    backgroundColor: colors.greenLight,
  },
  photoBtnText: {
    fontSize: 14,
    color: colors.greenMid,
    fontWeight: '700',
  },
  photoBtnTextDone: {
    color: colors.greenDark,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  actionBtnSec: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnSecText: {
    fontSize: 14,
    color: colors.grayDark,
    fontWeight: '600',
  },
  actionBtnTerm: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.redMid,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnTermText: {
    fontSize: 14,
    color: colors.redMid,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '700',
  },
});
