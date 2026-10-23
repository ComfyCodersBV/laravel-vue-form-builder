# Standalone Components

Next to the form itself the package ships four components for the screens around a form: a tree, a sortable list and a tab bar. They know nothing about the schema, take plain props and are imported from the package root.

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
| `externalType` | drag data type the tree accepts from outside, emitted as `@external-drop` |

`@drop` fires with the dragged node, the node it was dropped on and whether it landed `before`, `after` or `inside` it. Reordering is up to you: the component reports the intent and does not touch `nodes`.

A node can be dragged to any level of the tree, but never into its own subtree. Give a node `draggable: false` to keep it
in place while it still accepts drops, as the fixed roots of a menu do.

Items from outside the tree, such as a list next to it, can be dropped on a node too. Give the tree an `externalType`
and let the source put its data under that type on drag start; the tree then emits `@external-drop` with the parsed
data, the node it landed on and the position. Drags of any other type are ignored.

```vue
<li draggable="true" @dragstart="$event.dataTransfer.setData('application/x-category', JSON.stringify(category))">…</li>

<TreeView :nodes="nodes" external-type="application/x-category" @external-drop="link" />
```

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

## DatePicker

The calendar behind the `date` field, for a date outside a form schema: a filter bar, a dialog, a table cell.

```vue
<script setup lang="ts">
import { DatePicker, type DisabledDate } from '@form-builder/components/ui/date-picker';
import { ref } from 'vue';

const arrival = ref<string | null>(null);

const closed: DisabledDate[] = ['2026-12-25', { from: '2026-07-20', to: '2026-08-02' }];
</script>

<template>
    <DatePicker v-model="arrival" :week-starts-on="1" :disabled-weekdays="[0, 6]" :disabled-dates="closed" />
</template>
```

| Prop | Purpose |
| --- | --- |
| `modelValue` | `Y-m-d` (or `Y-m-d H:i` with `enableTime`); `{ start, end }` with `range` |
| `range`, `enableTime` | pick a period, pick a time as well |
| `minDate`, `maxDate` | first and last selectable day |
| `disabledWeekdays` | weekdays that cannot be picked, `0` = Sunday to `6` = Saturday |
| `disabledDates` | days that cannot be picked: `'Y-m-d'` strings and `{ from?, to? }` ranges |
| `weekStartsOn` | `0` Sunday (default) or `1` Monday |
| `format`, `locale`, `placeholder` | display of the chosen value, `format` in [Day.js tokens](fields/date-time.md#date-format) |
| `timezone`, `serverTimezone` | see [Date & Time](fields/date-time.md#timezone) |
| `disabled`, `readonly` | block the picker |

Disabled days only stop the user from clicking them. Validate on the server as well, for example with the
`AvailableDate` rule described in [Date & Time](fields/date-time.md#disabled-weekdays-and-dates).

The same check is available as a function, for a table cell or a custom calendar. A project that only maps
`@form-builder/types/*` in its `tsconfig.json` imports it from there (see [Installation](installation.md#typescript)):

```ts
import { isUnavailableDate, type DisabledDate } from '@form-builder/types/dates';

const closed: DisabledDate[] = ['2026-12-25'];

isUnavailableDate(new Date(2026, 11, 25), [0, 6], closed); // true
```
