import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { api } from '../services/api';

function personName(person: any): string {
  if (!person) return 'Engineer';
  const name = `${person.firstName || ''} ${person.lastName || ''}`.trim();
  return name || 'Engineer';
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function EngineerQueryScreen({ route, navigation }: { route: any; navigation: any }) {
  // Legacy fallback: a query passed via navigation params (e.g. from a
  // notification deep link) is rendered directly without the inbox.
  const { query, referencedInterval } = route.params ?? {};
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  const [me, setMe] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    storage.getUser().then(setMe).catch(() => {});
    loadThreads();
  }, []);

  const loadThreads = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const data = await api.getMyThreads();
      // Log the real shape defensively — the borehole relation may or may
      // not be included depending on the API version.
      if (Array.isArray(data) && data.length > 0) {
        console.log(
          'threads/assigned-to-me thread keys:',
          Object.keys(data[0]).join(','),
          '| first message keys:',
          data[0]?.messages?.[0] ? Object.keys(data[0].messages[0]).join(',') : '(none)'
        );
      }
      setThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load engineer queries:', err);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceReply = () => {
    // No speech-to-text module is integrated — never insert fabricated transcripts.
    Alert.alert(
      'Voice Coming Soon / वॉयस जल्द',
      'Voice transcription requires the device app build with microphone permissions. Please type your reply for now. / अभी अपना जवाब टाइप करें।'
    );
  };

  const sendReply = async (threadId: string) => {
    const text = replyText.trim();
    if (!text) {
      Alert.alert(t('error', lang), 'Type a reply first / पहले जवाब टाइप करें');
      return;
    }
    setSending(true);
    try {
      const message = await api.replyToThread(threadId, text);
      setReplyText('');
      // Append the new message locally so the thread updates immediately.
      setSelectedThread((prev: any) =>
        prev && prev.id === threadId
          ? { ...prev, messages: [...(prev.messages || []), message] }
          : prev
      );
      setThreads((prev) =>
        prev.map((th) =>
          th.id === threadId
            ? { ...th, messages: [...(th.messages || []), message] }
            : th
        )
      );
      Alert.alert('Sent ✓ / भेजा गया', 'Your reply was sent to the engineer. / आपका जवाब इंजीनियर को भेज दिया गया।');
    } catch (err) {
      console.warn('Reply failed:', err);
      Alert.alert(
        t('error', lang),
        'Reply could not be sent. Check your internet connection and try again. / जवाब नहीं भेजा जा सका — इंटरनेट जांचें।'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendParamReply = async () => {
    if (query?.threadId) {
      await sendReply(query.threadId);
    } else {
      // This query object carries no thread reference — never pretend a
      // reply was delivered.
      Alert.alert(
        'Cannot reply here / यहाँ जवाब नहीं',
        'Open this query from the Engineer queries inbox to reply. / जवाब देने के लिए इंजीनियर के सवाल सूची से खोलें।'
      );
    }
  };

  const renderReplyBox = (threadId: string | null) => (
    <>
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

      {/* Voice reply — speech module not yet integrated */}
      <TouchableOpacity style={styles.voiceBtn} onPress={handleVoiceReply}>
        <Text style={styles.voiceBtnText}>
          🎙 {t('voiceReplyBtn', lang)} — coming soon / जल्द
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sendBtn}
        onPress={() => (threadId ? sendReply(threadId) : handleSendParamReply())}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.sendBtnText}>{t('sendReply', lang)} →</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderThreadDetail = (thread: any) => {
    const messages = Array.isArray(thread.messages) ? thread.messages : [];
    const isClosed = thread.status === 'CLOSED';
    return (
      <>
        <TouchableOpacity style={styles.backLink} onPress={() => setSelectedThread(null)}>
          <Text style={styles.backLinkText}>← All queries / सभी सवाल</Text>
        </TouchableOpacity>

        {/* Thread header */}
        <View style={styles.threadHeaderCard}>
          <View style={styles.threadHeaderRow}>
            <Text style={styles.threadEngineer}>{personName(thread.raisedBy)}</Text>
            <View style={[styles.statusChip, isClosed ? styles.chipClosed : styles.chipOpen]}>
              <Text style={isClosed ? styles.chipClosedText : styles.chipOpenText}>
                {isClosed ? 'Closed / बंद' : 'Open / खुला'}
              </Text>
            </View>
          </View>
          {thread.borehole ? (
            <Text style={styles.threadBorehole}>
              {[thread.borehole.boreholeCode, thread.borehole.name]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          ) : null}
          <Text style={styles.threadDate}>{formatDate(thread.createdAt)}</Text>
        </View>

        {/* Messages */}
        {messages.map((msg: any) => {
          const mine = me?.id && (msg.sender?.id === me.id || msg.senderId === me.id);
          return (
            <View key={msg.id} style={mine ? styles.msgCardMine : styles.queryCard}>
              <Text style={mine ? styles.msgHeaderMine : styles.queryHeader}>
                {mine ? 'You / आप' : personName(msg.sender)} · {formatDate(msg.createdAt)}
              </Text>
              <Text style={mine ? styles.msgTextMine : styles.queryText}>{msg.message}</Text>
            </View>
          );
        })}

        {isClosed ? (
          <View style={styles.closedNotice}>
            <Text style={styles.closedNoticeText}>
              This query has been closed by the engineer. / यह सवाल बंद कर दिया गया है।
            </Text>
          </View>
        ) : (
          renderReplyBox(thread.id)
        )}
      </>
    );
  };

  const renderThreadList = () => {
    if (loading) {
      return (
        <View style={styles.emptyCard}>
          <ActivityIndicator size="small" color={colors.amber} />
          <Text style={styles.emptySub}>Loading queries… / सवाल लोड हो रहे हैं…</Text>
        </View>
      );
    }
    if (loadFailed) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            Connect to the internet to load queries / सवाल देखने के लिए इंटरनेट से जुड़ें
          </Text>
          <Text style={styles.emptySub}>
            Engineer queries are not stored offline yet. / इंजीनियर के सवाल अभी ऑफलाइन सेव नहीं होते।
          </Text>
          <TouchableOpacity style={styles.sendBtn} onPress={loadThreads}>
            <Text style={styles.sendBtnText}>🔄 Retry / फिर कोशिश करें</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (threads.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No queries from engineers yet / कोई सवाल नहीं</Text>
          <Text style={styles.emptySub}>
            When an engineer raises a question about your boring data, it will appear here.
          </Text>
          <TouchableOpacity style={styles.sendBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.sendBtnText}>← Back / वापस</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <>
        {threads.map((thread) => {
          const firstMsg = thread.messages?.[0];
          const isClosed = thread.status === 'CLOSED';
          return (
            <TouchableOpacity
              key={thread.id}
              style={styles.threadCard}
              onPress={() => setSelectedThread(thread)}
            >
              <View style={styles.threadHeaderRow}>
                <Text style={styles.threadEngineer}>{personName(thread.raisedBy)}</Text>
                <View style={[styles.statusChip, isClosed ? styles.chipClosed : styles.chipOpen]}>
                  <Text style={isClosed ? styles.chipClosedText : styles.chipOpenText}>
                    {isClosed ? 'Closed / बंद' : 'Open / खुला'}
                  </Text>
                </View>
              </View>
              {thread.borehole ? (
                <Text style={styles.threadBorehole}>
                  {[thread.borehole.boreholeCode, thread.borehole.name]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              ) : null}
              {firstMsg?.message ? (
                <Text style={styles.threadPreview} numberOfLines={2}>
                  {firstMsg.message}
                </Text>
              ) : null}
              <Text style={styles.threadDate}>{formatDate(thread.createdAt)}</Text>
            </TouchableOpacity>
          );
        })}
      </>
    );
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

      <ScrollView contentContainerStyle={styles.content}>
        {query ? (
          <>
            {/* Legacy fallback — a real query passed via navigation params */}
            <View style={styles.queryCard}>
              <Text style={styles.queryHeader}>{query.from ?? 'Engineer'} · {query.sentAt ?? ''}</Text>
              <Text style={styles.queryText}>{query.text}</Text>
            </View>

            {/* Read-only reference from the actual interval, when provided */}
            {referencedInterval && (
              <>
                <Text style={styles.sectionTitle}>Original entry for reference</Text>
                <View style={styles.refBlock}>
                  <View style={styles.refRow}>
                    <Text style={styles.refLabel}>0–15cm blows</Text>
                    <Text style={styles.refVal}>{referencedInterval.blow1 ?? '—'}</Text>
                  </View>
                  <View style={styles.refRow}>
                    <Text style={styles.refLabel}>15–30cm blows</Text>
                    <Text style={styles.refVal}>{referencedInterval.blow2 ?? '—'}</Text>
                  </View>
                  <View style={styles.refRow}>
                    <Text style={styles.refLabel}>30–45cm blows</Text>
                    <Text style={styles.refVal}>{referencedInterval.blow3 ?? '—'}</Text>
                  </View>
                  <View style={[styles.refRow, styles.lastRow]}>
                    <Text style={styles.refLabel}>Raw N / संशोधित</Text>
                    <Text style={styles.refVal}>{referencedInterval.nValue ?? '—'}</Text>
                  </View>
                </View>
              </>
            )}

            {renderReplyBox(query.threadId ?? null)}
          </>
        ) : selectedThread ? (
          renderThreadDetail(selectedThread)
        ) : (
          renderThreadList()
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
  backLink: {
    marginBottom: 10,
  },
  backLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.rust,
  },
  threadCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  threadHeaderCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadEngineer: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.grayDark,
  },
  threadBorehole: {
    fontSize: 8,
    fontFamily: typography.fontFamilyMono,
    color: colors.amber,
    marginTop: 2,
  },
  threadPreview: {
    fontSize: 10,
    color: colors.grayMid,
    marginTop: 4,
    lineHeight: 14,
  },
  threadDate: {
    fontSize: 8,
    color: colors.grayMid,
    marginTop: 4,
  },
  statusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  chipOpen: {
    backgroundColor: colors.greenLight,
  },
  chipOpenText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.greenDark,
  },
  chipClosed: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
  },
  chipClosedText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.grayMid,
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
  msgCardMine: {
    backgroundColor: colors.greenLight,
    borderWidth: 0.5,
    borderColor: colors.greenMid,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    marginLeft: 24,
  },
  msgHeaderMine: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.greenDark,
  },
  msgTextMine: {
    fontSize: 10,
    color: colors.greenDark,
    marginTop: 4,
    lineHeight: 14,
  },
  closedNotice: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    padding: 10,
  },
  closedNoticeText: {
    fontSize: 9,
    color: colors.grayMid,
    textAlign: 'center',
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
  voiceBtnText: {
    fontSize: 10,
    color: colors.blueDark,
    fontWeight: '700',
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
  emptyCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.grayDark,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 9,
    color: colors.grayMid,
    textAlign: 'center',
    marginBottom: 6,
  },
});
