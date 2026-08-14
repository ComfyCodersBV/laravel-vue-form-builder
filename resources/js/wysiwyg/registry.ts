import type { Component } from 'vue';

const editors = new Map<string, Component>();

export const registerWysiwygEditor = (key: string, component: Component): void => {
    editors.set(key, component);
};

export const resolveWysiwygEditor = (key: string): Component | undefined => editors.get(key);

export const registeredWysiwygEditors = (): string[] => [...editors.keys()];
