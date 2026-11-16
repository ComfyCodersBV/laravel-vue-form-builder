import type { InjectionKey } from 'vue'

export interface ButtonEventPayload {
    field?: string
    form: any
    row?: Record<string, any>
}

export type ButtonEventHandler = (event: string, field: string | undefined, values: any) => void

export const buttonEventKey: InjectionKey<ButtonEventHandler> = Symbol('form-builder-button-event')
