<template>
  <section v-if="spellcasting" class="spell-panel">
    <div class="row split">
      <strong>Spellcasting</strong>
      <button class="btn" @click="$emit('toggle-show-spells')">
        {{ spellcasting.showSpells ? "Hide spells" : "Show spells" }}
      </button>
    </div>

    <div v-if="spellcasting.mode === 'slots' && spellcasting.slots" class="row wrap">
      <div v-for="slot in spellcasting.slots" :key="slot.level" class="slot">
        <span>L{{ slot.level }} {{ slot.used }}/{{ slot.max }}</span>
        <button class="chip-btn" @click="$emit('slot-mod', slot.level, 1)">Use</button>
        <button class="chip-btn" @click="$emit('slot-mod', slot.level, -1)">Restore</button>
      </div>
    </div>

    <div v-if="spellcasting.mode === 'pact' && spellcasting.pact" class="row wrap">
      <div class="slot">
        <span>Pact L{{ spellcasting.pact.slotLevel }} {{ spellcasting.pact.used }}/{{ spellcasting.pact.max }}</span>
        <button class="chip-btn" @click="$emit('slot-mod', spellcasting.pact.slotLevel, 1)">Use</button>
        <button class="chip-btn" @click="$emit('slot-mod', spellcasting.pact.slotLevel, -1)">Restore</button>
      </div>
    </div>

    <div v-if="spellcasting.showSpells">
      <input v-model="query" class="input-sm block" placeholder="Search spell..." />
      <ul class="spell-list">
        <li v-for="spell in filteredSpells" :key="spell.id">
          {{ spell.name }} ({{ spell.level }}) <small>{{ spell.school || "" }}</small>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { SpellcastingBlock } from "../models/types";

const props = defineProps<{ spellcasting?: SpellcastingBlock }>();

defineEmits<{
  "slot-mod": [level: number, delta: 1 | -1];
  "toggle-show-spells": [];
}>();

const query = ref("");

const filteredSpells = computed(() => {
  const spellcasting = props.spellcasting;
  const list = [
    ...(spellcasting?.spellsKnown ?? []),
    ...(spellcasting?.preparedSpells ?? [])
  ];
  const unique = new Map<string, (typeof list)[number]>();
  for (const spell of list) {
    if (!unique.has(spell.id)) unique.set(spell.id, spell);
  }
  const merged = Array.from(unique.values());
  const q = query.value.trim().toLowerCase();
  if (!q) return merged;
  return merged.filter((spell) => spell.name.toLowerCase().includes(q));
});
</script>
