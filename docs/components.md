# Standalone Components

Next to the form itself the package ships three components for the screens around a form: a tree, a sortable list and a tab bar. They know nothing about the schema, take plain props and are imported from the package root.

```ts
import { SortableList, Tabs, TreeView } from '@form-builder';
```

They follow the same Tailwind tokens as the fields (`primary`, `muted`, `accent`, `input`), so they pick up the host application's theme.

## TreeView

A nested, selectable list with optional drag and drop.

```vue
<script setup lang="ts">
import { TreeView, type TreeNode } from '@form-builder';
import { ref } from 'vue';

const selected = ref<string | number | null>(null);

const nodes: TreeNode[] = [
    { id: 1, label: 'Furniture', children: [{ id: 2, label: 'Chairs' }] },
    { id: 3, label: 'Storage' },
];

function move(event: { dragged: TreeNode; target: TreeNode | null; position: 'before' | 'after' | 'inside' }) {
    // persist the new position
}
</script>

<template>
    <TreeView v-model="selected" :nodes="nodes" draggable @drop="move">
        <template #actions="{ node }">
            <button type="button" @click="edit(node)">Edit</button>
        </template>
    </TreeView>
</template>
```

| Prop | Purpose |
| --- | --- |
| `nodes` | the tree, each node `{ id, label, children? }` plus anything else you need |
| `modelValue` | the selected node id |
| `draggable` | enables dragging, off by default |
| `expandedIds` | node ids that start out expanded |

`@drop` fires with the dragged node, the node it was dropped on and whether it landed `before`, `after` or `inside` it. Reordering is up to you: the component reports the intent and does not touch `nodes`.

> `expandedIds` seeds the expanded state once. Expanding and collapsing afterwards is the component's own state, and a subtree that gets collapsed forgets how its children were expanded.

## SortableList

A flat list that reorders by dragging or with the arrow buttons on each row.

```vue
<script setup lang="ts">
import { SortableList } from '@form-builder';
import { ref } from 'vue';

const items = ref([
    { id: 1, name: 'First' },
    { id: 2, name: 'Second' },
]);
</script>

<template>
    <SortableList v-model="items" item-key="id" @reorder="persist">
        <template #default="{ item }">{{ item.name }}</template>
    </SortableList>
</template>
```

| Prop | Purpose |
| --- | --- |
| `modelValue` | the items, in their current order |
| `itemKey` | property used as the key, `id` by default |
| `disabled` | blocks dragging and the arrow buttons |

`@reorder` fires alongside `update:modelValue` with `{ from, to, items }`, so you can persist the order without diffing the array yourself.

## Tabs

A tab bar with optional close buttons and an unsaved marker.

```vue
<script setup lang="ts">
import { Tabs, type TabItem } from '@form-builder';
import { ref } from 'vue';

const active = ref('overview');

const tabs: TabItem[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'brand-12', label: 'Acme', closable: true, dirty: true },
];
</script>

<template>
    <Tabs v-model="active" :tabs="tabs" @close="close">
        <template #append>
            <button type="button" @click="open">+</button>
        </template>
    </Tabs>
</template>
```

Each tab takes `key`, `label` and optionally `icon` (any component), `closable`, `dirty` and `disabled`. A `dirty` tab shows an amber dot. `variant="sub"` renders the lighter, second-level bar instead of the default `main`.

Closing does not switch to the tab that was closed, and clicking the active tab emits nothing.
