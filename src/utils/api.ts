import type { PingHistoryPoint } from '@/stores/nodes'
import type { Client, NodeStatus, NodeStatusPing, PingRecord, StatusRecord } from '@/utils/rpc'
import { publicAsset } from '@/utils/publicAsset'
import { getEmojiByCode } from '@/utils/regionHelper'

export type { Client, NodeStatus, NodeStatusPing, PingRecord, StatusRecord }
export type { PingHistoryPoint }

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

const BILLING_CYCLE_DAYS = {
  month: 30,
  quarter: 90,
  half_year: 180,
  year: 365,
  two_years: 730,
  three_years: 1095,
  four_years: 1460,
  five_years: 1825,
} as const

type BillingCycleKey = keyof typeof BILLING_CYCLE_DAYS

const BILLING_CYCLE_ALIASES: Record<string, BillingCycleKey> = {
  '月': 'month',
  'monthly': 'month',
  'month': 'month',
  'mo': 'month',
  '季': 'quarter',
  '季度': 'quarter',
  'quarterly': 'quarter',
  'quarter': 'quarter',
  '半年': 'half_year',
  'halfyear': 'half_year',
  'half_year': 'half_year',
  'half-year': 'half_year',
  'halfyearly': 'half_year',
  'half-yearly': 'half_year',
  '年': 'year',
  '一年': 'year',
  'annual': 'year',
  'yearly': 'year',
  'year': 'year',
  '两年': 'two_years',
  '二年': 'two_years',
  'two_years': 'two_years',
  'two-years': 'two_years',
  '2 years': 'two_years',
  '三年': 'three_years',
  'three_years': 'three_years',
  'three-years': 'three_years',
  '3 years': 'three_years',
  '四年': 'four_years',
  'four_years': 'four_years',
  'four-years': 'four_years',
  '4 years': 'four_years',
  '五年': 'five_years',
  'five_years': 'five_years',
  'five-years': 'five_years',
  '5 years': 'five_years',
}

const BILLING_CYCLE_SUFFIX_REGEX = /\/\s*(?:(\d+(?:\.\d+)?)\s*)?(d(?:ay)?s?|m(?:onth)?s?|q(?:uarter)?s?|y(?:ear)?s?)\s*$/i
const COMPACT_BILLING_REGEX = /(?:^|\/)\s*(?:(\d+(?:\.\d+)?)\s*)?([dmqy]|day|days|mo|month|months|quarter|quarters|yr|year|years)\s*$/i
const ONCE_BILLING_REGEX = /^(?:once|one[-_\s]?time|一次性?)$/i

/* ------------------------------------------------------------------ */
/* monitor hub wire types                                              */
/* ------------------------------------------------------------------ */

export interface MonitorMetrics {
  uptime: number
  cpu: number
  load: [number, number, number]
  mem_total: number
  mem_used: number
  swap_total: number
  swap_used: number
  disk_total: number
  disk_used: number
  net_rx: number
  net_tx: number
  total_rx: number
  total_tx: number
  month_rx: number
  month_tx: number
  tcp: number
  udp: number
  procs: number
}

export interface MonitorNode {
  id: number
  name: string
  sort: number
  public: boolean
  online: boolean
  country: string
  group?: string
  last_seen: number
  metrics: MonitorMetrics | null
  os: string
  kernel: string
  arch: string
  virt: string
  cpu_name: string
  cpu_cores: number
  mem_total: number
  swap_total: number
  disk_total: number
  agent_version: string
  price: number
  currency: string
  billing_cycle: string
  expires_at: string | null
  traffic_limit: number
  traffic_mode: string
  traffic_reset_day: number
  total_rx: number
  total_tx: number
  month_rx: number
  month_tx: number
}

export interface MonitorMe {
  authed: boolean
  github: boolean
  public_page: boolean
  site: string
  site_name: string
}

interface MonitorNodesResponse {
  admin: boolean
  nodes: MonitorNode[]
}

interface MonitorHistoryRow {
  ts: number
  cpu?: number
  mem_used?: number
  disk_used?: number
  net_rx?: number
  net_tx?: number
  net_rx_max?: number
  net_tx_max?: number
  cpu_max?: number
  minutes?: number
}

interface MonitorPingRow {
  task_id: number | string
  ts: number
  latency: number | null
  band?: number | null
  loss?: number | null
}

interface MonitorMetricsResponse {
  metrics?: MonitorHistoryRow[]
  ping?: MonitorPingRow[]
  probes?: Record<string, string>
  loss?: Record<string, number>
}

/* ------------------------------------------------------------------ */
/* legacy UI-facing types (kept for component compatibility)           */
/* ------------------------------------------------------------------ */

export interface SiteConfig {
  version: string
  last_workers_version?: string | null
  last_agent_version?: string | null
  is_public: boolean | string
  authorization: boolean
  turnstile_enabled: boolean | string
  turnstile_login_enabled?: boolean | string
  turnstile_site_key?: string
  site_title?: string
  verified?: boolean
  turnstile_verified?: string | null
  show_long_history?: boolean
  theme_options?: unknown
}

export interface SysConfig {
  show_price?: boolean
  show_expire?: boolean
  show_tf?: boolean
  show_time?: boolean
  show_long_history?: boolean
  show_three_net_details?: boolean
}

export type ThemeMode = 'auto' | 'light' | 'dark'
export type NodeViewMode = 'card' | 'list'
export type EarthViewMode = 'earth' | 'earth-stop' | 'maps' | 'cards' | 'hide'
export type BackgroundType = 'image' | 'video'

export interface ThemeSettings {
  defaultThemeMode: ThemeMode
  defaultViewMode: NodeViewMode
  alertEnabled: boolean
  alertTitle: string
  alertContent: string
  earthViewMode: EarthViewMode
  visitorInfoCardEnabled: boolean
  hideAdminEntryWhenLoggedOut: boolean
  disablePageAnimation: boolean
  offlineNodesLast: boolean
  icpEnabled: boolean
  icpNumber: string
  icpUrl: string
  policeEnabled: boolean
  policeNumber: string
  policeUrl: string
  backgroundEnabled: boolean
  backgroundType: BackgroundType
  lightBackgroundUrl: string
  darkBackgroundUrl: string
  backgroundBlur: number
  backgroundOverlay: number
}

export interface PublicSettings {
  allow_cors: boolean
  custom_body: string
  custom_head: string
  description: string
  disable_password_login: boolean
  oauth_enable: boolean
  oauth_provider: string | null
  ping_record_preserve_time: number
  private_site: boolean
  record_enabled: boolean
  record_preserve_time: number
  sitename: string
  theme: string
  themeSettings: ThemeSettings
}

export interface MeInfo {
  logged_in: boolean
  username: string
}

export interface VersionInfo {
  hash: string
  version: string
}

export interface ServerSource {
  apiIndex: number
  baseUrl: string
  serverId: string
}

interface AdaptedNode {
  client: Client
  status: NodeStatus
}

export class ApiError extends Error {
  code?: number
  apiIndex?: number

  constructor(message: string, code?: number, apiIndex?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.apiIndex = apiIndex
  }
}

/** Kept for App.vue compatibility; same-origin requests never hit CORS. */
export class CorsError extends ApiError {
  origin: string

  constructor(origin: string, apiIndex?: number) {
    super('跨域请求被浏览器拦截', undefined, apiIndex)
    this.name = 'CorsError'
    this.origin = origin
  }
}

export type PingProviderKey = 'ct' | 'cu' | 'cm' | 'bd'

const PING_PROVIDER_KEYS: PingProviderKey[] = ['ct', 'cu', 'cm', 'bd']

const sourceRegistry = new Map<string, ServerSource>()
let cachedSiteConfigs: SiteConfig[] = []
/** fetchAllServers 写入，供 fetchHistory 补总量字段 */
const clientCache: Record<string, Client> = {}
const totalsCache: Record<string, { up: number, down: number, monthlyUp: number, monthlyDown: number }> = {}

function enabled(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  defaultViewMode: 'card',
  defaultThemeMode: 'auto',
  alertEnabled: false,
  alertTitle: '',
  alertContent: '',
  earthViewMode: 'earth',
  visitorInfoCardEnabled: true,
  hideAdminEntryWhenLoggedOut: false,
  disablePageAnimation: false,
  offlineNodesLast: false,
  icpEnabled: false,
  icpNumber: '',
  icpUrl: 'https://beian.miit.gov.cn/',
  policeEnabled: false,
  policeNumber: '',
  policeUrl: '',
  backgroundEnabled: false,
  backgroundType: 'image',
  lightBackgroundUrl: '',
  darkBackgroundUrl: '',
  backgroundBlur: 0,
  backgroundOverlay: 0,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function themeOptionValues(value: unknown): Record<string, unknown> {
  if (!isRecord(value))
    return {}

  const values: Record<string, unknown> = {}
  const configuration = value.configuration
  if (Array.isArray(configuration)) {
    for (const item of configuration) {
      if (!isRecord(item) || typeof item.key !== 'string')
        continue
      values[item.key] = item.value
    }
  }

  for (const [key, optionValue] of Object.entries(value)) {
    if (key !== 'configuration')
      values[key] = optionValue
  }
  return values
}

function themeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean')
    return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true')
      return true
    if (value.toLowerCase() === 'false')
      return false
  }
  return fallback
}

function themeString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function themeNumber(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value)
  return Number.isFinite(number) && number >= min && number <= max ? number : fallback
}

function themeEnum<T extends string>(value: unknown, fallback: T, values: readonly T[]): T {
  return typeof value === 'string' && (values as readonly string[]).includes(value) ? value as T : fallback
}

/** Converts the theme config wire format (hub `/api/themes/{short}/config` or README default JSON) to UI-safe values. */
export function adaptThemeOptions(value: unknown): ThemeSettings {
  const options = themeOptionValues(value)
  return {
    defaultViewMode: themeEnum(options.defaultViewMode, DEFAULT_THEME_SETTINGS.defaultViewMode, ['card', 'list']),
    defaultThemeMode: themeEnum(options.defaultThemeMode, DEFAULT_THEME_SETTINGS.defaultThemeMode, ['auto', 'light', 'dark']),
    alertEnabled: themeBoolean(options.alertEnabled, DEFAULT_THEME_SETTINGS.alertEnabled),
    alertTitle: themeString(options.alertTitle, DEFAULT_THEME_SETTINGS.alertTitle),
    alertContent: themeString(options.alertContent, DEFAULT_THEME_SETTINGS.alertContent),
    earthViewMode: themeEnum(options.earthViewMode, DEFAULT_THEME_SETTINGS.earthViewMode, ['earth', 'earth-stop', 'maps', 'cards', 'hide']),
    visitorInfoCardEnabled: themeBoolean(options.visitorInfoCardEnabled, DEFAULT_THEME_SETTINGS.visitorInfoCardEnabled),
    hideAdminEntryWhenLoggedOut: themeBoolean(options.hideAdminEntryWhenLoggedOut, DEFAULT_THEME_SETTINGS.hideAdminEntryWhenLoggedOut),
    disablePageAnimation: themeBoolean(options.disablePageAnimation, DEFAULT_THEME_SETTINGS.disablePageAnimation),
    offlineNodesLast: themeBoolean(options.offlineNodesLast, DEFAULT_THEME_SETTINGS.offlineNodesLast),
    icpEnabled: themeBoolean(options.icpEnabled, DEFAULT_THEME_SETTINGS.icpEnabled),
    icpNumber: themeString(options.icpNumber, DEFAULT_THEME_SETTINGS.icpNumber),
    icpUrl: themeString(options.icpUrl, DEFAULT_THEME_SETTINGS.icpUrl),
    policeEnabled: themeBoolean(options.policeEnabled, DEFAULT_THEME_SETTINGS.policeEnabled),
    policeNumber: themeString(options.policeNumber, DEFAULT_THEME_SETTINGS.policeNumber),
    policeUrl: themeString(options.policeUrl, DEFAULT_THEME_SETTINGS.policeUrl),
    backgroundEnabled: themeBoolean(options.backgroundEnabled, DEFAULT_THEME_SETTINGS.backgroundEnabled),
    backgroundType: themeEnum(options.backgroundType, DEFAULT_THEME_SETTINGS.backgroundType, ['image', 'video']),
    lightBackgroundUrl: themeString(options.lightBackgroundUrl, DEFAULT_THEME_SETTINGS.lightBackgroundUrl),
    darkBackgroundUrl: themeString(options.darkBackgroundUrl, DEFAULT_THEME_SETTINGS.darkBackgroundUrl),
    backgroundBlur: themeNumber(options.backgroundBlur, DEFAULT_THEME_SETTINGS.backgroundBlur, 0, 100),
    backgroundOverlay: themeNumber(options.backgroundOverlay, DEFAULT_THEME_SETTINGS.backgroundOverlay, -100, 100),
  }
}

function finiteNumber(value: unknown): number {
  const number = Number.parseFloat(String(value ?? 0))
  return Number.isFinite(number) ? number : 0
}

function parseBillingCycleSuffix(countText: string | undefined, unit: string): number {
  const count = Number(countText || 1)
  const normalizedUnit = unit.toLowerCase()

  if (normalizedUnit.startsWith('y'))
    return count * 365
  if (normalizedUnit.startsWith('q'))
    return count * 90
  if (normalizedUnit.startsWith('m'))
    return count * 30
  return count
}

/**
 * monitor hub stores billing_cycle normalized: `monthly`, `yearly`, `once`,
 * or `<n>m` (n months). Map to the day-based cycle the UI keeps internally.
 */
function parseBillingCycle(value: unknown): number | null {
  if (value === undefined || value === null || value === '')
    return null

  if (typeof value === 'number')
    return Number.isFinite(value) ? value : null

  const text = String(value).trim()
  if (!text)
    return null

  const numericCycle = Number(text)
  if (Number.isFinite(numericCycle))
    return numericCycle

  const normalized = text.toLowerCase().replaceAll(' ', '_')
  const aliasedCycle = BILLING_CYCLE_ALIASES[normalized] ?? BILLING_CYCLE_ALIASES[text.toLowerCase()]
  if (aliasedCycle)
    return BILLING_CYCLE_DAYS[aliasedCycle]

  if (ONCE_BILLING_REGEX.test(text))
    return -1

  const cycleSuffix = text.match(BILLING_CYCLE_SUFFIX_REGEX)
  if (cycleSuffix)
    return parseBillingCycleSuffix(cycleSuffix[1], cycleSuffix[2] ?? '')

  const compactCycle = text.match(COMPACT_BILLING_REGEX)
  if (compactCycle)
    return parseBillingCycleSuffix(compactCycle[1], compactCycle[2] ?? '')

  return null
}

function trafficLimitType(value: unknown): string {
  const type = String(value ?? '').toLowerCase()
  if (type === 'dl' || type === 'down')
    return 'down'
  if (type === 'ul' || type === 'up')
    return 'up'
  if (type === 'min' || type === 'max')
    return type
  return 'sum'
}

const TELECOM_PROBE_REGEX = /电信|telecom/
const UNICOM_PROBE_REGEX = /联通|unicom/
const MOBILE_PROBE_REGEX = /移动|mobile/

/** monitor 探测名称 → 三网 key；名称对不上的按顺序占用剩余 key */
function probeProviderKey(name: string, used: Set<PingProviderKey>): PingProviderKey {
  const text = name.toLowerCase()
  const preferred: PingProviderKey[] = []
  if (TELECOM_PROBE_REGEX.test(text))
    preferred.push('ct')
  if (UNICOM_PROBE_REGEX.test(text))
    preferred.push('cu')
  if (MOBILE_PROBE_REGEX.test(text))
    preferred.push('cm')

  for (const key of preferred) {
    if (!used.has(key)) {
      used.add(key)
      return key
    }
  }
  for (const key of PING_PROVIDER_KEYS) {
    if (!used.has(key)) {
      used.add(key)
      return key
    }
  }
  return 'bd'
}

/* ------------------------------------------------------------------ */
/* same-origin request plumbing                                        */
/* ------------------------------------------------------------------ */

export function getApiBases(): string[] {
  return ['']
}

export function getWebSocketBases(): string[] {
  return ['']
}

/** 主题静态资源走主题包自带（hub 不提供 /flags、/os-icons） */
export function getApiAssetUrl(path: string, _apiIndex = 0): string {
  return publicAsset(path)
}

export function hasMultipleApiBases(): boolean {
  return false
}

export function getServerSource(uuid: string): ServerSource {
  return sourceRegistry.get(uuid) ?? { apiIndex: 0, baseUrl: '', serverId: uuid }
}

export function getRegisteredServerIds(apiIndex: number): string[] {
  return [...sourceRegistry.values()]
    .filter(source => source.apiIndex === apiIndex)
    .map(source => source.serverId)
}

export function getRegisteredDisplayUuids(): string[] {
  return [...sourceRegistry.keys()]
}

export function getDisplayUuid(_apiIndex: number, serverId: string): string {
  return serverId
}

/**
 * 同源请求。hub 的错误是纯文本单行；200 却不是 JSON 时说明中间有代理页。
 */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, options)
  }
  catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }

  const text = await response.text()
  if (!response.ok)
    throw new ApiError(text.trim() || `HTTP ${response.status}`, response.status, 0)

  try {
    return JSON.parse(text) as T
  }
  catch {
    throw new ApiError('收到的不是状态数据，稍后再试', response.status, 0)
  }
}

export async function fetchSiteConfigs(): Promise<SiteConfig[]> {
  const me = await request<MonitorMe>('/api/me')
  const config: SiteConfig = {
    version: '',
    is_public: me.public_page,
    authorization: me.authed,
    turnstile_enabled: false,
    site_title: me.site_name || 'Monitor',
  }
  cachedSiteConfigs = [config]
  return cachedSiteConfigs
}

export function getCachedSiteConfigs(): SiteConfig[] {
  return cachedSiteConfigs
}

/** 站长在 hub 面板「主题」页保存的本主题设置 */
async function fetchEmeraldThemeConfig(): Promise<unknown> {
  try {
    return await request('/api/themes/emerald/config')
  }
  catch {
    return {}
  }
}

/* ------------------------------------------------------------------ */
/* node adaptation                                                     */
/* ------------------------------------------------------------------ */

export function adaptMonitorNode(node: MonitorNode): AdaptedNode {
  const uuid = String(node.id)
  sourceRegistry.set(uuid, { apiIndex: 0, baseUrl: '', serverId: uuid })

  const m = node.metrics
  const now = Date.now()
  const lastSeen = node.last_seen > 0 ? node.last_seen * 1000 : 0
  const load = m?.load ?? []
  const online = node.online ?? (lastSeen > 0 && now - lastSeen < ONLINE_THRESHOLD_MS)
  const billingCycle = parseBillingCycle(node.billing_cycle) ?? 30
  const price = finiteNumber(node.price)

  const client: Client = {
    uuid,
    source_id: uuid,
    source_index: 0,
    name: node.name || uuid,
    cpu_name: node.cpu_name || '-',
    virtualization: node.virt || '-',
    kernel_version: node.kernel || '-',
    arch: node.arch || '-',
    cpu_cores: finiteNumber(node.cpu_cores),
    os: node.os || '-',
    boot_time: m && m.uptime > 0 ? new Date(now - m.uptime * 1000).toISOString() : '',
    gpu_name: '',
    gpu_info: '',
    ipv4: undefined,
    ipv6: undefined,
    region: node.country ? getEmojiByCode(node.country.toUpperCase()) : '',
    public_remark: '',
    mem_total: finiteNumber(node.mem_total),
    swap_total: finiteNumber(node.swap_total),
    disk_total: finiteNumber(node.disk_total),
    version: node.agent_version,
    weight: finiteNumber(node.sort),
    price,
    price_configured: price > 0,
    billing_cycle: billingCycle,
    auto_renewal: false,
    currency: String(node.currency || 'CNY').trim().toUpperCase() || 'CNY',
    expired_at: node.expires_at || '9999-12-31',
    group: node.group || '默认分组',
    tags: '',
    hidden: !node.public,
    traffic_limit: finiteNumber(node.traffic_limit),
    traffic_limit_type: trafficLimitType(node.traffic_mode),
    created_at: '',
    updated_at: lastSeen ? new Date(lastSeen).toISOString() : '',
  }

  clientCache[uuid] = client
  totalsCache[uuid] = {
    up: finiteNumber(node.total_tx),
    down: finiteNumber(node.total_rx),
    monthlyUp: finiteNumber(node.month_tx),
    monthlyDown: finiteNumber(node.month_rx),
  }

  const status: NodeStatus = {
    client: uuid,
    time: lastSeen ? new Date(lastSeen).toISOString() : '',
    cpu: m ? finiteNumber(m.cpu) : 0,
    gpu: 0,
    ram: m ? finiteNumber(m.mem_used) : 0,
    ram_total: finiteNumber(node.mem_total),
    swap: m ? finiteNumber(m.swap_used) : 0,
    swap_total: finiteNumber(node.swap_total),
    load: finiteNumber(load[0]),
    load5: finiteNumber(load[1]),
    load15: finiteNumber(load[2]),
    temp: 0,
    disk: m ? finiteNumber(m.disk_used) : 0,
    disk_total: finiteNumber(node.disk_total),
    net_in: m ? finiteNumber(m.net_rx) : 0,
    net_out: m ? finiteNumber(m.net_tx) : 0,
    net_total_up: finiteNumber(node.total_tx),
    net_total_down: finiteNumber(node.total_rx),
    net_monthly_up: finiteNumber(node.month_tx),
    net_monthly_down: finiteNumber(node.month_rx),
    process: m ? finiteNumber(m.procs) : 0,
    connections: m ? finiteNumber(m.tcp) : 0,
    connections_udp: m ? finiteNumber(m.udp) : 0,
    online,
    uptime: m ? Math.max(0, Math.floor(finiteNumber(m.uptime))) : 0,
    ping: {},
    pingWindow: undefined,
  }

  return { client, status }
}

export async function fetchAllServers(): Promise<{
  clients: Record<string, Client>
  statuses: Record<string, NodeStatus>
  latestReportUpdates: never[]
  sysConfig?: SysConfig
}> {
  sourceRegistry.clear()
  const response = await request<MonitorNodesResponse>('/api/nodes')
  const clients: Record<string, Client> = {}
  const statuses: Record<string, NodeStatus> = {}
  for (const node of response.nodes ?? []) {
    const adapted = adaptMonitorNode(node)
    clients[adapted.client.uuid] = adapted.client
    statuses[adapted.client.uuid] = adapted.status
  }
  return { clients, statuses, latestReportUpdates: [] }
}

function historyPoints(hours: number): number {
  if (hours <= 1)
    return 120
  if (hours <= 6)
    return 360
  if (hours <= 24)
    return 720
  return 1440
}

export async function fetchHistory(uuid: string, hours = 1): Promise<StatusRecord[]> {
  const source = getServerSource(uuid)
  const points = historyPoints(hours)
  const data = await request<MonitorMetricsResponse>(
    `/api/nodes/${encodeURIComponent(source.serverId)}/metrics?hours=${hours}&points=${points}&series=metrics`,
  )
  const client = clientCache[uuid]
  const totals = totalsCache[uuid]
  return (data.metrics ?? []).map(row => ({
    client: uuid,
    time: new Date((row.ts ?? 0) * 1000).toISOString(),
    cpu: finiteNumber(row.cpu),
    gpu: 0,
    ram: finiteNumber(row.mem_used),
    ram_total: client?.mem_total ?? 0,
    swap: 0,
    swap_total: client?.swap_total ?? 0,
    load: 0,
    load5: 0,
    load15: 0,
    temp: 0,
    disk: finiteNumber(row.disk_used),
    disk_total: client?.disk_total ?? 0,
    net_in: finiteNumber(row.net_rx),
    net_out: finiteNumber(row.net_tx),
    net_total_up: totals?.up ?? 0,
    net_total_down: totals?.down ?? 0,
    net_monthly_up: totals?.monthlyUp ?? 0,
    net_monthly_down: totals?.monthlyDown ?? 0,
    process: 0,
    connections: 0,
    connections_udp: 0,
  }))
}

export interface PingTaskInfo {
  id: number
  key: string
  name: string
  interval: number
  loss: number
}

export async function fetchPingHistory(uuid: string, hours = 1, points?: number): Promise<{
  records: PingRecord[]
  tasks: PingTaskInfo[]
}> {
  const source = getServerSource(uuid)
  const pts = points ?? historyPoints(hours)
  const data = await request<MonitorMetricsResponse>(
    `/api/nodes/${encodeURIComponent(source.serverId)}/metrics?hours=${hours}&points=${pts}&series=ping`,
  )

  const usedKeys = new Set<PingProviderKey>()
  const tasks: PingTaskInfo[] = []
  const probes = data.probes ?? {}
  for (const [id, name] of Object.entries(probes).sort(([a], [b]) => Number(a) - Number(b))) {
    const key = probeProviderKey(String(name), usedKeys)
    tasks.push({
      id: Number(id),
      key,
      name: String(name),
      interval: 60,
      loss: finiteNumber(data.loss?.[id]),
    })
  }

  const records: PingRecord[] = []
  for (const row of data.ping ?? []) {
    const taskId = Number(row.task_id)
    const loss = row.loss == null ? 0 : finiteNumber(row.loss)
    const latency = row.latency == null ? null : finiteNumber(row.latency)
    records.push({
      client: uuid,
      task_id: taskId,
      time: new Date((row.ts ?? 0) * 1000).toISOString(),
      value: latency == null || loss >= 100 ? -1 : latency,
      loss,
    })
  }
  records.sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
  return { records, tasks }
}

/**
 * 首页 ping：取近 1 小时 30 桶（2 分钟一桶）的延迟数据，
 * 按探测算 latest/avg/min/max/loss，并按桶聚合多探测均值给 sparkline。
 */
export async function fetchNodePingSummary(uuid: string): Promise<{
  ping: Record<string, NodeStatusPing>
  window: PingHistoryPoint[]
}> {
  const { records, tasks } = await fetchPingHistory(uuid, 1, 30)

  const ping: Record<string, NodeStatusPing> = {}
  for (const task of tasks) {
    const values = records
      .filter(record => record.task_id === task.id && record.value > 0)
      .map(record => record.value)
    if (!values.length)
      continue
    const latest = values.at(-1)!
    const sum = values.reduce((total, value) => total + value, 0)
    ping[task.key] = {
      name: task.name,
      latest,
      avg: sum / values.length,
      tail: latest,
      loss: task.loss,
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  const buckets = new Map<number, { latencies: number[], losses: number[] }>()
  for (const record of records) {
    const ts = Date.parse(record.time)
    if (!Number.isFinite(ts))
      continue
    const bucket = buckets.get(ts) ?? { latencies: [], losses: [] }
    if (record.value > 0)
      bucket.latencies.push(record.value)
    if (record.loss != null && record.loss >= 0)
      bucket.losses.push(record.loss)
    buckets.set(ts, bucket)
  }
  const average = (values: number[]): number | null =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
  const window: PingHistoryPoint[] = [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ts, bucket]) => ({
      time: new Date(ts).toISOString(),
      latency: average(bucket.latencies),
      loss: average(bucket.losses),
    }))

  return { ping, window }
}

export function buildAdminUrl(): string {
  return `${window.location.origin}/admin`
}

export class CfMonitorApi {
  async getPublicSettings(): Promise<PublicSettings> {
    const configs = cachedSiteConfigs.length ? cachedSiteConfigs : await fetchSiteConfigs()
    const first = configs[0]
    const loggedIn = configs.some(config => config.authorization)
    // monitor 规则：匿名最长 168h，登录后 2160h
    const historyHours = loggedIn ? 2160 : 168
    return {
      allow_cors: true,
      custom_body: '',
      custom_head: '',
      description: '',
      disable_password_login: false,
      oauth_enable: false,
      oauth_provider: null,
      ping_record_preserve_time: historyHours,
      private_site: first ? !enabled(first.is_public) : false,
      record_enabled: true,
      record_preserve_time: historyHours,
      sitename: first?.site_title || 'Monitor',
      theme: 'emerald',
      themeSettings: adaptThemeOptions(await fetchEmeraldThemeConfig()),
    }
  }

  async getMe(): Promise<MeInfo> {
    const configs = cachedSiteConfigs.length ? cachedSiteConfigs : await fetchSiteConfigs()
    return { logged_in: configs.some(config => config.authorization), username: '' }
  }

  async getVersion(): Promise<VersionInfo> {
    return { version: '', hash: '' }
  }
}

let sharedApi: CfMonitorApi | null = null

export function getSharedApi(): CfMonitorApi {
  sharedApi ??= new CfMonitorApi()
  return sharedApi
}

export function resetSharedApi(): void {
  sharedApi = null
}

export { request as cfRequest, enabled as isEnabledValue }

export default CfMonitorApi
