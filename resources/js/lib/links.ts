const SAFE_SCHEMES = ['http', 'https', 'mailto', 'tel'];

export function isSafeHref(href: unknown): href is string {
    if (typeof href !== 'string' || href.trim() === '') {
        return false;
    }

    const scheme = /^\s*([a-z][a-z0-9+.-]*):/i.exec(href);

    return !scheme || SAFE_SCHEMES.includes((scheme[1] ?? '').toLowerCase());
}

export function isInternalHref(href: string): boolean {
    return href.startsWith('/') && !href.startsWith('//');
}
