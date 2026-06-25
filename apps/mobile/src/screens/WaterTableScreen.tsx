import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';

export default function WaterTableScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, currentDepth } = route.params;
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  // Inputs always start empty — the worker records what they observe.
  const [wtDepth, setWtDepth] = useState('');
  const [remarks, setRemarks] = useState('');
  // DRILLING_LEVEL = reading during boring; STABILIZED_LEVEL = the IS 6935
  // 24-hour stable reading entered manually on a later visit (push-notification
  // reminders require the notifications module — not yet integrated).
  const [readingType, setReadingType] = useState<'DRILLING_LEVEL' | 'STABILIZED_LEVEL'>('DRILLING_LEVEL');

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
        readingType,
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
        readingType === 'DRILLING_LEVEL'
          ? `Water table level logged at ${wtDepth}m.\n\nRecord the 24-hour stable reading tomorrow from this screen — reminder notifications coming soon. / 24 घंटे बाद स्थिर रीडिंग दर्ज करें।`
          : `24-hour stable reading logged at ${wtDepth}m (IS 6935).`,
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.logoRow}>
            <Text style={styles.logo}>💧</Text>
          </View>
          <Text style={styles.popupTitle}>{t('waterTable', lang)}</Text>
          <Text style={styles.popupSub}>
            {borehole.boreholeCode} · Current depth {currentDepth}m
          </Text>

          {/* Reading type — initial during-drilling vs manual 24hr stable (IS 6935) */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, readingType === 'DRILLING_LEVEL' && styles.toggleBtnActive]}
              onPress={() => setReadingType('DRILLING_LEVEL')}
            >
              <Text style={[styles.toggleBtnText, readingType === 'DRILLING_LEVEL' && styles.toggleBtnTextActive]}>
                During drilling / ड्रिलिंग के दौरान
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, readingType === 'STABILIZED_LEVEL' && styles.toggleBtnActive]}
              onPress={() => setReadingType('STABILIZED_LEVEL')}
            >
              <Text style={[styles.toggleBtnText, readingType === 'STABILIZED_LEVEL' && styles.toggleBtnTextActive]}>
                24hr stable / 24 घंटे स्थिर
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBoxBlue}>
            <Text style={styles.infoBoxBlueTitle}>
              {readingType === 'DRILLING_LEVEL'
                ? 'Initial reading (IS 1892)'
                : '24-hour stable reading (IS 6935)'}
            </Text>
            <Text style={styles.infoBoxBlueSub}>
              {readingType === 'DRILLING_LEVEL'
                ? 'कल 24 घंटे बाद स्थिर रीडिंग इसी स्क्रीन से दर्ज करें — रिमाइंडर नोटिफिकेशन जल्द आ रहा है।'
                : 'कल दर्ज की गई रीडिंग के 24 घंटे बाद का स्थिर स्तर दर्ज करें।'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>{t('gwtEncountered', lang)} (m)</Text>
            <TextInput
              style={[styles.input, styles.largeInput]}
              value={wtDepth}
              onChangeText={setWtDepth}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.grayMid}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Remarks / टिप्पणी</Text>
            <TextInput
              style={styles.input}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="e.g. Encountered during drilling"
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
        </ScrollView>
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
    maxHeight: '90%',
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  logo: {
    fontSize: 38,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.blueDark,
    textAlign: 'center',
  },
  popupSub: {
    fontSize: 12,
    color: colors.grayMid,
    textAlign: 'center',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.blueDark,
    borderColor: colors.blueDark,
  },
  toggleBtnText: {
    fontSize: 12,
    color: colors.grayDark,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: colors.white,
    fontWeight: '700',
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.blueDark,
  },
  infoBoxBlueSub: {
    fontSize: 11,
    color: colors.grayMid,
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
  largeInput: {
    fontSize: 24,
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
    fontSize: 14,
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
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
});
