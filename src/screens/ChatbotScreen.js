import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getChatbotFaq } from '../services/databaseService';

const ChatbotScreen = () => {
  const [faqs, setFaqs] = useState([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'bot-hello',
      from: 'bot',
      text: "Salut ! Pose-moi une question (activation, prédiction, stock…).",
      createdAt: Date.now(),
    },
  ]);

  useEffect(() => {
    (async () => {
      const res = await getChatbotFaq();
      if (res.success) setFaqs(res.data);
    })();
  }, []);

  const normalizedFaqs = useMemo(() => {
    return faqs.map((f) => ({
      ...f,
      _q: String(f.question || '').toLowerCase(),
      _tags: String(f.tags || '').toLowerCase(),
      _a: String(f.answer || ''),
    }));
  }, [faqs]);

  const findBestAnswer = (question) => {
    const q = String(question || '').trim().toLowerCase();
    if (!q) return null;
    const tokens = q.split(/[^a-z0-9àâäéèêëîïôöùûüç]+/i).filter(Boolean);

    let best = null;
    let bestScore = -1;
    for (const f of normalizedFaqs) {
      let score = 0;
      for (const t of tokens) {
        if (f._q.includes(t)) score += 3;
        if (f._tags.includes(t)) score += 2;
        if (f._a.toLowerCase().includes(t)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        best = f;
      }
    }
    if (!best || bestScore <= 0) return null;
    return best;
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg = { id: `u-${Date.now()}`, from: 'user', text, createdAt: Date.now() };
    setMessages((m) => [userMsg, ...m]);
    setInput('');

    const best = findBestAnswer(text);
    const botText = best
      ? best.answer
      : "Je n’ai pas trouvé une réponse exacte. Essaie avec des mots-clés comme « activation », « admin », « prédiction », « stock ».";
    const botMsg = { id: `b-${Date.now()}`, from: 'bot', text: botText, createdAt: Date.now() + 1 };
    setMessages((m) => [botMsg, ...m]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chatbot</Text>
        <Text style={styles.subtitle}>Questions / Réponses (offline)</Text>
      </View>

      <FlatList
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
            <Text style={[styles.bubbleText, item.from === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot]}>
              {item.text}
            </Text>
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Écris ta question..."
            placeholderTextColor="#888"
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d4f0d2' },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: '900', color: '#1f3f1f' },
  subtitle: { marginTop: 4, fontSize: 12, color: '#666' },
  list: { paddingHorizontal: 16, paddingBottom: 10 },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    marginVertical: 6,
  },
  bubbleUser: { backgroundColor: '#2c5f2d', alignSelf: 'flex-end' },
  bubbleBot: { backgroundColor: '#fff', alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#fff', fontWeight: '600' },
  bubbleTextBot: { color: '#222' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    backgroundColor: '#d4f0d2',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    color: '#222',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2c5f2d',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatbotScreen;
