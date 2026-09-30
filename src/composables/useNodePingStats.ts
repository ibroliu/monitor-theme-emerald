import type { MaybeRefOrGetter } from 'vue'
import type { PingHistoryPoint } from '@/stores/nodes'
import { computed, ref, toValue } from 'vue'
import { useNodesStore } from '@/stores/nodes'

export interface NodePingHistoryPoint extends PingHistoryPoint {}

export interface NodePingStatsState {
  avgLatency: number
  avgLoss: number
  avgVolatility: number
  history: NodePingHistoryPoint[]
  hasData: boolean
}

export const NODE_PING_BAR_COUNT = 10

function average(values: number[]): number {
  if (!values.length)
    return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function useNodePingStats(
  uuid: MaybeRefOrGetter<string>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const nodesStore = useNodesStore()
  const enabled = computed(() => toValue(options?.enabled) ?? true)
  const history = computed(() => {
    if (!enabled.value)
      return []
    return nodesStore.pingHistoryByUuid[toValue(uuid)] ?? []
  })

  const stats = computed<NodePingStatsState>(() => {
    const points = history.value
    const latencyValues = points
      .map(point => point.latency)
      .filter((value): value is number => value !== null)
    const lossValues = points
      .map(point => point.loss)
      .filter((value): value is number => value !== null)

    return {
      avgLatency: average(latencyValues),
      avgLoss: average(lossValues),
      avgVolatility: 0,
      history: points,
      hasData: Boolean(latencyValues.length || lossValues.length),
    }
  })

  return {
    stats,
    loading: ref(false),
    error: ref<string | null>(null),
    history,
    avgLatency: computed(() => stats.value.avgLatency),
    avgLoss: computed(() => stats.value.avgLoss),
    avgVolatility: computed(() => stats.value.avgVolatility),
    hasData: computed(() => stats.value.hasData),
  }
}
