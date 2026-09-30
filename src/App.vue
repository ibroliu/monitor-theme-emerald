<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { useAppStore } from '@/stores/app'
import { CorsError } from '@/utils/api'
import { destroyInitManager, initApp } from '@/utils/init'
import Background from './components/Background.vue'
import Footer from './components/Footer.vue'
import Header from './components/Header.vue'
import LoadingCover from './components/LoadingCover.vue'
import Provider from './components/Provider.vue'

const appStore = useAppStore()

const isReady = ref(false)
const corsDialogOpen = ref(false)
const corsAllowedOrigin = ref('')

onMounted(async () => {
  try {
    await initApp()
    await nextTick()
    isReady.value = true
  }
  catch (error) {
    console.error('[App] Initialization failed:', error)
    if (error instanceof CorsError) {
      corsAllowedOrigin.value = error.origin
      corsDialogOpen.value = true
    }
    isReady.value = true
  }
})

onUnmounted(() => {
  destroyInitManager()
})
</script>

<template>
  <Provider>
    <Background />
    <LoadingCover v-if="appStore.loading" />
    <Header />
    <main v-if="!appStore.loading" class="flex-1">
      <div class="max-w-[1280px] mx-auto">
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="['HomeView']">
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      </div>
    </main>
    <Footer v-if="!appStore.loading" />
    <Toaster rich-colors close-button position="top-center" />
    <Dialog v-model:open="corsDialogOpen">
      <DialogContent class="max-w-xl">
        <DialogHeader>
          <DialogTitle>最后一步</DialogTitle>
          <DialogDescription class="leading-6">
            <p>当前页面无法访问 Monitor 后端。</p>
            <p>纯静态部署时需要前往后端的环境变量配置 <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">CORS_ALLOWED_ORIGINS</code></p>
          </DialogDescription>
        </DialogHeader>
        <div class="rounded-md border bg-muted/50 p-3 font-mono text-sm break-all text-foreground text-nowrap overflow-auto">
          CORS_ALLOWED_ORIGINS={{ corsAllowedOrigin }}
        </div>
        <DialogDescription class="leading-6">
          支持使用英文逗号分隔多个域名，例如：
          <code class="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">https://a.com,https://b.com</code>
        </DialogDescription>
        <DialogFooter>
          <Button type="button" @click="corsDialogOpen = false">
            我知道了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Provider>
</template>
