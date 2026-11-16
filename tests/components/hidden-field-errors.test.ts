import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Form from '../../resources/js/components/Form.vue'

const schemaWith = (fields: Record<string, unknown>[], defaults: Record<string, unknown> = {}) => ({
    schemaVersion: '1.19',
    id: 'closure',
    action: '/closures',
    method: 'post',
    defaults,
    fields,
})

const allRooms = { name: 'all_rooms', type: 'checkbox', value: '1', falseValue: '0', label: 'All rooms' }

const rooms = { name: 'rooms', type: 'checkboxes', label: 'Rooms', options: { 1: 'Hall' }, condition: '!all_rooms' }

const formOf = (wrapper: ReturnType<typeof mount>): any => (wrapper.vm as any).form

async function mountWithError(fields: Record<string, unknown>[], defaults: Record<string, unknown>, errors: Record<string, string>) {
    const wrapper = mount(Form, { props: { schema: schemaWith(fields, defaults) } })

    formOf(wrapper).setError(errors)
    await nextTick()

    return wrapper
}

describe('errors of fields that are not visible', () => {
    it('shows the error of a field hidden by a condition above the form with its label', async () => {
        const wrapper = await mountWithError([allRooms, rooms], { all_rooms: '1' }, { rooms: 'The rooms field must be an array.' })

        expect(wrapper.find('[data-form-errors]').text()).toBe('Rooms: The rooms field must be an array.')
        expect((wrapper.vm as any).formErrors).toEqual({ rooms: 'Rooms: The rooms field must be an array.' })
    })

    it('shows the error of an element of a hidden field above the form', async () => {
        const wrapper = await mountWithError([allRooms, rooms], { all_rooms: '1' }, { 'rooms.0': 'The selected room is invalid.' })

        expect(wrapper.find('[data-form-errors]').text()).toBe('Rooms: The selected room is invalid.')
    })

    it('shows the error of a field hidden by a field and value condition above the form', async () => {
        const reason = { name: 'reason', type: 'text', label: 'Reason', when: { field: 'all_rooms', values: ['0'] } }
        const wrapper = await mountWithError([allRooms, reason], { all_rooms: '1' }, { reason: 'The reason is required.' })

        expect(wrapper.find('[data-form-errors]').text()).toBe('Reason: The reason is required.')
    })

    it('shows the error of a field inside a hidden section above the form', async () => {
        const section = { type: 'section', label: 'Rooms', condition: '!all_rooms', fields: [{ name: 'note', type: 'text', label: 'Note' }] }
        const wrapper = await mountWithError([allRooms, section], { all_rooms: '1' }, { note: 'The note is too long.' })

        expect(wrapper.find('[data-form-errors]').text()).toBe('Note: The note is too long.')
    })

    it('shows the message alone when the hidden field has no label', async () => {
        const wrapper = await mountWithError([allRooms, { ...rooms, label: undefined }], { all_rooms: '1' }, { rooms: 'Pick a room.' })

        expect(wrapper.find('[data-form-errors]').text()).toBe('Pick a room.')
    })

    it('leaves the error of a visible field under that field only', async () => {
        const wrapper = await mountWithError([allRooms, rooms], { all_rooms: '0' }, { rooms: 'Pick a room.' })

        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
        expect(wrapper.text()).toContain('Pick a room.')
    })

    it('moves the error under the field once the field is shown', async () => {
        const wrapper = await mountWithError([allRooms, rooms], { all_rooms: '1' }, { rooms: 'Pick a room.' })

        formOf(wrapper).all_rooms = '0'
        await nextTick()

        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
        expect(wrapper.text()).toContain('Pick a room.')
    })

    it('leaves the error of a field on another wizard step to the wizard', async () => {
        const steps = [
            { type: 'step', name: 'first', label: 'First', fields: [{ name: 'title', type: 'text', label: 'Title' }] },
            { type: 'step', name: 'second', label: 'Second', fields: [{ name: 'notes', type: 'text', label: 'Notes' }] },
        ]
        const wrapper = await mountWithError(steps, {}, { notes: 'The notes are required.' })

        expect(wrapper.find('[data-form-errors]').exists()).toBe(false)
    })

    it('shows the error of a field on a hidden wizard step above the form', async () => {
        const steps = [
            { type: 'step', name: 'first', label: 'First', fields: [allRooms] },
            { type: 'step', name: 'second', label: 'Second', condition: '!all_rooms', fields: [rooms] },
            { type: 'step', name: 'third', label: 'Third', fields: [{ name: 'title', type: 'text', label: 'Title' }] },
        ]
        const wrapper = await mountWithError(steps, { all_rooms: '1' }, { rooms: 'Pick a room.' })

        expect(wrapper.find('[data-form-errors]').text()).toBe('Rooms: Pick a room.')
    })
})
