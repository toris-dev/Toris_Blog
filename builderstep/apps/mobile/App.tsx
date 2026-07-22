import React from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

export default function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.brand}>빌더스텝</Text>
          <Text style={styles.slogan}>혼자 만드는 제품, 다음 단계는 함께</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>사업화 단계 진단</Text>
          <Text style={styles.cardStatus}>준비 중</Text>
          <Text style={styles.cardDescription}>
            아이디어부터 사업 성장까지, 현재 단계를 진단하는 기능을 준비하고 있습니다.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>대시보드</Text>
          <Text style={styles.cardStatus}>준비 중</Text>
          <Text style={styles.cardDescription}>
            프로젝트 현황과 다음 실행 과제를 한눈에 볼 수 있는 대시보드를 준비하고 있습니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  slogan: {
    marginTop: 8,
    fontSize: 16,
    color: "#94A3B8",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  cardStatus: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#F59E0B",
  },
  cardDescription: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "#CBD5E1",
  },
});
