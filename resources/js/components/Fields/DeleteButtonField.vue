<script setup lang="ts">
import { router } from '@inertiajs/vue3';
import { ref } from 'vue';
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
    label?: string;
    confirmTitle?: string;
    confirmMessage?: string;
    deleteUrl?: string;
    className?: string;
}

const props = withDefaults(defineProps<Props>(), {
    label: 'Delete',
    confirmTitle: 'Are you sure?',
    confirmMessage: 'This action cannot be undone. This will permanently delete this record.',
    deleteUrl: undefined,
    className: undefined,
});

const showDeleteDialog = ref(false);

function handleDelete() {
    if (props.deleteUrl) {
        router.delete(props.deleteUrl, {
            onSuccess: () => {
                showDeleteDialog.value = false;
            },
        });
    }
}
</script>

<template>
    <Dialog v-model:open="showDeleteDialog">
        <DialogTrigger as-child>
            <Button
                variant="destructive"
                type="button"
                :class="className"
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
                        Cancel
                    </Button>
                </DialogClose>
                <Button
                    variant="destructive"
                    type="button"
                    @click="handleDelete"
                >
                    {{ label }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
