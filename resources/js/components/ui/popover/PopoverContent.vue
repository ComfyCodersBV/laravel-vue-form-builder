<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { cn } from '../../../lib/utils'
import { PopoverArrow, PopoverContent, type PopoverContentEmits, type PopoverContentProps, PopoverPortal, useForwardPropsEmits } from 'reka-ui'

defineOptions({ inheritAttrs: false })

const props = defineProps<PopoverContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<PopoverContentEmits>()

const delegated = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegated, emits)

function resolvePortalTarget(): HTMLElement | string {
  if (typeof document === 'undefined') {
    return 'body'
  }

  const wrappers = document.querySelectorAll('[data-inertiaui-modal-id] [role="dialog"][aria-modal="true"]')

  return wrappers.length ? wrappers[wrappers.length - 1] as HTMLElement : 'body'
}

const portalTarget = ref<HTMLElement | string>('body')

onMounted(() => {
  portalTarget.value = resolvePortalTarget()
})
</script>

<template>
  <PopoverPortal :to="portalTarget">
    <PopoverContent
      data-slot="popover-content"
      v-bind="{ ...forwarded, ...$attrs }"
      :class="cn('z-50 w-auto rounded-md border bg-popover p-2 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2', props.class)"
      @focus-outside.prevent
    >
      <slot />
      <PopoverArrow class="fill-popover stroke-border" />
    </PopoverContent>
  </PopoverPortal>
</template>
