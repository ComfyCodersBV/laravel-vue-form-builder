import { router, usePage } from '@inertiajs/vue3'

export function withoutParam(search: string, param?: string): string {
    if (!param) {
        return search
    }

    const query = new URLSearchParams(search)

    if (!query.has(param)) {
        return search
    }

    query.delete(param)

    const rest = query.toString()

    return rest === '' ? '' : `?${rest}`
}

export function readStepParam(param?: string): string | undefined {
    if (!param || typeof window === 'undefined') {
        return undefined
    }

    const value = new URLSearchParams(window.location.search).get(param)

    return value === null || value === '' ? undefined : value
}

function urlWithStep(param: string, step: string): string {
    const query = new URLSearchParams(window.location.search)

    query.set(param, step)

    return `${window.location.pathname}?${query.toString()}${window.location.hash}`
}

export function useStepParamWriter(): (param: string, step: string) => void {
    const page = usePage()

    return (param: string, step: string) => {
        if (typeof window === 'undefined' || readStepParam(param) === step) {
            return
        }

        const url = urlWithStep(param, step)

        if (!page.component) {
            window.history.replaceState(window.history.state, '', url)

            return
        }

        router.replace({
            url,
            preserveState: true,
            preserveScroll: true,
            ...(page.flash && typeof page.flash === 'object' ? { flash: { ...page.flash } } : {}),
        })
    }
}
