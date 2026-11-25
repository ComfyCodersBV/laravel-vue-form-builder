import type { FunctionalComponent, Slot, VNodeChild } from 'vue';

interface SlotOutletProps {
    render: Slot;
    scope: Record<string, any>;
}

export const SlotOutlet: FunctionalComponent<SlotOutletProps> = (props): VNodeChild => props.render(props.scope);

SlotOutlet.props = ['render', 'scope'];
