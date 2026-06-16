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

export default function EngineerQueryScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole } = route.params || { borehole: { id: 'bh-03', boreholeCode: 'GL-BH-0047-03' } };
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  const [replyText, setReplyText] = useState(
    'Casing shifted at 8m due to gravel layer. SPT was repeated. Second attempt gave N=28.'
  );
  const [recording, setRecording] = useState(false);

  const handleVoiceReply = () => {
    if (recording) {
      setRecording(false);
      setReplyText(
        'केसिंग ८ मीटर पर बजरी की परत के कारण शिफ्ट हो गई थी। इसलिए एसपीटी को दोबारा दोहराया गया था।'
      );
      Alert.alert(
        'Speech Transcribed / ट्रांसक्रिप्ट तैयार',
        'Hindi audio transcribed successfully.'
      );
    } else {
      setRecording(true);
      Alert.alert('Recording / रिकॉर्डिंग शुरू', 'Speak now in Hindi. Tap button again to complete.');
    }
  };

  const handleSendReply = async () => {
    if (!replyText) {
      Alert.alert('Empty Reply', 'Please write or record a reply first.');
      return;
    }

    try {
      // Queue Sync Operation for live API
      await syncManager.queueOperation(
        'BORING',
        borehole.id,
        'UPDATE',
        {
          queryReply: replyText,
          replyTimestamp: new Date(),
        }
      );

      // Trigger sync
      await syncManager.syncWithServer();

      Alert.alert(
        'Reply Sent / जवाब भेजा गया',
        'Your explanation has been uploaded to the engineer portal review thread.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to send query reply');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{t('queries', lang)}</Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>{lang === 'hi' ? 'En' : 'हिं'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>From engineer</Text>
      </View>

      <View style={styles.content}>
        {/* Query details */}
        <View style={styles.queryCard}>
          <Text style={styles.queryHeader}>Er. Rajesh Kumar · Today · 02:15 PM</Text>
          <Text style={styles.queryText}>
            BH-03 at 8.5m — N value 42 seems very high. Was casing disturbed at this depth? Please explain what happened.
          </Text>
        </View>

        {/* Read-only reference */}
        <Text style={styles.sectionTitle}>Original entry for reference</Text>
        <View style={styles.refBlock}>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>0–15cm blows</Text>
            <Text style={styles.refVal}>14</Text>
          </View>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>15–30cm blows</Text>
            <Text style={styles.refVal}>16</Text>
          </View>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>30–45cm blows</Text>
            <Text style={styles.refVal}>12</Text>
          </View>
          <View style={[styles.refRow, styles.lastRow]}>
            <Text style={styles.refLabel}>Raw N / संशोधित</Text>
            <Text style={styles.refVal}>28</Text>
          </View>
        </View>

        {/* Input */}
        <Text style={styles.fieldLabel}>{t('sendReply', lang)}</Text>
        <TextInput
          style={styles.replyInput}
          multiline
          numberOfLines={3}
          value={replyText}
          onChangeText={setReplyText}
          placeholder="Type your explanation here..."
          placeholderTextColor={colors.grayMid}
        />

        {/* Voice reply */}
        <TouchableOpacity
          style={[styles.voiceBtn, recording && styles.voiceBtnActive]}
          onPress={handleVoiceReply}
        >
          <Text style={[styles.voiceBtnText, recording && styles.voiceBtnTextActive]}>
            🎙 {recording ? 'Recording... Tap to stop / रोकें' : t('voiceReplyBtn', lang)}
          </Text>
        </TouchableOpacity>

        {/* Actions */}
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendReply}>
          <Text style={styles.sendBtnText}>Send reply / जवाब भेजें</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  headerBar: {
    backgroundColor: colors.amber,
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
    color: colors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  queryCard: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  queryHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.amber,
  },
  queryText: {
    fontSize: 10,
    color: '#633806',
    marginTop: 4,
    lineHeight: 14,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.grayDark,
    marginBottom: 6,
  },
  refBlock: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.grayBorder,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  refLabel: {
    fontSize: 9,
    color: colors.grayMid,
  },
  refVal: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.grayDark,
  },
  fieldLabel: {
    fontSize: 9,
    color: colors.grayMid,
    marginBottom: 4,
  },
  replyInput: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    color: colors.grayDark,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  voiceBtn: {
    backgroundColor: colors.blueLight,
    borderWidth: 0.5,
    borderColor: colors.blueDark,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  sendBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
