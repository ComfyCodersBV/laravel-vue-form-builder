<script setup lang="ts">
import { useId } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../dialog/index'
import { Popover, PopoverContent, PopoverTrigger } from '../popover/index'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  anchored: boolean
  description: string
}>()

const open = defineModel<boolean>('open', { default: false })

const titleId = useId()

const sheetClass = 'top-auto bottom-0 max-h-[92dvh] translate-y-0 gap-3 overflow-y-auto rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] data-[state=closed]:slide-out-to-top-[100%] data-[state=open]:slide-in-from-top-[100%] sm:top-1/2 sm:bottom-auto sm:max-w-md sm:-translate-y-1/2 sm:rounded-lg dark:text-neutral-100'
const popoverClass = 'grid w-80 max-h-[var(--reka-popover-content-available-height)] gap-2 overflow-y-auto p-3'
</script>

<template>
  <Popover v-if="props.anchored" v-model:open="open">
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverContent
      align="start"
      :class="popoverClass"
      :aria-labelledby="titleId"
      v-bind="$attrs"
      data-touch-anchored
    >
      <div :id="titleId" class="text-sm font-semibold">
        <slot name="title" />
      </div>
      <slot />
    </PopoverContent>
  </Popover>

  <Dialog v-else v-model:open="open">
    <DialogTrigger as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogContent :class="sheetClass" v-bind="$attrs" data-touch-sheet>
      <DialogTitle class="text-lg">
        <slot name="title" />
      </DialogTitle>
      <DialogDescription class="sr-only">{{ props.description }}</DialogDescription>
      <slot />
    </DialogContent>
  </Dialog>
</template>
