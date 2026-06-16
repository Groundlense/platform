import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';

export default function RigSetupScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId } = route.params;
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  // Input states with defaults matching the specification mockup
  const [rigType, setRigType] = useState('Rotary drilling');
  const [diameter, setDiameter] = useState('150 mm');
  const [fluid, setFluid] = useState('Water');
  const [hammerType, setHammerType] = useState('Auto-trip');
  const [drillerId, setDrillerId] = useState('GL-D-0018 · Ramesh Singh');
  const [startDate, setStartDate] = useState('04-12-2025');

  const handleConfirm = async () => {
    try {
      const cachedBoreholes = await storage.getBoreholes(projectId);
      const updated = cachedBoreholes.map((bh: any) => {
        if (bh.id === borehole.id) {
          return {
            ...bh,
            rigSetupDone: true,
            rigType,
            diameter,
            drillingFluid: fluid,
            hammerType,
            drillerId,
            startDate,
            status: 'IN_PROGRESS',
          };
        }
        return bh;
      });

      await storage.saveBoreholes(projectId, updated);

      // Queue Sync Operation for live API
      await syncManager.queueOperation(
        'BORING',
        borehole.id,
        'UPDATE',
        {
          rigType,
          diameter: parseInt(diameter, 10),
          drillingFluid: fluid,
          hammerType,
          drillerId: drillerId.split(' ')[0],
          startedAt: new Date(startDate.split('-').reverse().join('-')),
          status: 'IN_PROGRESS',
        }
      );

      // Navigate to StartBoring
      const selectedBorehole = updated.find(bh => bh.id === borehole.id);
      navigation.replace('StartBoring', { borehole: selectedBorehole, projectId });
    } catch (err) {
      Alert.alert('Error', 'Failed to save rig setup');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{borehole.boreholeCode} · {t('rigSetup', lang)}</Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>{lang === 'hi' ? 'En' : 'हिं'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Before starting boring</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Info box IS 1892 */}
        <View style={styles.infoBoxGreen}>
          <Text style={styles.infoBoxGreenTitle}>IS 1892 — Borelog header required</Text>
          <Text style={styles.infoBoxGreenSub}>ये जानकारी बोरलॉग के लिए जरूरी है</Text>
        </View>

        {/* Rig Type Grid */}
        <Text style={styles.fieldLabel}>{t('rigType', lang)} — tap to select</Text>
        <View style={styles.grid2x2}>
          {['Rotary drilling', 'Wash boring', 'Auger', 'Percussion'].map((type) => {
            const isSelected = rigType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.tileHalf, isSelected && styles.tileHalfSelected]}
                onPress={() => setRigType(type)}
              >
                <Text style={[styles.tileHalfText, isSelected && styles.tileHalfTextSelected]}>
                  {type}
                </Text>
                <Text style={[styles.tileHalfSub, isSelected && styles.tileHalfTextSelected]}>
                  {type === 'Rotary drilling' && 'रोटरी ड्रिलिंग'}
                  {type === 'Wash boring' && 'वॉश बोरिंग'}
                  {type === 'Auger' && 'ऑगर'}
                  {type === 'Percussion' && 'पर्कशन'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Diameter Selector */}
        <Text style={styles.fieldLabel}>{t('bhDiameter', lang)}</Text>
        <View style={styles.horizontalRow}>
          {['100 mm', '150 mm', '200 mm'].map((dim) => {
            const isSelected = diameter === dim;
            return (
              <TouchableOpacity
                key={dim}
                style={[styles.tileThird, isSelected && styles.tileThirdSelected]}
                onPress={() => setDiameter(dim)}
              >
                <Text style={[styles.tileText, isSelected && styles.tileTextSelected]}>
                  {dim} {isSelected && '✓'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Drilling Fluid */}
        <Text style={styles.fieldLabel}>{t('drillingFluid', lang)}</Text>
        <View style={styles.horizontalRow}>
          {['Water', 'Bentonite mud'].map((fl) => {
            const isSelected = fluid === fl;
            return (
              <TouchableOpacity
                key={fl}
                style={[styles.tileHalfRow, isSelected && styles.tileHalfRowSelected]}
                onPress={() => setFluid(fl)}
              >
                <Text style={[styles.tileText, isSelected && styles.tileTextSelected]}>
                  {fl === 'Water' ? 'Water / पानी' : 'Bentonite mud'} {isSelected && '✓'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hammer Type */}
        <Text style={styles.fieldLabel}>{t('hammerType', lang)}</Text>
        <View style={styles.horizontalRow}>
          {['Auto-trip', 'Rope & pulley'].map((ham) => {
            const isSelected = hammerType === ham;
            return (
              <TouchableOpacity
                key={ham}
                style={[styles.tileHalfRow, isSelected && styles.tileHalfRowSelected]}
                onPress={() => setHammerType(ham)}
              >
                <Text style={[styles.tileText, isSelected && styles.tileTextSelected]}>
                  {ham} {isSelected && '✓'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Driller ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>{t('drillerId', lang)}</Text>
          <TextInput
            style={[styles.input, styles.monoText]}
            value={drillerId}
            onChangeText={setDrillerId}
            placeholderTextColor={colors.grayMid}
          />
        </View>

        {/* Start Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>{t('startBoringDate', lang)}</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={[styles.input, styles.dateInput]}
              value={startDate}
              onChangeText={setStartDate}
              placeholderTextColor={colors.grayMid}
            />
            <Text style={styles.dateHint}>Auto: today's date · editable</Text>
          </View>
          <Text style={styles.microHint}>
            Bihar report requires start + finish date per BH in boring schedule table
          </Text>
        </View>

        {/* Warning Info box */}
        <View style={styles.infoBoxAmber}>
          <Text style={styles.infoBoxAmberTitle}>Locked after first boring starts</Text>
          <Text style={styles.infoBoxAmberSub}>पहले SPT के बाद यह डेटा बदला नहीं जा सकता</Text>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>{t('confirmRigSetup', lang)} →</Text>
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
    backgroundColor: colors.greenDark,
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
    color: '#A5D6A7',
    marginTop: 2,
  },
  scrollContainer: {
    padding: 16,
  },
  infoBoxGreen: {
    backgroundColor: colors.greenLight,
    borderWidth: 0.5,
    borderColor: '#97C459',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  infoBoxGreenTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.greenMid,
  },
  infoBoxGreenSub: {
    fontSize: 9,
    color: colors.grayMid,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 9,
    color: colors.grayMid,
    marginBottom: 4,
    marginTop: 8,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  tileHalf: {
    width: '48%',
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tileHalfSelected: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenMid,
    borderWidth: 1.5,
  },
  tileHalfText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.grayDark,
  },
  tileHalfTextSelected: {
    color: colors.greenMid,
  },
  tileHalfSub: {
    fontSize: 8,
    color: colors.grayMid,
    marginTop: 2,
  },
  horizontalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  tileThird: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tileThirdSelected: {
    backgroundColor: colors.amberLight,
    borderColor: colors.amber,
    borderWidth: 1.5,
  },
  tileText: {
    fontSize: 10,
    color: colors.grayDark,
    fontWeight: '600',
  },
  tileTextSelected: {
    fontWeight: '700',
  },
  tileHalfRow: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tileHalfRowSelected: {
    backgroundColor: colors.blueLight,
    borderColor: colors.blueDark,
    borderWidth: 1.5,
  },
  inputGroup: {
    marginBottom: 8,
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
  monoText: {
    fontFamily: typography.fontFamilyMono,
    color: colors.amber,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dateInput: {
    width: '45%',
    fontWeight: '600',
    color: colors.amber,
  },
  dateHint: {
    fontSize: 9,
    color: colors.grayMid,
  },
  microHint: {
    fontSize: 8,
    color: colors.grayMid,
    marginTop: 2,
  },
  infoBoxAmber: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 8,
    marginVertical: 12,
  },
  infoBoxAmberTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.amber,
  },
  infoBoxAmberSub: {
    fontSize: 9,
    color: colors.grayMid,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: colors.greenMid,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  confirmBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
