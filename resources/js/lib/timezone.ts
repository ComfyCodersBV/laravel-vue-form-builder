export const BROWSER_TIMEZONE = 'browser';

export interface WallClock {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
}

const OFFSET_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;

export function resolveTimezone(timezone?: string | null): string | null {
    if (!timezone) {
        return null;
    }

    if (timezone === BROWSER_TIMEZONE) {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    return timezone;
}

export function carriesOffset(value: string): boolean {
    return value.includes('T') && OFFSET_PATTERN.test(value.trim());
}

export function wallClockAt(instant: Date, timezone: string): WallClock {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).formatToParts(instant);

    const part = (type: string) => Number(parts.find((item) => item.type === type)?.value ?? 0);

    return {
        year: part('year'),
        month: part('month'),
        day: part('day'),
        hour: part('hour') % 24,
        minute: part('minute'),
    };
}

export function offsetMinutes(instant: Date, timezone: string): number {
    const wall = wallClockAt(instant, timezone);
    const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
    const truncated = Math.floor(instant.getTime() / 60000) * 60000;

    return Math.round((asUtc - truncated) / 60000);
}

export function instantOf(wall: WallClock, timezone: string): Date {
    const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
    const first = guess - offsetMinutes(new Date(guess), timezone) * 60000;
    const second = guess - offsetMinutes(new Date(first), timezone) * 60000;

    return new Date(second);
}

function pad(value: number): string {
    return String(Math.abs(value)).padStart(2, '0');
}

export function formatOffset(minutes: number): string {
    const sign = minutes < 0 ? '-' : '+';

    return `${sign}${pad(Math.trunc(minutes / 60))}:${pad(minutes % 60)}`;
}

export function toZonedIso(wall: WallClock, timezone: string): string {
    const offset = offsetMinutes(instantOf(wall, timezone), timezone);

    return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}:00${formatOffset(offset)}`;
}

export function wallClockOfDate(date: Date): WallClock {
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
    };
}

export function dateOfWallClock(wall: WallClock): Date {
    return new Date(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
}

export function parseWallClock(value: string): WallClock | null {
    const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);

    if (!match) {
        return null;
    }

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4] ?? 0),
        minute: Number(match[5] ?? 0),
    };
}

export function toDisplayWallClock(value: string, timezone: string, serverTimezone?: string | null): WallClock | null {
    if (carriesOffset(value)) {
        const instant = new Date(value);

        return Number.isNaN(instant.getTime()) ? null : wallClockAt(instant, timezone);
    }

    const wall = parseWallClock(value);

    if (!wall || !serverTimezone) {
        return wall;
    }

    return wallClockAt(instantOf(wall, serverTimezone), timezone);
}
