import { csrfHeaders } from '../composables/useHttpForm'

export type StepValidation =
    | { status: 'valid' }
    | { status: 'invalid'; errors: Record<string, string> }
    | { status: 'failed' }

function firstMessages(errors: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(errors).map(([key, message]) => [key, Array.isArray(message) ? String(message[0]) : String(message)]),
    )
}

export async function validatePrecognitively(method: string, url: string, data: Record<string, any>, only: string[]): Promise<StepValidation> {
    if (method.toLowerCase() === 'get') {
        return { status: 'valid' }
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                Precognition: 'true',
                'Precognition-Validate-Only': only.join(','),
                ...csrfHeaders(),
            },
            body: JSON.stringify({ ...data, _method: method.toUpperCase() }),
        })

        if (response.status === 204 && response.headers.get('Precognition') === 'true') {
            return { status: 'valid' }
        }

        if (response.status === 422) {
            const body = await response.json()

            return { status: 'invalid', errors: firstMessages(body?.errors ?? {}) }
        }

        return { status: 'failed' }
    } catch {
        return { status: 'failed' }
    }
}
