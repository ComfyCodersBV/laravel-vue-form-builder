export interface MoneyFormat {
    decimal: string;
    symbol: string;
    symbolFirst: boolean;
}

export interface ParsedMoney {
    valid: boolean;
    value: number | null;
}

const SEPARATORS = ['.', ',', '٫', '٬'];

const GROUPING = /[\s  '’]/g;

export function moneyFormat(locale: string, currency: string): MoneyFormat {
    const parts = currencyFormatter(locale, currency).formatToParts(1234.5);

    const symbolIndex = parts.findIndex((part) => part.type === 'currency');
    const numberIndex = parts.findIndex((part) => part.type === 'integer');

    return {
        decimal: decimalSeparator(locale),
        symbol: parts[symbolIndex]?.value ?? currency,
        symbolFirst: symbolIndex !== -1 && symbolIndex < numberIndex,
    };
}

export function formatMinorUnits(value: number | null | undefined, decimals: number, locale: string): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return '';
    }

    return new Intl.NumberFormat(safeLocale(locale), {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value / 10 ** decimals);
}

export function parseMinorUnits(text: string, decimals: number, locale: string, currency = ''): ParsedMoney {
    const { decimal, symbol } = moneyFormat(locale, currency || 'EUR');

    let cleaned = text.replace(symbol, '').replace(currency, '').replace(GROUPING, '');

    if (cleaned === '') {
        return { valid: true, value: null };
    }

    const negative = /^[-−]/.test(cleaned) || /[-−]$/.test(cleaned);
    cleaned = cleaned.replace(/[-−]/g, '');

    const [whole, fraction] = splitDecimal(cleaned, decimal, decimals);

    if (!/^\d+$/.test(whole || '0') || !/^\d*$/.test(fraction)) {
        return { valid: false, value: null };
    }

    const minor = toMinor(whole || '0', fraction, decimals);

    return { valid: true, value: negative && minor !== 0 ? -minor : minor };
}

function splitDecimal(text: string, decimal: string, decimals: number): [string, string] {
    const strip = (part: string) => SEPARATORS.reduce((carry, separator) => carry.split(separator).join(''), part);

    const decimalAt = text.lastIndexOf(decimal);

    if (decimalAt !== -1) {
        return [strip(text.slice(0, decimalAt)), text.slice(decimalAt + 1)];
    }

    const other = SEPARATORS.filter((separator) => separator !== decimal && text.includes(separator));

    if (other.length !== 1) {
        return [strip(text), ''];
    }

    const separator = other[0] as string;
    const pieces = text.split(separator);
    const tail = pieces[pieces.length - 1] ?? '';

    if (pieces.length === 2 && tail.length > 0 && tail.length <= decimals && tail.length !== 3) {
        return [pieces[0] ?? '', tail];
    }

    return [strip(text), ''];
}

function toMinor(whole: string, fraction: string, decimals: number): number {
    const padded = (fraction + '0'.repeat(decimals)).slice(0, decimals);
    const roundsUp = Number(fraction.charAt(decimals) || '0') >= 5;
    const minor = Number(whole) * 10 ** decimals + Number(padded || '0');

    return roundsUp ? minor + 1 : minor;
}

function decimalSeparator(locale: string): string {
    return new Intl.NumberFormat(safeLocale(locale)).formatToParts(1.5).find((part) => part.type === 'decimal')?.value ?? '.';
}

function currencyFormatter(locale: string, currency: string): Intl.NumberFormat {
    try {
        return new Intl.NumberFormat(safeLocale(locale), { style: 'currency', currency });
    } catch {
        return new Intl.NumberFormat(safeLocale(locale), { style: 'currency', currency: 'EUR' });
    }
}

function safeLocale(locale: string): string {
    try {
        return Intl.NumberFormat.supportedLocalesOf([locale.replace('_', '-')])[0] ?? 'en';
    } catch {
        return 'en';
    }
}
