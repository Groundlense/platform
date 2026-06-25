import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../utils/theme';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';
import { api } from '../services/api';
import MockCameraModal from '../components/MockCameraModal';

const WEATHERING_GRADES = [
  { key: 'FRESH', en: 'Fresh', hi: 'ताज़ा' },
  { key: 'SLIGHTLY', en: 'Slightly weathered', hi: 'हल्का अपक्षय' },
  { key: 'MODERATELY', en: 'Moderately weathered', hi: 'मध्यम अपक्षय' },
  { key: 'HIGHLY', en: 'Highly weathered', hi: 'अत्यधिक अपक्षय' },
] as const;

export default function RockCoringScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, sessionId, currentDepth, intervalNo } = route.params ?? {};

  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  // Inputs always start empty — values come from the actual core run.
  const [runLength, setRunLength] = useState(''); // cm
  const [tcr, setTcr] = useState(''); // total core recovery in cm
  const [rqdPieces, setRqdPieces] = useState(''); // sum of pieces >= 10cm in cm
  const [weathering, setWeathering] = useState<string | null>(null);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);

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

  // Missing navigation params — never fabricate a borehole.
  if (!borehole?.id || currentDepth == null || intervalNo == null) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Rock Coring</Text>
        </View>
        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 16, color: colors.redMid, fontWeight: '700' }}>
            Boring data missing — reopen from the boring list. / डेटा नहीं मिला — सूची से दोबारा खोलें।
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

  const getRqdRating = (rqd: number) => {
    if (rqd < 25) return 'Very Poor (बहुत खराब)';
    if (rqd < 50) return 'Poor (खराब)';
    if (rqd < 75) return 'Fair (मध्यम)';
    if (rqd < 90) return 'Good (अच्छा)';
    return 'Excellent (उत्कृष्ट)';
  };

  const handleSave = async () => {
    if (run <= 0) {
      Alert.alert('Run length required', 'Enter the core run length in cm. / रन लंबाई दर्ज करें');
      return;
    }
    if (!weathering) {
      Alert.alert('Weathering grade required', 'Select the rock weathering grade (IS 4078). / अपक्षय ग्रेड चुनें');
      return;
    }
    if (recovery > run || solidPieces > recovery) {
      Alert.alert('Invalid values', 'Core recovery cannot exceed run length, and RQD pieces cannot exceed total recovery.');
      return;
    }

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
        soilDescription: `Rock coring run — ${grade?.en ?? weathering}. TCR: ${tcrPercentage}%, RQD: ${rqdPercentage}% (${getRqdRating(rqdPercentage)})`,
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

      // Per the prototype, coring loops run-by-run until the worker ends it.
      Alert.alert(
        'Core Run Saved / रन डेटा सुरक्षित',
        `TCR: ${tcrPercentage}% · RQD: ${rqdPercentage}% (${getRqdRating(rqdPercentage)}) recorded down to ${nextDepth.toFixed(2)}m.`,
        [
          {
            text: 'Next run / अगला रन',
            onPress: () => {
              navigation.replace('RockCoring', {
                borehole: updatedBorehole,
                projectId,
                sessionId,
                currentDepth: nextDepth,
                intervalNo: intervalNo + 1,
              });
            },
          },
          {
            text: 'End coring → Closure / समाप्त',
            onPress: () => {
              navigation.replace('BoringClosure', {
                borehole: updatedBorehole,
                projectId,
                sessionId,
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
        <Text style={styles.headerSub}>Rock encountered at {currentDepth}m</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.rockBanner}>
          <Text style={styles.rockVal}>⛰️ Rock Coring Mode</Text>
          <Text style={styles.rockSub}>TCR & RQD auto-calculated / टीसीआर और आरक्यूडी गणना</Text>
        </View>

        {/* Weathering grade (IS 4078) */}
        <Text style={styles.fieldLabel}>Weathering grade (IS 4078) / अपक्षय ग्रेड</Text>
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
          <Text style={styles.fieldLabel}>Core Run Length (cm) / रन लंबाई (सेमी)</Text>
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
          <Text style={styles.fieldLabel}>Total Core Recovery (TCR) (cm) / कुल कोर रिकवरी</Text>
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
          <Text style={styles.fieldLabel}>Solid Core Pieces &gt; 10cm (RQD) (cm) / 10सेमी से बड़े ठोस टुकड़े</Text>
          <TextInput
            style={styles.input}
            value={rqdPieces}
            onChangeText={setRqdPieces}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.grayMid}
          />
        </View>

        {/* Core box photo — camera module not yet integrated */}
        <TouchableOpacity
          style={[styles.photoBtn, photoCaptured && styles.photoBtnDone]}
          onPress={() => setCameraVisible(true)}
        >
          <Text style={[styles.photoBtnText, photoCaptured && styles.photoBtnTextDone]}>
            {photoCaptured ? '✓ Core Box Photo Captured / फोटो ले लिया गया' : '📷 Core Box Photo / कोर बॉक्स फोटो'}
          </Text>
        </TouchableOpacity>

        {/* Real-time Math Outputs */}
        <View style={styles.calcResults}>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>TCR / कोर रिकवरी %:</Text>
            <Text style={styles.calcVal}>{tcrPercentage}%</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>RQD / रॉक गुणवत्ता %:</Text>
            <Text style={styles.calcVal}>{rqdPercentage}%</Text>
          </View>
          <View style={[styles.calcRow, styles.lastRow]}>
            <Text style={styles.calcLabel}>Rock Quality Rating / रॉक ग्रेड:</Text>
            <Text style={styles.ratingVal}>{getRqdRating(rqdPercentage)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Run & Continue / सुरक्षित करें →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Simulated Viewfinder Overlay */}
      <MockCameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCapture={handleCapturePhoto}
        boreholeCode={borehole.boreholeCode}
        depth={currentDepth}
        photoType="Core Box Photo"
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
  rockBanner: {
    backgroundColor: colors.grayDark,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  rockVal: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FAC775',
  },
  rockSub: {
    fontSize: 11,
    color: colors.grayBorder,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 15,
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
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayBorder,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  calcLabel: {
    fontSize: 12,
    color: colors.grayMid,
  },
  calcVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.rust,
  },
  ratingVal: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '700',
  },
});
