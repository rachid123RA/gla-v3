import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DiagnosticScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Écran : Diagnostic 🩺✅</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 20, color: '#2c5f2d' },
});

export default DiagnosticScreen;
