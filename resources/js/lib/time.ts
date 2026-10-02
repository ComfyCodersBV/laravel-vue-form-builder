export const MINUTES_PER_DAY = 1440;

export interface NormalizedTime {
    valid: boolean;
    value: string | null;
}

const pad = (value: number): string => String(value).padStart(2, '0');

export function formatMinutes(minutes: number): string {
    const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

    return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}

export function minutesOf(time: string | null | undefined): number | null {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time ?? '');

    if (!match) {
        return null;
    }

    return Number(match[1]) * 60 + Number(match[2]);
}

function splitTime(text: string): [number, number] | null {
    const separated = /^(\d{1,2})[:.,](\d{2})$/.exec(text);

    if (separated) {
        return [Number(separated[1]), Number(separated[2])];
    }

    if (!/^\d{1,4}$/.test(text)) {
        return null;
    }

    if (text.length <= 2) {
        return [Number(text), 0];
    }

    return [Number(text.slice(0, -2)), Number(text.slice(-2))];
}

export function normalizeTime(input: string | null | undefined): NormalizedTime {
    const text = (input ?? '').trim();

    if (text === '') {
        return { valid: true, value: null };
    }

    const parts = splitTime(text);

    if (!parts || parts[0] > 23 || parts[1] > 59) {
        return { valid: false, value: null };
    }

    return { valid: true, value: formatMinutes(parts[0] * 60 + parts[1]) };
}

export function clampStep(step: number | string | null | undefined): number {
    const minutes = Math.floor(Number(step));

    if (!Number.isFinite(minutes) || minutes < 1) {
        return 15;
    }

    return Math.min(minutes, 720);
}

export function buildTimeSlots(step?: number | string | null, min?: string | null, max?: string | null): string[] {
    const interval = clampStep(step);
    const first = minutesOf(min) ?? 0;
    const last = minutesOf(max) ?? MINUTES_PER_DAY - 1;
    const slots: string[] = [];

    for (let minutes = first; minutes <= last; minutes += interval) {
        slots.push(formatMinutes(minutes));
    }

    return slots;
}

export function closestSlotIndex(slots: string[], minutes: number): number {
    return slots.reduce((closest, slot, index) => {
        const distance = Math.abs((minutesOf(slot) ?? 0) - minutes);
        const closestDistance = closest === -1 ? Infinity : Math.abs((minutesOf(slots[closest]) ?? 0) - minutes);

        return distance < closestDistance ? index : closest;
    }, -1);
}

export function stepTime(slots: string[], current: number, direction: 1 | -1): string | null {
    if (!slots.length) {
        return null;
    }

    if (direction === 1) {
        return slots.find((slot) => (minutesOf(slot) ?? 0) > current) ?? slots[0];
    }

    return [...slots].reverse().find((slot) => (minutesOf(slot) ?? 0) < current) ?? slots[slots.length - 1];
}

export function currentMinutes(now: Date = new Date()): number {
    return now.getHours() * 60 + now.getMinutes();
}
