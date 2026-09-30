<script setup lang="ts">
import type { NodeData } from '@/stores/nodes'
import { computed } from 'vue'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { buildTopPingNetworks, useNodePingDisplay } from '@/composables/useNodePingDisplay'
import { useNodesStore } from '@/stores/nodes'

const props = defineProps<{ node: NodeData }>()

const nodesStore = useNodesStore()
const { latencyRenderBars, lossRenderBars } = useNodePingDisplay(props.node.uuid)
const topPingNetworks = computed(() => buildTopPingNetworks(props.node.ping))
</script>

<template>
  <div class="flex min-w-0 w-full flex-col">
    <div v-if="topPingNetworks.length > 0" class="flex flex-row">
      <DataTooltip
        v-for="(net, index) in topPingNetworks" :key="net.key" placement="top"
        :content="net.tooltip"
        content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
      >
        <div class="truncate text-[10px]">
          <span v-if="index" class="mx-1">·</span>
          <span :class="net.toneClass">{{ net.latency }}</span>
        </div>
      </DataTooltip>
    </div>
    <div v-else class="truncate">
      N/A
    </div>
    <template v-if="nodesStore.showThreeNetDetails">
      <div class="flex w-full flex-col gap-[1px] pr-4">
        <div class="relative items-center gap-1">
          <div
            class="grid h-1 cursor-auto items-end gap-[1px] transition-all hover:h-2.5"
            :style="{ gridTemplateColumns: `repeat(${latencyRenderBars.length}, minmax(0, 1fr))` }"
          >
            <DataTooltip
              v-for="bar in latencyRenderBars" :key="bar.key" placement="top"
              :content="bar.tooltip" class="h-full w-full"
              content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
            >
              <span
                class="block h-full w-full rounded-[1px] transition-all hover:scale-y-160"
                :class="bar.className"
              />
            </DataTooltip>
          </div>
        </div>
        <div class="relative items-center gap-1">
          <div
            class="grid h-1 cursor-auto items-end gap-[1px] transition-all hover:h-2.5"
            :style="{ gridTemplateColumns: `repeat(${lossRenderBars.length}, minmax(0, 1fr))` }"
          >
            <DataTooltip
              v-for="bar in lossRenderBars" :key="bar.key" placement="top"
              :content="bar.tooltip" class="h-full w-full"
              content-class="whitespace-pre-wrap w-max px-1.5 !leading-[1.2] text-[11px]"
            >
              <span
                class="block h-full w-full rounded-[1px] transition-all hover:scale-y-160"
                :class="bar.className"
              />
            </DataTooltip>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
