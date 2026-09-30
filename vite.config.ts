import { execSync } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { defineConfig, loadEnv } from 'vite'

function getCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  }
  catch {
    return 'unknown'
  }
}

function splitList(value: string | undefined): string[] {
  return value?.split(',').map(item => item.trim()).filter(Boolean) ?? []
}

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol))
      return null
    return url.origin
  }
  catch {
    return null
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBases = splitList(env.API_BASE).map(normalizeOrigin).filter((value): value is string => Boolean(value))
  const outboundProxy = env.HTTPS_PROXY || env.HTTP_PROXY
  const outboundProxyAgent = outboundProxy ? new HttpsProxyAgent(outboundProxy) : undefined

  return {
    base: env.BASE_PATH || './',
    define: {
      __BUILD_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_GIT_HASH__: JSON.stringify(getCommitHash()),
    },
    plugins: [
      vue(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      proxy: env.API_BASE && apiBases.length === 1
        ? {
            '/api': {
              target: apiBases[0],
              changeOrigin: true,
              ws: true,
              agent: outboundProxyAgent,
            },
            '^/(flags|os-icons|favicon.ico)': {
              target: apiBases[0],
              changeOrigin: true,
              agent: outboundProxyAgent,
              configure(proxy) {
                proxy.on('proxyRes', (response) => {
                  if (response.statusCode && response.statusCode >= 200 && response.statusCode < 400)
                    response.headers['cache-control'] = 'public, max-age=31536000, immutable'
                })
              },
            },
          }
        : undefined,
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'echarts': ['echarts', 'vue-echarts'],
            'reka-ui': ['reka-ui'],
            'vueuse': ['@vueuse/core'],
          },
        },
      },
    },
  }
})
