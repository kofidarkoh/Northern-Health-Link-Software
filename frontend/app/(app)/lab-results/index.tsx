import React, { useState } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native'
import { Text, TextInput } from 'react-native-paper'
import { Screen, PageHeader } from '../../../src/components'
import { clinicalApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing } from '../../../src/constants'
import { SkeletonList } from '../../../src/components/ui/Skeleton'
import type { LabResult } from '../../../src/types'

export default function LabResultsScreen() {
  const { hasRole } = useAuth()
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['lab-results', search],
    queryFn: () => clinicalApi.listLabResults({ patient_id: search || undefined }),
  })

  const results = data?.lab_results || []

  if (isLoading) {
    return (
      <Screen>
        <PageHeader title="Lab Results" showBack={false} />
        <View style={{ padding: Spacing.md }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader title="Lab Results" subtitle="Diagnostic Reports" showBack={false} />

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#17A2B8' + '15' }]}>
              <Ionicons name="document-text" size={20} color="#17A2B8" />
            </View>
            <Text style={styles.statValue}>{results.length}</Text>
            <Text style={styles.statLabel}>Total Results</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#4CAF50' + '15' }]}>
              <Ionicons name="attach" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{results.filter(r => r.file_url).length}</Text>
            <Text style={styles.statLabel}>With Files</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.textLight} />
          <TextInput
            placeholder="Filter by Patient ID..."
            value={search}
            onChangeText={setSearch}
            mode="flat"
            keyboardType="number-pad"
            style={styles.searchInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            contentStyle={{ minHeight: 0, paddingVertical: 0 }}
            theme={{ roundness: 8 }}
          />
        </View>

        {results.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No lab results found</Text>
          </View>
        ) : (
          results.map(result => (
            <View key={result.id} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: '#17A2B8' }]}>
                <Ionicons name="flask" size={20} color={Colors.white} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>Result #{result.id}</Text>
                  {result.file_url ? (
                    <View style={styles.attachmentBadge}>
                      <Ionicons name="attach" size={12} color="#4CAF50" />
                      <Text style={styles.attachmentText}>File</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardSubtitle}>Request #{result.lab_request_id}</Text>
                <Text style={styles.summary} numberOfLines={2}>{result.result_summary}</Text>
                <Text style={styles.time}>
                  {new Date(result.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, backgroundColor: 'transparent', fontSize: 14 },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  attachmentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4CAF50' + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  attachmentText: { fontSize: 11, fontWeight: '600', color: '#4CAF50' },
  summary: { fontSize: 13, color: Colors.textSecondary, marginTop: 8, lineHeight: 18 },
  time: { fontSize: 11, color: Colors.textLight, marginTop: 6 },
})
