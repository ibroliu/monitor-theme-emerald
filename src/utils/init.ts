import type { MonitorNode, NodeStatus } from '@/utils/api'
import { useAppStore } from '@/stores/app'
import { useNodesStore } from '@/stores/nodes'
import {
  adaptMonitorNode,
  buildAdminUrl,
  fetchAllServers,
  fetchNodePingSummary,
  fetchSiteConfigs,
  getSharedApi,
  getWebSocketBases,
  isEnabledValue,
} from '@/utils/api'

/** 首页 ping 汇总刷新间隔：hub 快照每 2 秒已覆盖实时指标，ping 按此节奏重算 */
const PING_REFRESH_INTERVAL_MS = 5 * 60 * 1000

class InitManager {
  private appStore = useAppStore()
  private nodesStore = useNodesStore()
  private sockets: WebSocket[] = []
  private reconnectTimers = new Map<number, ReturnType<typeof setTimeout>>()
  private reconnectAttempts = new Map<number, number>()
  private pingRefreshTimer: ReturnType<typeof setInterval> | null = null
  private destroyed = false

  async init(): Promise<void> {
    try {
      const configs = await fetchSiteConfigs()
      const config = configs[0]
      if (config?.site_title)
        document.title = config.site_title

      if (config && !isEnabledValue(config.is_public) && !config.authorization) {
        window.location.href = buildAdminUrl()
        return
      }

      this.appStore.publicSettings = await getSharedApi().getPublicSettings()
      this.appStore.updateLoginState(configs.some(item => item.authorization))
      // monitor 延迟窗口：1 小时 30 桶（2 分钟一桶），与 fetchNodePingSummary 对齐
      this.nodesStore.configurePingHistory({ points: 30, hours: 1 })
      await this.loadNodes()
      await this.refreshAllPing()
      this.connectAllSockets()
      this.pingRefreshTimer = setInterval(() => {
        void this.refreshAllPing()
      }, PING_REFRESH_INTERVAL_MS)
    }
    catch (error) {
      this.appStore.connectionError = true
      throw error
    }
    finally {
      this.appStore.loading = false
    }
  }

  private async loadNodes(): Promise<void> {
    try {
      const { clients, statuses } = await fetchAllServers()
      this.nodesStore.initNodes(clients, statuses)
      this.appStore.connectionError = false
    }
    catch (error) {
      this.appStore.connectionError = true
      throw error
    }
  }

  /** 逐节点拉取近 1 小时延迟数据，更新首页三网行与 sparkline */
  private async refreshAllPing(): Promise<void> {
    if (this.destroyed)
      return
    const uuids = this.nodesStore.nodes.map(node => node.uuid)
    await Promise.all(uuids.map(async (uuid) => {
      try {
        const { ping, window } = await fetchNodePingSummary(uuid)
        this.nodesStore.updateNodePing(uuid, ping)
        this.nodesStore.setPingHistory(uuid, window)
      }
      catch {
        // 保留旧数据，下次再试
      }
    }))
  }

  private connectAllSockets(): void {
    getWebSocketBases().forEach((baseUrl, apiIndex) => this.connectSocket(baseUrl, apiIndex))
  }

  /**
   * monitor 的 /api/ws 每 2 秒推送全量节点快照 `{nodes: [...]}`，
   * 无订阅协议，直接应用即可。
   */
  private applySnapshot(nodes: MonitorNode[]): void {
    const current = new Set(this.nodesStore.nodes.map(node => node.uuid))
    const incoming = new Set(nodes.map(node => String(node.id)))
    const membershipChanged = current.size !== incoming.size
      || [...incoming].some(id => !current.has(id))

    if (membershipChanged) {
      // 节点增删：全量重载后再补 ping
      void this.loadNodes().then(() => this.refreshAllPing())
      return
    }

    const statuses: Record<string, NodeStatus> = {}
    for (const node of nodes) {
      const uuid = String(node.id)
      const adapted = adaptMonitorNode(node)
      // /api/nodes 快照不带 ping，保留 refreshAllPing 算好的值
      const existing = this.nodesStore.nodesByUuid.get(uuid)
      if (existing?.ping && Object.keys(existing.ping).length > 0)
        adapted.status.ping = existing.ping
      statuses[uuid] = adapted.status
    }
    this.nodesStore.updateNodeStatuses(statuses)
  }

  private connectSocket(baseUrl: string, apiIndex: number): void {
    if (this.destroyed)
      return
    const url = new URL(`${baseUrl}/api/ws`, window.location.origin)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(url)
    this.sockets[apiIndex] = socket
    this.nodesStore.updateWsState('connecting', this.reconnectAttempts.get(apiIndex) ?? 0)

    socket.addEventListener('open', () => {
      this.reconnectAttempts.set(apiIndex, 0)
      this.nodesStore.updateWsState('connected', 0)
    })

    socket.addEventListener('message', (event) => {
      let payload: { nodes?: MonitorNode[] }
      try {
        payload = JSON.parse(String(event.data)) as { nodes?: MonitorNode[] }
      }
      catch {
        return
      }
      if (!Array.isArray(payload.nodes))
        return
      this.applySnapshot(payload.nodes)
    })

    socket.addEventListener('close', () => this.scheduleReconnect(baseUrl, apiIndex))
    socket.addEventListener('error', () => socket.close())
  }

  /**
   * 详情页曾用的单节点订阅。monitor 的全局快照已覆盖详情页实时数据，
   * 保留 noop 签名以免改动调用方。
   */
  subscribeNode(_uuid: string): () => void {
    return () => {}
  }

  private scheduleReconnect(baseUrl: string, apiIndex: number): void {
    if (this.destroyed || this.reconnectTimers.has(apiIndex))
      return
    const attempts = (this.reconnectAttempts.get(apiIndex) ?? 0) + 1
    this.reconnectAttempts.set(apiIndex, attempts)
    this.nodesStore.updateWsState('reconnecting', attempts)
    const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempts, 5))
    const timer = setTimeout(() => {
      this.reconnectTimers.delete(apiIndex)
      this.connectSocket(baseUrl, apiIndex)
    }, delay)
    this.reconnectTimers.set(apiIndex, timer)
  }

  destroy(): void {
    this.destroyed = true
    this.sockets.forEach(socket => socket?.close())
    this.sockets = []
    this.reconnectTimers.forEach(timer => clearTimeout(timer))
    this.reconnectTimers.clear()
    if (this.pingRefreshTimer)
      clearInterval(this.pingRefreshTimer)
    this.pingRefreshTimer = null
    this.nodesStore.updateWsState('disconnected', 0)
  }
}

let initManager: InitManager | null = null

export async function initApp(): Promise<void> {
  initManager ??= new InitManager()
  await initManager.init()
}

export function destroyInitManager(): void {
  initManager?.destroy()
  initManager = null
}

export function subscribeNodeLive(uuid: string): () => void {
  return initManager?.subscribeNode(uuid) ?? (() => {})
}
