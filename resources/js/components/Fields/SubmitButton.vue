<script setup lang="ts">
import { computed, ref } from 'vue';
import { router } from '@inertiajs/vue3';
import { Button } from '../ui/button';
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
    label?: string
    cancelLabel?: string
    confirmTitle?: string
    confirmMessage?: string
    deleteUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
    label: 'Save',
    cancelLabel: 'Cancel',
    confirmTitle: undefined,
    confirmMessage: undefined,
    deleteUrl: undefined,
})

const hasConfirm = computed(() => !!props.confirmTitle || !!props.confirmMessage)

const showDialog = ref(false)
const hiddenSubmit = ref<HTMLButtonElement | null>(null)

function handleConfirmAction() {
    if (props.deleteUrl) {
        router.delete(props.deleteUrl, {
            onSuccess: () => {
                showDialog.value = false;
            },
        });

        return;
    }

    hiddenSubmit.value?.click();
    showDialog.value = false;
}
</script>

<template>
    <template v-if="hasConfirm">
        <button ref="hiddenSubmit" type="submit" class="hidden" />
        <Dialog v-model:open="showDialog">
            <DialogTrigger as-child>
                <Button
                    type="button"
                    class="inline-flex w-fit items-center rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
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
            type="submit"
            class="inline-flex w-fit items-center rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
            {{ label }}
        </Button>
    </template>
</template>