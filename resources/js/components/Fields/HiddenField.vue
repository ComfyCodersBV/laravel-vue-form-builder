<script setup lang="ts">
import type { Field } from '../../types/form-builder'

withDefaults(defineProps<Field>(), {
  name: undefined,
  modelValue: '',
})
</script>

<template>
  <input type="hidden" :name="name" :value="(modelValue as any) ?? ''" />
</template>
