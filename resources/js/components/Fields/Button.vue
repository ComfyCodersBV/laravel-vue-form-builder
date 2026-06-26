<script setup lang="ts">
import { computed, ref } from 'vue';
import { router } from '@inertiajs/vue3';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';

interface Props {
    className?: string
    label?: string
    cancelLabel?: string
    confirmTitle?: string
    confirmMessage?: string
    deleteUrl?: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

const props = withDefaults(defineProps<Props>(), {
    className: undefined,
    label: '',
    cancelLabel: 'Cancel',
    confirmTitle: undefined,
    confirmMessage: undefined,
    deleteUrl: undefined,
    variant: 'default',
})

const hasConfirm = computed(() => !!props.confirmTitle || !!props.confirmMessage)

const showDialog = ref(false)

function handleConfirmAction() {
    if (props.deleteUrl) {
        router.delete(props.deleteUrl, {
            onSuccess: () => {
                showDialog.value = false;
            },
        });
    }
}
</script>

<template>
    <template v-if="hasConfirm">
        <Dialog v-model:open="showDialog">
            <DialogTrigger as-child>
                <Button
                    :variant="variant"
                    type="button"
                    :class="cn('inline-flex items-center rounded px-4 py-2 text-sm font-medium', className)"
                >
                    {{ label }}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{{ confirmTitle }}</DialogTitle>
                    <DialogDescription>
                        {{ confirmMessage }}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter class="gap-2">
                    <DialogClose as-child>
                        <Button variant="outline" type="button">
                            {{ cancelLabel }}
                        </Button>
                    </DialogClose>
                    <Button
                        :variant="variant"
                        type="button"
                        @click="handleConfirmAction"
                    >
                        {{ label }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </template>
    <template v-else>
        <Button
            :variant="variant"
            type="button"
            :class="cn('inline-flex items-center rounded px-4 py-2 text-sm font-medium', className)"
        >
            {{ label }}
        </Button>
    </template>
</template>