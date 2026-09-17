import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {useHttpForm, type HttpFormRequest} from '../../resources/js/composables/useHttpForm'

describe('useHttpForm', () => {
    it('submits only the declared fields', async () => {
        const requests: HttpFormRequest[] = []
        const form = useHttpForm({name: 'Acme', ident: 'ACME'}, {
            submitter: async (request) => {
                requests.push(request)

                return {data: {id: 1}}
            },
        })

        form.name = 'Acme BV'

        await form.put('/brands/1.json')

        expect(requests).toHaveLength(1)
        expect(requests[0].method).toBe('put')
        expect(requests[0].url).toBe('/brands/1.json')
        expect(requests[0].data).toEqual({name: 'Acme BV', ident: 'ACME'})
    })

    it('maps validation errors onto fields and clears them on the next submit', async () => {
        let shouldFail = true

        const form = useHttpForm({name: ''}, {
            submitter: async () => {
                if (shouldFail) {
                    throw {payload: {errors: {name: ['Name is required']}}}
                }

                return {}
            },
        })

        await form.post('/brands.json')
        expect(form.errors.name).toBe('Name is required')

        shouldFail = false
        await form.post('/brands.json')
        expect(form.errors).toEqual({})
    })

    it('reports a non validation failure against the form', async () => {
        const form = useHttpForm({name: ''}, {
            submitter: async () => {
                throw new Error('Request failed with status 500')
            },
        })

        await form.post('/brands.json')

        expect(form.errors.form).toBe('Request failed with status 500')
    })

    it('clears processing whether the request succeeds or fails', async () => {
        const failing = useHttpForm({name: ''}, {
            submitter: async () => {
                throw new Error('boom')
            },
        })

        const promise = failing.post('/brands.json')
        expect(failing.processing).toBe(true)

        await promise
        expect(failing.processing).toBe(false)
    })

    it('restores defaults on reset', async () => {
        const form = useHttpForm({name: 'Acme', ident: 'ACME'})

        form.name = 'Changed'
        form.ident = 'CHANGED'
        form.reset('name')

        expect(form.name).toBe('Acme')
        expect(form.ident).toBe('CHANGED')

        form.reset()
        expect(form.ident).toBe('ACME')
    })

    it('uses a custom error adapter when the api shape differs', async () => {
        const form = useHttpForm({name: ''}, {
            submitter: async () => {
                throw {payload: {data: {errors: {name: {required: 'Verplicht veld'}}}}}
            },
            errorAdapter: (error) => ({
                name: String(Object.values(error.payload.data.errors.name)[0]),
            }),
        })

        await form.post('/brands.json')

        expect(form.errors.name).toBe('Verplicht veld')
    })

    it('restores a nested default instead of the mutated reference', () => {
        const form = useHttpForm({tags: ['one'], meta: {locale: 'nl'}})

        form.tags.push('two')
        form.meta.locale = 'en'
        form.reset()

        expect(form.tags).toEqual(['one'])
        expect(form.meta).toEqual({locale: 'nl'})
    })

    it('refuses a field that would shadow the form api', () => {
        expect(() => useHttpForm({data: 'x'})).toThrow(/field named data/)
        expect(() => useHttpForm({post: 1, errors: 2})).toThrow(/errors, post/)
    })
})

describe('useHttpForm default submitter', () => {
    let calls: Array<{url: string; init: any}> = []

    function stubFetch(payload: unknown = {}, ok = true): void {
        vi.stubGlobal('fetch', async (url: string, init: any) => {
            calls.push({url, init})

            return {ok, status: ok ? 200 : 422, json: async () => payload}
        })
    }

    function forgetCookies(): void {
        document.cookie.split('; ').forEach((cookie) => {
            const name = cookie.split('=')[0]

            if (name) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
            }
        })
    }

    beforeEach(() => {
        calls = []
        forgetCookies()
        document.head.innerHTML = ''
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('sends the xsrf cookie as a header so Laravel does not answer 419', async () => {
        document.cookie = 'XSRF-TOKEN=a%3Db'
        stubFetch()

        await useHttpForm({name: 'Acme'}).post('/brands')

        expect(calls[0].init.headers['X-XSRF-TOKEN']).toBe('a=b')
        expect(calls[0].init.credentials).toBe('same-origin')
        expect(calls[0].init.headers['X-Requested-With']).toBe('XMLHttpRequest')
    })

    it('falls back to the csrf meta tag when no cookie is set', async () => {
        document.head.innerHTML = '<meta name="csrf-token" content="from-meta">'
        stubFetch()

        await useHttpForm({name: 'Acme'}).post('/brands')

        expect(calls[0].init.headers['X-CSRF-TOKEN']).toBe('from-meta')
        expect(calls[0].init.headers['X-XSRF-TOKEN']).toBeUndefined()
    })

    it('sends a file as multipart and spoofs the method Laravel cannot read from a body', async () => {
        stubFetch()

        await useHttpForm({name: 'Acme', logo: new File(['x'], 'logo.png'), active: true}).put('/brands/1')

        const {init} = calls[0]

        expect(init.method).toBe('POST')
        expect(init.body).toBeInstanceOf(FormData)
        expect(init.headers['Content-Type']).toBeUndefined()
        expect((init.body as FormData).get('_method')).toBe('PUT')
        expect((init.body as FormData).get('active')).toBe('1')
        expect(((init.body as FormData).get('logo') as File).name).toBe('logo.png')
    })

    it('keeps sending json when no file is involved', async () => {
        stubFetch()

        await useHttpForm({name: 'Acme'}).put('/brands/1')

        expect(calls[0].init.method).toBe('PUT')
        expect(calls[0].init.headers['Content-Type']).toBe('application/json')
        expect(calls[0].init.body).toBe('{"name":"Acme"}')
    })

    it('spreads nested get parameters instead of stringifying them', async () => {
        stubFetch()

        await useHttpForm({filters: {status: ['open', 'closed']}, page: 2, empty: ''}).get('/brands')

        const query = decodeURIComponent(new URL(calls[0].url).search)

        expect(query).toContain('filters[status][0]=open')
        expect(query).toContain('filters[status][1]=closed')
        expect(query).toContain('page=2')
        expect(query).not.toContain('empty')
        expect(calls[0].init.body).toBeUndefined()
    })

    it('reports the message the api sent along with a failing status', async () => {
        stubFetch({message: 'Brand is locked'}, false)

        const form = useHttpForm({name: 'Acme'})
        await form.post('/brands')

        expect(form.errors.form).toBe('Brand is locked')
    })
})
