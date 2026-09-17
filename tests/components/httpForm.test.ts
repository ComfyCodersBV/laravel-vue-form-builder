import {describe, expect, it, vi} from 'vitest'
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
})
