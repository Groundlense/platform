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

export default function SoilDescriptionScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, sessionId, currentDepth, intervalNo, sptData } = route.params;
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  // Selection states
  const [selectedSoil, setSelectedSoil] = useState('Sand');
  const [selectedColor, setSelectedColor] = useState('#D2691E'); // Brown
  const [selectedConsistency, setSelectedConsistency] = useState('Medium');
  const [voiceNoteText, setVoiceNoteText] = useState('');
  const [recording, setRecording] = useState(false);

  // Soil types mapping matching the specification
  const soilTypes = [
    { code: 'Sand', name: 'Sand / बालू', hi: 'SP / SW', icon: '🟤', mappedCode: 'SP — Poorly graded sand' },
    { code: 'Clay', name: 'Clay / मिट्टी', hi: 'CI / CH', icon: '🟫', mappedCode: 'CH — Highly plastic clay' },
    { code: 'Silt', name: 'Silt / गाद', hi: 'ML / MH', icon: '⚫', mappedCode: 'ML — Low plasticity silt' },
    { code: 'Rock', name: 'Rock / चट्टान', hi: 'Rocky', icon: '🪨', mappedCode: 'ROCK — Core recovery mode' },
    { code: 'Red Clay', name: 'Red Clay', hi: 'Lateritic · CI', icon: '🔴', mappedCode: 'CI — Medium plastic clay' },
    { code: 'Boulder Clay', name: 'Boulder clay', hi: 'With boulders', icon: '🗿', mappedCode: 'GC — Clayey gravel with boulders' },
    { code: 'Silty Sand', name: 'Silty Sand', hi: 'SM · ML-CL', icon: '🔵', mappedCode: 'SM — Silty sand' },
    { code: 'Sandy Silt', name: 'Sandy Silt', hi: 'ML-CL · gravel', icon: '🟡', mappedCode: 'ML — Sandy silt' },
    { code: 'Filled Soil', name: 'Filled soil ★', hi: 'भरी हुई / disturbed', icon: '⚠️', mappedCode: 'FILL — Disturbed filled soil' },
  ];

  const colorsList = [
    { value: '#D2691E', name: 'Brown' },
    { value: '#8B7355', name: 'Dark Brown' },
    { value: '#808080', name: 'Grey' },
    { value: '#FFFDD0', name: 'Cream/Light' },
    { value: '#000080', name: 'Blue-grey' },
  ];

  const consistencies = [
    { name: 'Loose / ढीला', val: 'Loose' },
    { name: 'Medium / मध्यम', val: 'Medium' },
    { name: 'Dense / घना', val: 'Dense' },
    { name: 'Stiff / कड़ा', val: 'Stiff' },
  ];

  const currentSoilMap = soilTypes.find(s => s.code === selectedSoil) || soilTypes[0];

  const handleVoiceNote = () => {
    if (recording) {
      setRecording(false);
      // Simulate Hindi voice translation transcription
      setVoiceNoteText('बालू में थोड़े कंकड़ पत्थर मिले हैं, खुदाई मध्यम गति से चल रही है।');
      Alert.alert(
        'Speech Transcribed / ट्रांसक्रिप्ट तैयार',
        'Hindi audio transcribed to: "बालू में थोड़े कंकड़ पत्थर मिले हैं, खुदाई मध्यम गति से चल रही है।"'
      );
    } else {
      setRecording(true);
      Alert.alert('Recording / रिकॉर्डिंग शुरू', 'Speak now in Hindi. Tap button again to complete.');
    }
  };

  const handleNext = () => {
    // Navigate to SampleCollection Screen
    navigation.navigate('SampleCollection', {
      borehole,
      projectId,
      sessionId,
      currentDepth,
      intervalNo,
      sptData,
      soilData: {
        soilType: selectedSoil,
        uscsCode: currentSoilMap.mappedCode.split(' ')[0],
        color: colorsList.find(c => c.value === selectedColor)?.name || 'Brown',
        consistency: selectedConsistency,
        description: `${selectedConsistency} ${currentSoilMap.name.split(' ')[0]} of ${colorsList.find(c => c.value === selectedColor)?.name || 'Brown'} color.`,
        voiceNote: voiceNoteText || undefined,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {borehole.boreholeCode} · {t('soilDescription', lang)}
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
          <Text style={styles.loopText}>Interval {intervalNo} · Step 2 of 3</Text>
        </View>

        {/* Soil Type Select Grid */}
        <Text style={styles.fieldLabel}>{t('soilType', lang)} — tap to select</Text>
        <View style={styles.soilGrid}>
          {soilTypes.map((s) => {
            const isSelected = selectedSoil === s.code;
            return (
              <TouchableOpacity
                key={s.code}
                style={[styles.soilTile, isSelected && styles.soilTileSelected]}
                onPress={() => setSelectedSoil(s.code)}
              >
                <Text style={styles.soilIcon}>{s.icon}</Text>
                <Text style={[styles.soilName, isSelected && styles.soilTextSelected]}>
                  {s.name}
                </Text>
                <Text style={[styles.soilHi, isSelected && styles.soilTextSelected]}>
                  {s.hi}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* IS 1498 mapping alert */}
        <View style={styles.isMapBox}>
          <Text style={styles.isMapLabel}>IS 1498 code (auto-mapped)</Text>
          <Text style={styles.isMapVal}>{currentSoilMap.mappedCode}</Text>
        </View>

        {/* Color Swatches */}
        <Text style={styles.fieldLabel}>{t('color', lang)}</Text>
        <View style={styles.colorRow}>
          {colorsList.map((c) => {
            const isSelected = selectedColor === c.value;
            return (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c.value },
                  isSelected && styles.colorSwatchActive,
                ]}
                onPress={() => setSelectedColor(c.value)}
              />
            );
          })}
        </View>

        {/* Consistency Grid */}
        <Text style={styles.fieldLabel}>{t('consistency', lang)}</Text>
        <View style={styles.consistencyGrid}>
          {consistencies.map((c) => {
            const isSelected = selectedConsistency === c.val;
            return (
              <TouchableOpacity
                key={c.val}
                style={[
                  styles.consistencyTile,
                  isSelected && styles.consistencyTileActive,
                ]}
                onPress={() => setSelectedConsistency(c.val)}
              >
                <Text style={[
                  styles.consistencyText,
                  isSelected && styles.consistencyTextActive
                ]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hindi voice note recorder */}
        <TouchableOpacity
          style={[styles.voiceBtn, recording && styles.voiceBtnActive]}
          onPress={handleVoiceNote}
        >
          <Text style={[styles.voiceBtnText, recording && styles.voiceBtnTextActive]}>
            🎙 {recording ? 'Recording... Tap to stop / रोकें' : t('voiceNoteBtn', lang)}
          </Text>
        </TouchableOpacity>

        {voiceNoteText ? (
          <View style={styles.voiceNoteDisplay}>
            <Text style={styles.voiceNoteLabel}>Transcript / अनुवाद:</Text>
            <Text style={styles.voiceNoteVal}>{voiceNoteText}</Text>
          </View>
        ) : null}

        {/* Next button */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Next → Sample collection</Text>
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
    marginTop: 8,
  },
  soilGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 8,
  },
  soilTile: {
    width: '32%',
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  soilTileSelected: {
    backgroundColor: colors.rustLight,
    borderColor: colors.rustMid,
    borderWidth: 1.5,
  },
  soilIcon: {
    fontSize: 16,
  },
  soilName: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.grayDark,
    textAlign: 'center',
    marginTop: 2,
  },
  soilHi: {
    fontSize: 8,
    color: colors.grayMid,
    textAlign: 'center',
  },
  soilTextSelected: {
    color: colors.rust,
  },
  isMapBox: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  isMapLabel: {
    fontSize: 9,
    color: colors.amber,
    fontWeight: '700',
  },
  isMapVal: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 10,
    fontWeight: '700',
    color: colors.rust,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  colorSwatch: {
    width: 44,
    height: 20,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: colors.grayDark,
  },
  consistencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  consistencyTile: {
    width: '48%',
    backgroundColor: colors.grayLight,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  consistencyTileActive: {
    backgroundColor: colors.amberLight,
    borderColor: colors.amber,
    borderWidth: 1.5,
  },
  consistencyText: {
    fontSize: 10,
    color: colors.grayDark,
    fontWeight: '600',
  },
  consistencyTextActive: {
    color: colors.amber,
    fontWeight: '700',
  },
  voiceBtn: {
    backgroundColor: colors.blueLight,
    borderWidth: 0.5,
    borderColor: colors.blueDark,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  voiceBtnActive: {
    backgroundColor: colors.redLight,
    borderColor: colors.redMid,
  },
  voiceBtnText: {
    fontSize: 10,
    color: colors.blueDark,
    fontWeight: '700',
  },
  voiceBtnTextActive: {
    color: colors.redMid,
  },
  voiceNoteDisplay: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  voiceNoteLabel: {
    fontSize: 8,
    color: colors.grayMid,
    fontWeight: '700',
  },
  voiceNoteVal: {
    fontSize: 10,
    color: colors.grayDark,
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
