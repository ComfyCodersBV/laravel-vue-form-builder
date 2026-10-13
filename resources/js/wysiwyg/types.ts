export interface WysiwygAdapterProps {
    modelValue: string;
    disabled?: boolean;
    placeholder?: string;
    config?: Record<string, unknown>;
    features?: string[];
    uploadUrl?: string;
}
