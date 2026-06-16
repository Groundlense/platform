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
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';

export default function RockCoringScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, sessionId, currentDepth, intervalNo } = route.params || {
    borehole: { id: 'bh-03', boreholeCode: 'GL-BH-0047-03' },
    projectId: 'proj-0047',
    sessionId: 'sess-123',
    currentDepth: 16.0,
    intervalNo: 11,
  };

  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  // Input states
  const [runLength, setRunLength] = useState('150'); // cm
  const [tcr, setTcr] = useState('120'); // total core recovery in cm
  const [rqdPieces, setRqdPieces] = useState('90'); // sum of pieces > 10cm in cm

  // Math calculations
  const run = parseFloat(runLength) || 150;
  const recovery = parseFloat(tcr) || 0;
  const solidPieces = parseFloat(rqdPieces) || 0;

  const tcrPercentage = Math.round((recovery / run) * 100);
  const rqdPercentage = Math.round((solidPieces / run) * 100);

  const getRqdRating = (rqd: number) => {
    if (rqd < 25) return 'Very Poor (बहुत खराब)';
    if (rqd < 50) return 'Poor (खराब)';
    if (rqd < 75) return 'Fair (मध्यम)';
    if (rqd < 90) return 'Good (अच्छा)';
    return 'Excellent (उत्कृष्ट)';
  };

  const handleSave = async () => {
    if (recovery > run || solidPieces > recovery) {
      Alert.alert('Invalid values', 'Core recovery cannot exceed run length, and RQD pieces cannot exceed total recovery.');
      return;
    }

    try {
      const rockRecord = {
        id: `interval-${borehole.id}-${intervalNo}`,
        boreholeId: borehole.id,
        intervalNo,
        fromDepth: currentDepth,
        toDepth: currentDepth + 1.5,
        soilDescription: `Rock coring run. TCR: ${tcrPercentage}%, RQD: ${rqdPercentage}% (${getRqdRating(rqdPercentage)})`,
        isCompleted: true,
        remarks: `TCR=${tcr}cm, RQD=${rqdPieces}cm. Run=${runLength}cm.`,
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
            currentDepth: currentDepth + 1.5,
          };
        }
        return bh;
      });
      await storage.saveBoreholes(projectId, updated);

      Alert.alert(
        'Core Run Saved / रन डेटा सुरक्षित',
        `TCR: ${tcrPercentage}% · RQD: ${rqdPercentage}% (${getRqdRating(rqdPercentage)}) recorded.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Direct navigation to closure or loop
              navigation.replace('BoringClosure', {
                borehole: updated.find(bh => bh.id === borehole.id),
                projectId,
              });
            }
          }
        ]
      );
    } catch (err) {
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
          <Text style={styles.rockVal}>🎸 Rock Coring Mode</Text>
          <Text style={styles.rockSub}>TCR & RQD auto-calculated / टीसीआर और आरक्यूडी गणना</Text>
        </View>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>Core Run Length (cm) / रन लंबाई (सेमी)</Text>
          <TextInput
            style={styles.input}
            value={runLength}
            onChangeText={setRunLength}
            keyboardType="numeric"
            placeholder="150"
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
            placeholder="120"
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
            placeholder="90"
            placeholderTextColor={colors.grayMid}
          />
        </View>

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
  rockBanner: {
    backgroundColor: colors.grayDark,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  rockVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FAC775',
  },
  rockSub: {
    fontSize: 8.5,
    color: colors.grayBorder,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 9,
    color: colors.grayMid,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
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
    fontSize: 9,
    color: colors.grayMid,
  },
  calcVal: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.rust,
  },
  ratingVal: {
    fontSize: 10,
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
    fontSize: 12,
    fontWeight: '700',
  },
});
