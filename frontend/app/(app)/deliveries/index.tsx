import { useState, useMemo, useCallback } from 'react'
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native'
import { Text, Button, Chip, TextInput, FAB, Portal, Modal } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Screen, PageHeader } from '../../../src/components'
import { deliveriesApi, prescriptionsApi } from '../../../src/core/api'
import { useAuth } from '../../../src/features/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Colors, Spacing } from '../../../src/constants'
import { SkeletonList } from '../../../src/components/ui/Skeleton'
import { optimizeRoute, type OptimizedRoute } from '../../../src/utils/routeOptimization'
import { getApiErrorMessage } from '../../../src/utils/apiError'
import type { DeliveryStatus } from '../../../src/types'

const STATUS_CONFIG: Record<DeliveryStatus, { color: string; icon: string }> = {
  PENDING: { color: '#FFC107', icon: 'time' },
  PICKED_UP: { color: '#17A2B8', icon: 'hand-left' },
  IN_TRANSIT: { color: '#FF8C00', icon: 'bicycle' },
  DELIVERED: { color: '#4CAF50', icon: 'checkmark-circle' },
  FAILED: { color: '#DC3545', icon: 'close-circle' },
}

const STATUSES: DeliveryStatus[] = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED']

export default function DeliveriesScreen() {
  const { hasRole } = useAuth()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [activeDeliveryId, setActiveDeliveryId] = useState<number | null>(null)
  const [showRoute, setShowRoute] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [prescriptionId, setPrescriptionId] = useState('')
  const [riderId, setRiderId] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [formError, setFormError] = useState('')

  const numericPrescriptionId = Number(prescriptionId)
  const { data: prescriptionData, isLoading: isLoadingPrescription } = useQuery({
    queryKey: ['prescription-verify', numericPrescriptionId],
    queryFn: () => prescriptionsApi.get(numericPrescriptionId),
    enabled: modalVisible && Number.isFinite(numericPrescriptionId) && numericPrescriptionId > 0,
    retry: false,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['deliveries', statusFilter],
    queryFn: () => deliveriesApi.list({ status: statusFilter || undefined }),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const createMutation = useMutation({
    mutationFn: () =>
      deliveriesApi.create({
        prescription_id: numericPrescriptionId,
        rider_id: riderId ? Number(riderId) : undefined,
        delivery_address: deliveryAddress.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries'] })
      setModalVisible(false)
      setPrescriptionId(''); setRiderId(''); setDeliveryAddress(''); setFormError('')
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: DeliveryStatus }) =>
      deliveriesApi.updateStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries'] })
      setStatusModalVisible(false)
      setActiveDeliveryId(null)
    },
  })

  const deliveries = data?.deliveries || []
  const optimizedRoute = useMemo<OptimizedRoute | null>(() => {
    const active = deliveries.filter(d => d.status !== 'DELIVERED' && d.status !== 'FAILED')
    if (active.length < 2) return null
    return optimizeRoute(active)
  }, [deliveries])

  const canRequest = hasRole('CLINIC_STAFF', 'ADMIN')
  const isRider = hasRole('RIDER')
  const canOptimize = isRider || hasRole('ADMIN')

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = deliveries.filter(d => d.status === s).length
    return acc
  }, {} as Record<string, number>)

  if (isLoading) {
    return (
      <Screen>
        <PageHeader title="Deliveries" showBack={false} />
        <View style={{ padding: Spacing.md }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <PageHeader title="Deliveries" subtitle="Medication & Lab Transit" showBack={false} />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          {STATUSES.slice(0, 4).map(s => {
            const cfg = STATUS_CONFIG[s]
            return (
              <View key={s} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: cfg.color + '15' }]}>
                  <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                </View>
                <Text style={styles.statValue}>{statusCounts[s]}</Text>
                <Text style={styles.statLabel}>{s.replace('_', ' ')}</Text>
              </View>
            )
          })}
        </View>

        {canOptimize && optimizedRoute && (
          <Button
            mode={showRoute ? 'contained' : 'outlined'}
            buttonColor={showRoute ? Colors.primary : undefined}
            onPress={() => setShowRoute(!showRoute)}
            icon="map"
            style={styles.routeToggle}
          >
            {showRoute ? 'Hide Route' : 'Optimize Route'}
          </Button>
        )}

        {showRoute && optimizedRoute && (
          <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <Ionicons name="navigate" size={20} color={Colors.primary} />
              <Text style={styles.routeTitle}>Optimized Route</Text>
            </View>
            <View style={styles.routeStats}>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatValue}>{optimizedRoute.totalDistance} km</Text>
                <Text style={styles.routeStatLabel}>Distance</Text>
              </View>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatValue}>
                  {Math.floor(optimizedRoute.estimatedTimeMinutes / 60)}h {optimizedRoute.estimatedTimeMinutes % 60}m
                </Text>
                <Text style={styles.routeStatLabel}>Est. Time</Text>
              </View>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatValue}>{optimizedRoute.stops.length}</Text>
                <Text style={styles.routeStatLabel}>Stops</Text>
              </View>
            </View>
            {optimizedRoute.stops.map((stop, idx) => (
              <View key={stop.deliveryId} style={styles.stopRow}>
                <View style={[styles.stopDot, idx === 0 && { backgroundColor: Colors.primary }]}>
                  <Text style={styles.stopNum}>{idx + 1}</Text>
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopDistrict}>{stop.district}</Text>
                  <Text style={styles.stopMeta}>
                    Delivery #{stop.deliveryId}{stop.distance > 0 ? ` - ${stop.distance} km` : ' - Start'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Chip
            selected={statusFilter === ''}
            onPress={() => setStatusFilter('')}
            style={styles.chip}
            selectedColor={Colors.primary}
            showSelectedOverlay
          >
            All ({deliveries.length})
          </Chip>
          {STATUSES.map(s => (
            <Chip
              key={s}
              selected={statusFilter === s}
              onPress={() => setStatusFilter(s)}
              style={styles.chip}
              selectedColor={STATUS_CONFIG[s].color}
              showSelectedOverlay
            >
              {s.replace('_', ' ')} ({statusCounts[s]})
            </Chip>
          ))}
        </ScrollView>

        {deliveries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No deliveries yet</Text>
            <Text style={styles.emptySubtitle}>Request your first delivery to get started</Text>
            <Button mode="contained" onPress={() => { setModalVisible(true); setFormError('') }} style={{ marginTop: 16, backgroundColor: Colors.primary }}>
              Request Delivery
            </Button>
          </View>
        ) : (
          deliveries.map(delivery => {
            const cfg = STATUS_CONFIG[delivery.status] || STATUS_CONFIG.PENDING
            return (
              <View key={delivery.id} style={styles.card}>
                <View style={[styles.statusBar, { backgroundColor: cfg.color }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.cardTitle}>Delivery #{delivery.id}</Text>
                      <Text style={styles.cardSub}>Prescription #{delivery.prescription_id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.color + '15' }]}>
                      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                      <Text style={[styles.statusText, { color: cfg.color }]}>
                        {delivery.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.addressRow}>
                    <Ionicons name="location" size={14} color={Colors.textSecondary} />
                    <Text style={styles.address} numberOfLines={1}>{delivery.delivery_address}</Text>
                  </View>
                  {delivery.rider_id ? (
                    <View style={styles.metaBadge}>
                      <Ionicons name="bicycle" size={12} color="#6F42C1" />
                      <Text style={[styles.metaText, { color: '#6F42C1' }]}>Rider #{delivery.rider_id}</Text>
                    </View>
                  ) : null}
                  {isRider || hasRole('ADMIN') ? (
                    <Button
                      mode="text"
                      compact
                      onPress={() => { setActiveDeliveryId(delivery.id); setStatusModalVisible(true) }}
                      labelStyle={{ color: Colors.primary, fontSize: 12 }}
                    >
                      Update Status
                    </Button>
                  ) : null}
                </View>
              </View>
            )
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {canRequest && (
        <FAB
          icon="plus"
          label="Request Delivery"
          style={styles.fab}
          onPress={() => { setModalVisible(true); setFormError('') }}
        />
      )}

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Request Delivery</Text>

          <TextInput
            label="Prescription ID *"
            value={prescriptionId}
            onChangeText={setPrescriptionId}
            keyboardType="number-pad"
            mode="outlined"
            left={<TextInput.Icon icon="medical-bag" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />
          {isLoadingPrescription ? (
            <Text style={styles.verify}>Verifying prescription...</Text>
          ) : prescriptionData ? (
            <Text style={styles.verified}>Found for Patient #{prescriptionData.patient_id}</Text>
          ) : prescriptionId ? (
            <Text style={styles.notFound}>Prescription not found</Text>
          ) : null}

          <TextInput
            label="Rider ID (optional)"
            value={riderId}
            onChangeText={setRiderId}
            keyboardType="number-pad"
            mode="outlined"
            left={<TextInput.Icon icon="bicycle" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          <TextInput
            label="Delivery Address *"
            placeholder="e.g. House No. 24, Karaga District"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="map-marker-outline" color={Colors.primaryLight} />}
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 10 }}
          />

          {formError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalBtn}>Cancel</Button>
            <Button
              mode="contained"
              onPress={() => { setFormError(''); createMutation.mutate() }}
              loading={createMutation.isPending}
              disabled={createMutation.isPending || !prescriptionData || !deliveryAddress.trim()}
              buttonColor={Colors.primary}
              style={styles.modalBtn}
            >
              Submit
            </Button>
          </View>
        </Modal>

        <Modal visible={statusModalVisible} onDismiss={() => setStatusModalVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Update Status</Text>
          <View style={styles.statusGrid}>
            {STATUSES.map(s => {
              const cfg = STATUS_CONFIG[s]
              return (
                <Button
                  key={s}
                  mode="outlined"
                  icon={cfg.icon}
                  onPress={() => { if (activeDeliveryId) statusMutation.mutate({ id: activeDeliveryId, status: s }) }}
                  loading={statusMutation.isPending}
                  style={[styles.statusBtn, { borderColor: cfg.color + '40' }]}
                  labelStyle={{ color: cfg.color, fontWeight: '600' }}
                >
                  {s.replace('_', ' ')}
                </Button>
              )
            })}
          </View>
          <Button mode="text" onPress={() => setStatusModalVisible(false)} style={{ marginTop: Spacing.sm }}>Cancel</Button>
        </Modal>
      </Portal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  statsRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 8, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  routeToggle: { marginBottom: Spacing.md, borderRadius: 12 },

  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  routeTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  routeStats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  routeStat: { flex: 1, alignItems: 'center' },
  routeStatValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  routeStatLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  stopDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  stopNum: { fontSize: 11, fontWeight: '700', color: Colors.white },
  stopInfo: { flex: 1 },
  stopDistrict: { fontSize: 14, fontWeight: '600', color: Colors.text },
  stopMeta: { fontSize: 12, color: Colors.textSecondary },

  chipScroll: { marginBottom: Spacing.md },
  chip: { marginRight: Spacing.xs },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  statusBar: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  address: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#6F42C1' + '12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  metaText: { fontSize: 11, fontWeight: '600' },

  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary },

  modal: { backgroundColor: Colors.surface, padding: Spacing.xl, margin: Spacing.lg, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: Spacing.lg },
  input: { marginBottom: Spacing.md, backgroundColor: Colors.backgroundAlt },
  verify: { fontSize: 12, color: Colors.textLight, marginBottom: Spacing.sm, marginLeft: 4 },
  verified: { fontSize: 12, color: Colors.primary, marginBottom: Spacing.sm, marginLeft: 4, fontWeight: '600' },
  notFound: { fontSize: 12, color: Colors.error, marginBottom: Spacing.sm, marginLeft: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.errorLight, padding: Spacing.md, borderRadius: 12, marginBottom: Spacing.md },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '600', flex: 1 },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  modalBtn: { flex: 1, borderRadius: 12 },
  statusGrid: { gap: Spacing.sm },
  statusBtn: { borderRadius: 10 },
})
