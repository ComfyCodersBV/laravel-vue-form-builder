const TOKEN_PATTERN = /\[([^\]]*)]|YYYY|YY|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|m{1,2}|s{1,2}|SSS|A|a/g;

const HOUR_TOKEN = /^(H{1,2}|h{1,2})$/;

type Token = { literal: string } | { token: string };

function pad(value: number, length = 2): string {
    return String(value).padStart(length, '0');
}

function tokenize(format: string): Token[] {
    const tokens: Token[] = [];
    let last = 0;

    for (const match of format.matchAll(TOKEN_PATTERN)) {
        const index = match.index ?? 0;

        if (index > last) {
            tokens.push({ literal: format.slice(last, index) });
        }

        tokens.push(typeof match[1] === 'string' ? { literal: match[1] } : { token: match[0] });
        last = index + match[0].length;
    }

    if (last < format.length) {
        tokens.push({ literal: format.slice(last) });
    }

    return tokens;
}

function monthNames(locale: string | undefined, width: 'long' | 'short'): string[] {
    const formatter = new Intl.DateTimeFormat(locale, { month: width });

    return Array.from({ length: 12 }, (_, month) => formatter.format(new Date(2023, month, 1)));
}

function weekdayNames(locale: string | undefined, width: 'long' | 'short'): string[] {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: width });

    return Array.from({ length: 7 }, (_, day) => formatter.format(new Date(2023, 0, 1 + day)));
}

function hour12(hours: number): number {
    return hours % 12 === 0 ? 12 : hours % 12;
}

function formatToken(token: string, date: Date, locale: string | undefined): string {
    const hours = date.getHours();

    switch (token) {
        case 'YYYY': return pad(date.getFullYear(), 4);
        case 'YY': return pad(date.getFullYear() % 100);
        case 'MMMM': return monthNames(locale, 'long')[date.getMonth()];
        case 'MMM': return monthNames(locale, 'short')[date.getMonth()];
        case 'MM': return pad(date.getMonth() + 1);
        case 'M': return String(date.getMonth() + 1);
        case 'DD': return pad(date.getDate());
        case 'D': return String(date.getDate());
        case 'dddd': return weekdayNames(locale, 'long')[date.getDay()];
        case 'ddd': return weekdayNames(locale, 'short')[date.getDay()];
        case 'dd': return weekdayNames(locale, 'short')[date.getDay()].slice(0, 2);
        case 'd': return String(date.getDay());
        case 'HH': return pad(hours);
        case 'H': return String(hours);
        case 'hh': return pad(hour12(hours));
        case 'h': return String(hour12(hours));
        case 'mm': return pad(date.getMinutes());
        case 'm': return String(date.getMinutes());
        case 'ss': return pad(date.getSeconds());
        case 's': return String(date.getSeconds());
        case 'SSS': return pad(date.getMilliseconds(), 3);
        case 'A': return hours < 12 ? 'AM' : 'PM';
        case 'a': return hours < 12 ? 'am' : 'pm';
        default: return token;
    }
}

export function formatHasTime(format: string): boolean {
    return tokenize(format).some((part) => 'token' in part && HOUR_TOKEN.test(part.token));
}

export function formatDate(date: Date, format: string, locale?: string): string {
    return tokenize(format)
        .map((part) => 'literal' in part ? part.literal : formatToken(part.token, date, locale))
        .join('');
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function alternation(names: string[]): string {
    return `(${[...names].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')})`;
}

function patternOf(token: string, locale: string | undefined): string {
    switch (token) {
        case 'YYYY': return '(\\d{4})';
        case 'SSS': return '(\\d{3})';
        case 'MMMM': return alternation(monthNames(locale, 'long'));
        case 'MMM': return alternation(monthNames(locale, 'short'));
        case 'dddd': return alternation(weekdayNames(locale, 'long'));
        case 'ddd': return alternation(weekdayNames(locale, 'short'));
        case 'dd': return alternation(weekdayNames(locale, 'short').map((name) => name.slice(0, 2)));
        case 'd': return '([0-6])';
        case 'A':
        case 'a': return '(am|pm)';
        default: return token.length === 2 ? '(\\d{2})' : '(\\d{1,2})';
    }
}

function indexOfName(names: string[], value: string): number {
    return names.findIndex((name) => name.toLocaleLowerCase() === value.toLocaleLowerCase());
}

interface ParsedParts {
    year: number;
    month: number;
    day: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    meridiem: 'am' | 'pm' | null;
}

function applyToken(parts: ParsedParts, token: string, value: string, locale: string | undefined): void {
    switch (token) {
        case 'YYYY': parts.year = Number(value); break;
        case 'YY': parts.year = Number(value) + (Number(value) > 68 ? 1900 : 2000); break;
        case 'MMMM': parts.month = indexOfName(monthNames(locale, 'long'), value) + 1; break;
        case 'MMM': parts.month = indexOfName(monthNames(locale, 'short'), value) + 1; break;
        case 'MM':
        case 'M': parts.month = Number(value); break;
        case 'DD':
        case 'D': parts.day = Number(value); break;
        case 'HH':
        case 'H':
        case 'hh':
        case 'h': parts.hours = Number(value); break;
        case 'mm':
        case 'm': parts.minutes = Number(value); break;
        case 'ss':
        case 's': parts.seconds = Number(value); break;
        case 'SSS': parts.milliseconds = Number(value); break;
        case 'A':
        case 'a': parts.meridiem = value.toLowerCase() as 'am' | 'pm'; break;
    }
}

export function parseFormattedDate(value: string, format: string, locale?: string): Date | null {
    const tokens = tokenize(format);
    const pattern = tokens
        .map((part) => 'literal' in part ? escapeRegExp(part.literal) : patternOf(part.token, locale))
        .join('');
    const match = new RegExp(`^\\s*${pattern}\\s*$`, 'i').exec(value);

    if (!match) {
        return null;
    }

    const parts: ParsedParts = { year: NaN, month: NaN, day: NaN, hours: 0, minutes: 0, seconds: 0, milliseconds: 0, meridiem: null };
    let group = 1;

    for (const part of tokens) {
        if ('token' in part) {
            applyToken(parts, part.token, match[group], locale);
            group += 1;
        }
    }

    if (parts.meridiem === 'pm' && parts.hours < 12) {
        parts.hours += 12;
    }

    if (parts.meridiem === 'am' && parts.hours === 12) {
        parts.hours = 0;
    }

    const date = new Date(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes, parts.seconds, parts.milliseconds);

    if (Number.isNaN(date.getTime()) || date.getFullYear() !== parts.year || date.getMonth() !== parts.month - 1 || date.getDate() !== parts.day) {
        return null;
    }

    if (parts.hours > 23 || parts.minutes > 59 || parts.seconds > 59) {
        return null;
    }

    return date;
}
