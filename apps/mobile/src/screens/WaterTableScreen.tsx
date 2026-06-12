import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';

export default function WaterTableScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, currentDepth } = route.params;
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  const [wtDepth, setWtDepth] = useState('6.50');
  const [remarks, setRemarks] = useState('Encountered during drilling');

  const handleSubmit = async () => {
    if (!wtDepth || isNaN(parseFloat(wtDepth))) {
      Alert.alert('Invalid Input', 'Please enter a valid depth');
      return;
    }

    try {
      const observation = {
        id: `wt-${Date.now()}`,
        boreholeId: borehole.id,
        depth: parseFloat(wtDepth),
        observedAt: new Date().toISOString(),
        remarks,
        readingType: 'DRILLING_LEVEL',
      };

      const cached = await storage.getWaterTable(borehole.id);
      cached.push(observation);
      await storage.saveWaterTable(borehole.id, cached);

      // Queue sync queue operation
      await syncManager.queueOperation(
        'WATER_LEVEL',
        observation.id,
        'CREATE',
        observation
      );

      Alert.alert(
        'Water Table Logged / भूजल स्तर दर्ज',
        `Water table level logged at ${wtDepth}m.\n\n⏰ 24-hour stable reading reminder scheduled automatically!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to save water table observation');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.popupCard}>
        <View style={styles.logoRow}>
          <Text style={styles.logo}>💧</Text>
        </View>
        <Text style={styles.popupTitle}>{t('waterTable', lang)}</Text>
        <Text style={styles.popupSub}>
          {borehole.boreholeCode} · Current depth {currentDepth}m
        </Text>

        <View style={styles.infoBoxBlue}>
          <Text style={styles.infoBoxBlueTitle}>Initial reading trigger (IS 1892)</Text>
          <Text style={styles.infoBoxBlueSub}>
            24 घंटे का स्थिर रीडिंग नोटिफिकेशन शुरू किया जाएगा।
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>{t('gwtEncountered', lang)} (m)</Text>
          <TextInput
            style={[styles.input, styles.largeInput]}
            value={wtDepth}
            onChangeText={setWtDepth}
            keyboardType="numeric"
            placeholder="6.50"
            placeholderTextColor={colors.grayMid}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>Remarks / टिप्पणी</Text>
          <TextInput
            style={styles.input}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Encountered during drilling"
            placeholderTextColor={colors.grayMid}
          />
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>{t('cancel', lang)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
          >
            <Text style={styles.submitBtnText}>{t('next', lang)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  logo: {
    fontSize: 28,
  },
  popupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.blueDark,
    textAlign: 'center',
  },
  popupSub: {
    fontSize: 9,
    color: colors.grayMid,
    textAlign: 'center',
    marginBottom: 10,
  },
  infoBoxBlue: {
    backgroundColor: colors.blueLight,
    borderWidth: 0.5,
    borderColor: '#85B7EB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  infoBoxBlueTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.blueDark,
  },
  infoBoxBlueSub: {
    fontSize: 8,
    color: colors.grayMid,
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
  largeInput: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.blueDark,
    paddingVertical: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 10,
    color: colors.grayDark,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: colors.blueDark,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '700',
  },
});
