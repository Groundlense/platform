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

export default function SoilDescriptionScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, sessionId, currentDepth, intervalNo, sptData } = route.params;
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  // Selection states
  const [selectedSoil, setSelectedSoil] = useState('Sand');
  const [selectedColor, setSelectedColor] = useState('#D2691E'); // Brown
  const [selectedConsistency, setSelectedConsistency] = useState('Medium');
  const [fieldNoteText, setFieldNoteText] = useState('');

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
  const isRock = selectedSoil === 'Rock';

  const handleVoiceNote = () => {
    // No speech-to-text library is installed — honest disabled state, never fabricate a transcript.
    Alert.alert(
      'Voice transcription coming soon / वॉयस जल्द',
      'Speech-to-text is not available in this version. Please type your observation in the note box below. / अभी वॉयस सुविधा उपलब्ध नहीं है — नीचे नोट बॉक्स में लिखें।'
    );
  };

  const handleNext = () => {
    const soilData = {
      soilType: selectedSoil,
      isRock,
      uscsCode: currentSoilMap.mappedCode.split(' ')[0],
      color: colorsList.find(c => c.value === selectedColor)?.name || 'Brown',
      consistency: selectedConsistency,
      description: `${selectedConsistency} ${currentSoilMap.name.split(' ')[0]} of ${colorsList.find(c => c.value === selectedColor)?.name || 'Brown'} color.`,
      fieldNote: fieldNoteText.trim() || undefined,
    };

    if (isRock) {
      // Rock encountered — exit the SPT loop and switch to core mode (Screen 8).
      navigation.navigate('RockCoring', {
        borehole,
        projectId,
        sessionId,
        currentDepth,
        intervalNo,
        sptData,
        soilData,
      });
      return;
    }

    // Navigate to SampleCollection Screen
    navigation.navigate('SampleCollection', {
      borehole,
      projectId,
      sessionId,
      currentDepth,
      intervalNo,
      sptData,
      soilData,
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

        {/* Voice note — speech-to-text not installed, honest disabled state */}
        <TouchableOpacity style={styles.voiceBtnDisabled} onPress={handleVoiceNote}>
          <Text style={styles.voiceBtnDisabledText}>
            🎙 Voice transcription coming soon / वॉयस जल्द
          </Text>
        </TouchableOpacity>

        {/* Typed field note — replaces voice note until speech is available */}
        <Text style={styles.fieldLabel}>Field note (optional) / टिप्पणी (वैकल्पिक)</Text>
        <TextInput
          style={styles.noteInput}
          multiline
          numberOfLines={3}
          value={fieldNoteText}
          onChangeText={setFieldNoteText}
          placeholder="Type any unusual observation here / यहाँ लिखें"
          placeholderTextColor={colors.grayMid}
        />

        {/* Rock branch notice */}
        {isRock ? (
          <View style={styles.rockNotice}>
            <Text style={styles.rockNoticeTitle}>Rock encountered — switching to core mode</Text>
            <Text style={styles.rockNoticeSub}>चट्टान मिली — रॉक कोरिंग शुरू करें</Text>
          </View>
        ) : null}

        {/* Next button */}
        <TouchableOpacity
          style={[styles.nextBtn, isRock && styles.nextBtnRock]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {isRock ? 'Next → Rock coring / रॉक कोरिंग' : 'Next → Sample collection'}
          </Text>
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
  voiceBtnDisabled: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    opacity: 0.7,
  },
  voiceBtnDisabledText: {
    fontSize: 10,
    color: colors.grayMid,
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    color: colors.grayDark,
    minHeight: 56,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  rockNotice: {
    backgroundColor: colors.grayDark,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  rockNoticeTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FAC775',
  },
  rockNoticeSub: {
    fontSize: 9,
    color: '#B4B2A9',
    marginTop: 1,
  },
  nextBtnRock: {
    backgroundColor: colors.grayDark,
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
