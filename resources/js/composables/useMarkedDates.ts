import { computed, ref } from 'vue'
import { fetchMarkedDates, markedDateOn, type MarkedDate, type MarkedDateSource } from '../lib/marked-dates'

export function useMarkedDates(source: () => MarkedDateSource): {
    load: () => Promise<void>
    markOf: (date: Date) => MarkedDate | null
} {
    const fetched = ref<MarkedDate[]>([])
    const all = computed(() => [...(source().markedDates ?? []), ...fetched.value])

    async function load(): Promise<void> {
        const url = source().markedDatesUrl

        if (!url) {
            return
        }

        try {
            fetched.value = await fetchMarkedDates(url)
        } catch (error) {
            fetched.value = []
            console.warn('[form-builder] Could not load the marked dates, the picker tries again when it opens.', error)
        }
    }

    return {
        load,
        markOf: (date: Date) => markedDateOn(date, all.value),
    }
}
