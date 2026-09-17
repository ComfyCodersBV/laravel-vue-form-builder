import { reactive } from 'vue'

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

export const RESERVED_FIELD_NAMES = [
    'clearErrors',
    'data',
    'delete',
    'errors',
    'get',
    'patch',
    'post',
    'processing',
    'put',
    'recentlySuccessful',
    'reset',
    'submit',
]

const RECENTLY_SUCCESSFUL_TIMEOUT = 2000

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') {
        return null
    }

    const match = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`))

    return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

function readMetaContent(name: string): string | null {
    if (typeof document === 'undefined') {
        return null
    }

    return document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? null
}

function csrfHeaders(): Record<string, string> {
    const cookieToken = readCookie('XSRF-TOKEN')

    if (cookieToken) {
        return { 'X-XSRF-TOKEN': cookieToken }
    }

    const metaToken = readMetaContent('csrf-token')

    return metaToken ? { 'X-CSRF-TOKEN': metaToken } : {}
}

function isFileLike(value: any): boolean {
    return (typeof File !== 'undefined' && value instanceof File)
        || (typeof Blob !== 'undefined' && value instanceof Blob)
        || (typeof FileList !== 'undefined' && value instanceof FileList)
}

function carriesFiles(value: any): boolean {
    if (isFileLike(value)) {
        return true
    }

    if (Array.isArray(value)) {
        return value.some(carriesFiles)
    }

    if (value !== null && typeof value === 'object') {
        return Object.values(value).some(carriesFiles)
    }

    return false
}

function eachEntry(key: string, value: any, visit: (key: string, value: any) => void): void {
    if (typeof value === 'undefined') {
        return
    }

    if (isFileLike(value) && typeof FileList !== 'undefined' && value instanceof FileList) {
        Array.from(value).forEach((file, index) => visit(`${key}[${index}]`, file))
        return
    }

    if (isFileLike(value) || value instanceof Date) {
        visit(key, value)
        return
    }

    if (Array.isArray(value)) {
        value.forEach((item, index) => eachEntry(`${key}[${index}]`, item, visit))
        return
    }

    if (value !== null && typeof value === 'object') {
        Object.entries(value).forEach(([nested, item]) => eachEntry(`${key}[${nested}]`, item, visit))
        return
    }

    visit(key, value)
}

function toQuery(target: URL, data: Record<string, any>): void {
    Object.entries(data).forEach(([key, value]) => {
        if (value === null || typeof value === 'undefined' || value === '') {
            return
        }

        eachEntry(key, value, (name, item) => {
            if (item === null) {
                return
            }

            target.searchParams.append(name, item instanceof Date ? item.toISOString() : String(item))
        })
    })
}

function toFormData(data: Record<string, any>, method: HttpFormMethod): FormData {
    const body = new FormData()

    Object.entries(data).forEach(([key, value]) => {
        eachEntry(key, value, (name, item) => {
            if (item === null) {
                body.append(name, '')
                return
            }

            if (isFileLike(item)) {
                body.append(name, item as Blob)
                return
            }

            if (typeof item === 'boolean') {
                body.append(name, item ? '1' : '0')
                return
            }

            body.append(name, item instanceof Date ? item.toISOString() : String(item))
        })
    })

    if (method !== 'post') {
        body.append('_method', method.toUpperCase())
    }

    return body
}

const defaultSubmitter: HttpFormSubmitter = async ({ method, url, data }) => {
    const target = new URL(url, window.location.origin)

    if (method === 'get') {
        toQuery(target, data)
    }

    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...csrfHeaders(),
    }

    const multipart = method !== 'get' && carriesFiles(data)

    if (method !== 'get' && !multipart) {
        headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(target.toString(), {
        method: multipart ? 'POST' : method.toUpperCase(),
        credentials: 'same-origin',
        headers,
        ...(method === 'get'
            ? {}
            : { body: multipart ? toFormData(data, method) : JSON.stringify(data) }),
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
        const message = payload?.message
            ?? (error instanceof Error ? error.message : String(error))

        return { form: String(message) }
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

function clone<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((item) => clone(item)) as unknown as T
    }

    if (value !== null && typeof value === 'object' && !isFileLike(value) && !(value instanceof Date)) {
        return Object.fromEntries(
            Object.entries(value as Record<string, any>).map(([key, item]) => [key, clone(item)])
        ) as unknown as T
    }

    return value
}

export function useHttpForm(initial: Record<string, any>, options: HttpFormOptions = {}) {
    const collisions = Object.keys(initial).filter((key) => RESERVED_FIELD_NAMES.includes(key)).sort()

    if (collisions.length > 0) {
        throw new Error(
            `useHttpForm cannot hold a field named ${collisions.join(', ')}: the name is part of the form API. `
            + `Rename the field or submit it through a custom submitter.`
        )
    }

    const defaults = clone(initial)

    let successTimeout: ReturnType<typeof setTimeout> | undefined

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
                ;(form as any)[key] = clone(defaults[key])
            })
        },

        clearErrors(): void {
            form.errors = {}
        },

        submit(method: HttpFormMethod, url: string, callbacks: HttpFormCallbacks = {}): Promise<void> {
            const submitter = options.submitter ?? defaultSubmitter
            const errorAdapter = options.errorAdapter ?? defaultErrorAdapter

            clearTimeout(successTimeout)

            form.processing = true
            form.errors = {}
            form.recentlySuccessful = false

            return submitter({ method, url, data: form.data() })
                .then((response) => {
                    form.recentlySuccessful = true
                    successTimeout = setTimeout(() => {
                        form.recentlySuccessful = false
                    }, RECENTLY_SUCCESSFUL_TIMEOUT)

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
