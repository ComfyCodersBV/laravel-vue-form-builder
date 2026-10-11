import type { InjectionKey, Ref } from 'vue';

export type FormLayout = 'stacked' | 'horizontal';

export const layoutKey: InjectionKey<Ref<FormLayout>> = Symbol('form-builder-layout');

export const columnsKey: InjectionKey<Ref<1 | 2>> = Symbol('form-builder-columns');
