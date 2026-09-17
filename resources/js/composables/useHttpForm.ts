import {reactive} from 'vue'

export type HttpFormMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface HttpFormRequest {
    method: HttpFormMethod
    url: string
    data: Record<string, any>
}

export type HttpFormSubmitter = (request: HttpFormRequest) => Promise<unknown>

export type HttpFormErrorAdapter = (error: any) => Record<string, string>

export interface HttpFormOptions {
    submitter?: HttpFormSubmitter
    errorAdapter?: HttpFormErrorAdapter
}

export interface HttpFormCallbacks {
    onSuccess?: (response: unknown) => void
    onError?: (errors: Record<string, string>) => void
    onFinish?: () => void
}

const defaultSubmitter: HttpFormSubmitter = async ({method, url, data}) => {
    const target = new URL(url, window.location.origin)

    if (method === 'get') {
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                target.searchParams.set(key, String(value))
            }
        })
    }

    const response = await fetch(target.toString(), {
        method: method.toUpperCase(),
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        ...(method === 'get' ? {} : {body: JSON.stringify(data)}),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
        throw Object.assign(new Error(`Request failed with status ${response.status}`), {
            status: response.status,
            payload,
        })
    }

    return payload
}

const defaultErrorAdapter: HttpFormErrorAdapter = (error) => {
    const payload = error?.payload ?? error?.response?.data ?? error

    const errors = payload?.errors ?? payload?.data?.errors

    if (!errors) {
        return {form: error instanceof Error ? error.message : String(error)}
    }

    return Object.fromEntries(
        Object.entries(errors as Record<string, any>).map(([field, messages]) => [
            field,
            Array.isArray(messages)
                ? String(messages[0])
                : typeof messages === 'object' && messages !== null
                    ? String(Object.values(messages)[0])
                    : String(messages),
        ])
    )
}

export function useHttpForm(initial: Record<string, any>, options: HttpFormOptions = {}) {
    const defaults = {...initial}

    const form = reactive({
        ...initial,
        errors: {} as Record<string, string>,
        processing: false,
        recentlySuccessful: false,

        data(): Record<string, any> {
            return Object.fromEntries(Object.keys(defaults).map((key) => [key, (form as any)[key]]))
        },

        reset(...fields: string[]): void {
            const keys = fields.length > 0 ? fields : Object.keys(defaults)

            keys.forEach((key) => {
                ;(form as any)[key] = defaults[key]
            })
        },

        clearErrors(): void {
            form.errors = {}
        },

        submit(method: HttpFormMethod, url: string, callbacks: HttpFormCallbacks = {}): Promise<void> {
            const submitter = options.submitter ?? defaultSubmitter
            const errorAdapter = options.errorAdapter ?? defaultErrorAdapter

            form.processing = true
            form.errors = {}
            form.recentlySuccessful = false

            return submitter({method, url, data: form.data()})
                .then((response) => {
                    form.recentlySuccessful = true
                    callbacks.onSuccess?.(response)
                })
                .catch((exception) => {
                    form.errors = errorAdapter(exception)
                    callbacks.onError?.(form.errors)
                })
                .finally(() => {
                    form.processing = false
                    callbacks.onFinish?.()
                })
        },

        get(url: string, callbacks?: HttpFormCallbacks) {
            return form.submit('get', url, callbacks)
        },
        post(url: string, callbacks?: HttpFormCallbacks) {
            return form.submit('post', url, callbacks)
        },
        put(url: string, callbacks?: HttpFormCallbacks) {
            return form.submit('put', url, callbacks)
        },
        patch(url: string, callbacks?: HttpFormCallbacks) {
            return form.submit('patch', url, callbacks)
        },
        delete(url: string, callbacks?: HttpFormCallbacks) {
            return form.submit('delete', url, callbacks)
        },
    })

    return form
}
