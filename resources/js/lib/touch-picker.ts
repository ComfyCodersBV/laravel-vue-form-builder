import { useMediaQuery } from '@vueuse/core'
import type { Ref } from 'vue'

export const ANCHORED_PICKER_QUERY = '(min-width: 640px) and (pointer: fine), (min-width: 640px) and (pointer: none)'

export function useAnchoredPicker(): Ref<boolean> {
  return useMediaQuery(ANCHORED_PICKER_QUERY)
}

export function padTime(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}
