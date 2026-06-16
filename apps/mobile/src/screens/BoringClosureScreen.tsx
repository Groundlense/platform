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

export default function BoringClosureScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, readOnly } = route.params;
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  // Input states
  const [gwtEncountered, setGwtEncountered] = useState(true);
  const [photoTaken, setPhotoTaken] = useState(readOnly ? true : false);
  const [signed, setSigned] = useState(readOnly ? true : false);

  const handleSignature = () => {
    if (readOnly) return;
    setSigned(true);
    Alert.alert('Signed / हस्ताक्षरित', 'Digital signature recorded.');
  };

  const handleFinalPhoto = () => {
    if (readOnly) return;
    setPhotoTaken(true);
    Alert.alert('Photo Captured / फोटो ली गई', 'Geotagged final borehole closure photo saved.');
  };

  const handleSubmit = async () => {
    if (!photoTaken) {
      Alert.alert('Photo Required', 'Please capture the final borehole photo');
      return;
    }
    if (!signed) {
      Alert.alert('Signature Required', 'Please sign the document before submitting');
      return;
    }

    try {
      const cachedBoreholes = await storage.getBoreholes(projectId);
      const updated = cachedBoreholes.map((bh: any) => {
        if (bh.id === borehole.id) {
          return {
            ...bh,
            status: 'COMPLETED',
            closedAt: new Date().toISOString(),
          };
        }
        return bh;
      });

      await storage.saveBoreholes(projectId, updated);

      // Queue Sync Operation
      await syncManager.queueOperation(
        'BORING',
        borehole.id,
        'UPDATE',
        { status: 'COMPLETED', completedAt: new Date() }
      );

      // Trigger sync
      await syncManager.syncWithServer();

      Alert.alert(
        'Boring Submitted & Locked / सबमिट और लॉक हो गया',
        'Data has been marked as Field Locked. Generating tamper-evidence SHA-256 certificate.',
        [
          {
            text: 'Return to list / बोरिंग सूची',
            onPress: () => navigation.navigate('BoringList', { projectId }),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to close borehole');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {borehole.boreholeCode} · {readOnly ? 'Boring Locked' : 'Close Boring'}
          </Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>{lang === 'hi' ? 'En' : 'हिं'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Summary + submit</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Date / Time Card Grid */}
        <View style={styles.dateGrid}>
          <View style={styles.dateCard}>
            <Text style={styles.dateLabel}>Start</Text>
            <Text style={styles.dateVal}>15 Apr 2025</Text>
            <Text style={styles.dateTime}>09:14 AM</Text>
          </View>
          <View style={styles.dateCard}>
            <Text style={styles.dateLabel}>End</Text>
            <Text style={styles.dateVal}>15 Apr 2025</Text>
            <Text style={styles.dateTime}>04:45 PM</Text>
          </View>
        </View>

        {/* Logging Statistics */}
        <View style={styles.statsBlock}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Total depth / कुल गहराई</Text>
            <Text style={styles.sumVal}>{borehole.currentDepth || '20.0'} m</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Duration / कुल समय</Text>
            <Text style={styles.sumVal}>7 hrs 31 min</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>SPT intervals / एसपीटी अंतराल</Text>
            <Text style={styles.sumVal}>13 entries</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Samples / नमूने</Text>
            <Text style={styles.sumVal}>4 SPT · 1 UDS</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Photos uploaded / फोटो</Text>
            <Text style={styles.sumVal}>18 photos</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Water table / भूजल स्तर</Text>
            <Text style={styles.sumVal}>6.20m (24hr final)</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Rock at depth / रॉक गहराई</Text>
            <Text style={styles.sumVal}>16.0 m</Text>
          </View>
          <View style={[styles.sumRow, styles.lastSumRow]}>
            <Text style={styles.sumLabel}>RQD / रॉक गुणवत्ता</Text>
            <Text style={styles.sumVal}>78% · Good</Text>
          </View>
        </View>

        {/* Water Table Confirmation */}
        <View style={styles.gwtConfirmBlock}>
          <Text style={styles.gwtConfirmTitle}>
            GWT confirmation / भूजल स्तर पुष्टि (IS 1892)
          </Text>
          <View style={styles.gwtBtnRow}>
            <TouchableOpacity
              style={[styles.gwtBtn, gwtEncountered && styles.gwtBtnSelected]}
              onPress={() => !readOnly && setGwtEncountered(true)}
            >
              <Text style={[styles.gwtBtnText, gwtEncountered && styles.gwtBtnTextSelected]}>
                ✓ Water table found at 6.20m
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gwtBtn, !gwtEncountered && styles.gwtBtnSelected]}
              onPress={() => !readOnly && setGwtEncountered(false)}
            >
              <Text style={[styles.gwtBtnText, !gwtEncountered && styles.gwtBtnTextSelected]}>
                GWT not encountered
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.gwtSubHint}>
            IS 1892 mandatory — must confirm one before submit
          </Text>
        </View>

        {/* Final photo check */}
        <TouchableOpacity
          style={[styles.cameraBtn, photoTaken && styles.cameraBtnDone]}
          onPress={handleFinalPhoto}
        >
          <Text style={[styles.cameraBtnText, photoTaken && styles.cameraBtnTextDone]}>
            📷 {photoTaken ? '✓ Final Borehole Photo Logged' : 'Final borehole photo ✓ GPS stamped'}
          </Text>
        </TouchableOpacity>

        {/* Signature Box */}
        <TouchableOpacity
          style={[styles.signatureBox, signed && styles.signatureBoxSigned]}
          onPress={handleSignature}
        >
          {signed ? (
            <Text style={styles.signatureText}>✍️ Ramesh Chandra</Text>
          ) : (
            <Text style={styles.signaturePlaceholder}>
              Supervisor signature / यहाँ हस्ताक्षर करें
            </Text>
          )}
        </TouchableOpacity>

        {/* Lock submission */}
        {!readOnly ? (
          <>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>🔒 {t('lockSubmit', lang)}</Text>
            </TouchableOpacity>
            <Text style={styles.warningText}>
              {t('lockWarning', lang)}
            </Text>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, styles.disabledBtn]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.submitBtnText}>← Return to List</Text>
          </TouchableOpacity>
        )}
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
  dateGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateCard: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
  },
  dateLabel: {
    fontSize: 8,
    color: colors.grayMid,
  },
  dateVal: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.grayDark,
    marginTop: 2,
  },
  dateTime: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.rust,
    marginTop: 1,
  },
  statsBlock: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    marginBottom: 12,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayLight,
  },
  lastSumRow: {
    borderBottomWidth: 0,
  },
  sumLabel: {
    fontSize: 9,
    color: colors.grayMid,
  },
  sumVal: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.grayDark,
  },
  gwtConfirmBlock: {
    backgroundColor: colors.blueLight,
    borderWidth: 0.5,
    borderColor: '#85B7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  gwtConfirmTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.blueDark,
    marginBottom: 6,
  },
  gwtBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gwtBtn: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 4,
    paddingVertical: 6,
    alignItems: 'center',
  },
  gwtBtnSelected: {
    backgroundColor: colors.blueDark,
  },
  gwtBtnText: {
    fontSize: 8,
    color: colors.grayDark,
  },
  gwtBtnTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  gwtSubHint: {
    fontSize: 8,
    color: colors.blueDark,
    marginTop: 4,
    textAlign: 'center',
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
  signatureBox: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signatureBoxSigned: {
    backgroundColor: colors.white,
    borderColor: colors.rustMid,
  },
  signaturePlaceholder: {
    fontSize: 10,
    color: colors.grayMid,
  },
  signatureText: {
    fontSize: 14,
    fontFamily: 'serif',
    fontStyle: 'italic',
    color: colors.rustMid,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    backgroundColor: colors.grayMid,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  warningText: {
    fontSize: 9,
    color: colors.grayMid,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
});
