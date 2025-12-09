import { InertiaLinkProps } from '@inertiajs/vue3';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return value === 1;
    }

    if (typeof value === 'string') {
        const stringValue = value.trim().toLowerCase();
        return (
            stringValue === '1' ||
            stringValue === 'true' ||
            stringValue === 'on' ||
            stringValue === 'yes'
        );
    }

    return false;
}
