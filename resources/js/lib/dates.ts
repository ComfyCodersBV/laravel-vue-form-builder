export type DisabledDate = string | { from?: string; to?: string };

function pad(value: number): string {
    return value < 10 ? `0${value}` : String(value);
}

export function calendarDateOf(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function leadingDate(value: string | undefined): string | null {
    const match = typeof value === 'string' ? /^\d{4}-\d{2}-\d{2}/.exec(value) : null;

    return match ? match[0] : null;
}

function matches(day: string, disabled: DisabledDate): boolean {
    if (typeof disabled === 'string') {
        return leadingDate(disabled) === day;
    }

    const from = leadingDate(disabled.from);
    const to = leadingDate(disabled.to);

    if (!from && !to) {
        return false;
    }

    return (!from || day >= from) && (!to || day <= to);
}

export function isUnavailableDate(date: Date, weekdays: number[] = [], dates: DisabledDate[] = []): boolean {
    if (weekdays.includes(date.getDay())) {
        return true;
    }

    const day = calendarDateOf(date);

    return dates.some((disabled) => matches(day, disabled));
}
