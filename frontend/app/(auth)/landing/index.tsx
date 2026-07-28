import React from 'react'
import { ScrollView, StyleSheet, View, Platform } from 'react-native'
import { Text, Button, Divider } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { router } from 'expo-router'

const SERVICES = [
  { icon: 'videocam', title: 'Video Consultation', desc: 'Connect with specialists remotely' },
  { icon: 'flask', title: 'Lab Results', desc: 'Access test results digitally' },
  { icon: 'medical', title: 'Prescriptions', desc: 'Digital medication management' },
  { icon: 'bicycle', title: 'Medicine Delivery', desc: 'Tracked motorcycle fleet delivery' },
]

const STATS = [
  { value: '4+', label: 'Districts Served' },
  { value: '50+', label: 'Clinics Connected' },
  { value: '20+', label: 'Specialists' },
  { value: '1000+', label: 'Patients Helped' },
]

export default function LandingScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="medical" size={40} color={Colors.white} />
        </View>
        <Text variant="headlineLarge" style={styles.heroTitle}>
          Northern Health{'\n'}Link
        </Text>
        <Text variant="bodyLarge" style={styles.heroSub}>
          Connecting rural clinics in Northern Ghana with specialist healthcare through digital technology.
        </Text>
        <Button
          mode="contained"
          buttonColor={Colors.secondary}
          onPress={() => router.push('/(auth)/login')}
          style={styles.heroBtn}
          contentStyle={styles.heroBtnContent}
          labelStyle={styles.heroBtnLabel}
        >
          Get Started
        </Button>
      </View>

      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text variant="headlineMedium" style={styles.statValue}>{s.value}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Our Services</Text>
        <Text variant="bodyMedium" style={styles.sectionSub}>
          Comprehensive healthcare support for rural communities
        </Text>
      </View>

      <View style={styles.servicesGrid}>
        {SERVICES.map((s) => (
          <View key={s.title} style={styles.serviceCard}>
            <View style={styles.serviceIcon}>
              <Ionicons name={s.icon as any} size={24} color={Colors.primary} />
            </View>
            <Text variant="titleSmall" style={styles.serviceTitle}>{s.title}</Text>
            <Text variant="bodySmall" style={styles.serviceDesc}>{s.desc}</Text>
          </View>
        ))}
      </View>

      <View style={styles.howSection}>
        <Text variant="titleLarge" style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.steps}>
          {[
            { num: '1', title: 'Register', desc: 'Clinic staff registers patients' },
            { num: '2', title: 'Consult', desc: 'Book video consultation with specialist' },
            { num: '3', title: 'Receive', desc: 'Get lab results and prescriptions' },
            { num: '4', title: 'Deliver', desc: 'Medication delivered to your door' },
          ].map((step) => (
            <View key={step.num} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.num}</Text>
              </View>
              <Text variant="titleSmall" style={styles.stepTitle}>{step.title}</Text>
              <Text variant="bodySmall" style={styles.stepDesc}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.ctaSection}>
        <Ionicons name="heart" size={32} color={Colors.secondary} />
        <Text variant="titleMedium" style={styles.ctaTitle}>Ready to get started?</Text>
        <Text variant="bodySmall" style={styles.ctaSub}>
          Join Northern Health Link and help improve healthcare access for rural communities.
        </Text>
        <Button
          mode="contained"
          buttonColor={Colors.primary}
          onPress={() => router.push('/(auth)/login')}
          style={styles.ctaBtn}
          contentStyle={styles.ctaBtnContent}
        >
          Sign In Now
        </Button>
      </View>

      <View style={styles.footer}>
        <Divider style={styles.footerDivider} />
        <Text variant="bodySmall" style={styles.footerText}>
          Northern Health Link &copy; 2026. Improving healthcare access for rural Ghana.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },

  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 40,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: { color: Colors.white, fontWeight: '800', textAlign: 'center', lineHeight: 36 },
  heroSub: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  heroBtn: { marginTop: Spacing.lg, borderRadius: 14 },
  heroBtnContent: { height: 52, paddingHorizontal: Spacing.xl },
  heroBtnLabel: { fontWeight: '700', fontSize: 16 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginTop: -Spacing.lg,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
      default: { elevation: 3 },
    }),
  },
  statItem: { alignItems: 'center' },
  statValue: { fontWeight: '800', color: Colors.primary },
  statLabel: { color: Colors.textSecondary, marginTop: 2, fontSize: 11 },

  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionTitle: { fontWeight: '800', color: Colors.text },
  sectionSub: { color: Colors.textSecondary, marginTop: Spacing.xs },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  serviceTitle: { fontWeight: '700', color: Colors.text },
  serviceDesc: { color: Colors.textSecondary, marginTop: 4, fontSize: 12, lineHeight: 16 },

  howSection: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  steps: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  step: { flex: 1, alignItems: 'center' },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepNumText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  stepTitle: { fontWeight: '700', color: Colors.text, fontSize: 13 },
  stepDesc: { color: Colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 2 },

  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.primary + '08',
    borderRadius: 20,
  },
  ctaTitle: { fontWeight: '700', color: Colors.text, marginTop: Spacing.sm },
  ctaSub: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  ctaBtn: { marginTop: Spacing.md, borderRadius: 12 },
  ctaBtnContent: { height: 48 },

  footer: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg, paddingBottom: Spacing.xl },
  footerDivider: { marginBottom: Spacing.md },
  footerText: { color: Colors.textLight, textAlign: 'center', fontSize: 12 },
})
