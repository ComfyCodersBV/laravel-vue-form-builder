declare global {
    interface Window {
        grecaptcha?: {
            ready: (callback: () => void) => void
            execute: (siteKey: string, options: { action: string }) => Promise<string>
        }
    }
}

export interface UseRecaptchaOptions {
    siteKey: string
    action: string
}

export function useRecaptcha(options: UseRecaptchaOptions) {
    const isLoaded = () => {
        return typeof window !== 'undefined' && !!window.grecaptcha
    }

    const execute = async (): Promise<string | null> => {
        if (!isLoaded()) {
            console.warn('reCAPTCHA v3 is not loaded')
            return null
        }

        return new Promise((resolve) => {
            window.grecaptcha!.ready(async () => {
                try {
                    const token = await window.grecaptcha!.execute(options.siteKey, {
                        action: options.action,
                    })
                    resolve(token)
                } catch (error) {
                    console.error('reCAPTCHA execution failed:', error)
                    resolve(null)
                }
            })
        })
    }

    return {
        isLoaded,
        execute,
    }
}
