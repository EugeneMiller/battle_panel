<template>
  <section v-if="spellcasting" class="spell-panel">
    <div class="row">
      <strong>Spellcasting</strong>
      <button class="btn" @click="toggleOpen">{{ isOpen ? "-" : "+" }}</button>
    </div>

    <div v-if="isOpen && spellcasting.mode === 'slots' && spellcasting.slots" class="row wrap">
      <div v-for="slot in spellcasting.slots" :key="slot.level" class="slot">
        <span>L{{ slot.level }} {{ slot.used }}/{{ slot.max }}</span>
        <button class="chip-btn" @click="$emit('slot-mod', slot.level, 1)">Use</button>
        <button class="chip-btn" @click="$emit('slot-mod', slot.level, -1)">Restore</button>
      </div>
      <label v-if="typeof concentration === 'boolean'" class="check conc-toggle">
        <input type="checkbox" :checked="concentration" @change="onConcentrationChange" /> Concentration
      </label>
    </div>

    <div v-if="isOpen && spellcasting.mode === 'pact' && spellcasting.pact" class="row wrap">
      <div class="slot">
        <span>Pact L{{ spellcasting.pact.slotLevel }} {{ spellcasting.pact.used }}/{{ spellcasting.pact.max }}</span>
        <button class="chip-btn" @click="$emit('slot-mod', spellcasting.pact.slotLevel, 1)">Use</button>
        <button class="chip-btn" @click="$emit('slot-mod', spellcasting.pact.slotLevel, -1)">Restore</button>
      </div>
      <label v-if="typeof concentration === 'boolean'" class="check conc-toggle">
        <input type="checkbox" :checked="concentration" @change="onConcentrationChange" /> Concentration
      </label>
    </div>

    <div v-if="isOpen && !editorOpen">
      <table v-if="filteredSpells.length" class="attack-table spell-table">
        <thead>
          <tr>
            <th>Spell</th>
            <th>Level</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="spell in filteredSpells" :key="spell.id">
            <td>{{ spell.name }}</td>
            <td>{{ spell.level }}</td>
            <td>
              <button class="btn" :hidden="spell.level === 0" @click="useSpell(spell)">Use</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="muted">No spells</div>
      <div class="row">
        <button class="btn" @click="openEditor">Edit spells</button>
      </div>
    </div>

    <div v-else-if="isOpen" class="details-editor">
      <div v-if="spellcasting.mode === 'slots'">
        <div class="row split">
          <strong>Slots</strong>
          <button class="btn" @click="addSlot">+ Slot</button>
        </div>
        <div v-for="slot in editor.slots" :key="slot.level" class="row wrap">
          <span class="muted">L{{ slot.level }}</span>
          <input v-model.number="slot.max" class="input-sm" type="number" min="0" />
          <button class="btn btn-danger" @click="removeSlot(slot.level)">Remove</button>
        </div>
      </div>
      <div v-else-if="spellcasting.mode === 'pact'" class="row wrap">
        <label class="field">
          <span class="muted">Pact level</span>
          <input v-model.number="editor.pact.slotLevel" class="input-sm" type="number" min="1" />
        </label>
        <label class="field">
          <span class="muted">Pact slots</span>
          <input v-model.number="editor.pact.max" class="input-sm" type="number" min="0" />
        </label>
      </div>

      <div class="details-attacks">
        <div class="row split">
          <strong>Spells</strong>
          <button class="btn" @click="addSpell">+ Spell</button>
        </div>
        <div v-if="!editor.spells.length" class="muted">No spells</div>
        <div v-for="(spell, index) in editor.spells" :key="spell.id" class="row wrap">
          <input v-model="spell.name" class="input-sm" placeholder="Name" />
          <input v-model.number="spell.level" class="input-sm" type="number" min="0" />
          <input v-model="spell.school" class="input-sm" placeholder="School" />
          <button class="btn btn-danger" @click="removeSpell(index)">Remove</button>
        </div>
      </div>

      <div class="row">
        <button class="btn btn-primary" @click="saveEditor">Save</button>
        <button class="btn" @click="cancelEditor">Cancel</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { makeId } from "../utils/id";
import type { SpellEntry, SpellcastingBlock } from "../models/types";

const props = defineProps<{ spellcasting?: SpellcastingBlock; concentration?: boolean }>();

const emit = defineEmits<{
  "slot-mod": [level: number, delta: 1 | -1];
  "set-concentration": [value: boolean];
  "update-spellcasting": [value: SpellcastingBlock];
}>();

const isOpen = ref(true);
const editorOpen = ref(false);
const editor = ref({
  slots: [] as Array<{ level: number; max: number }>,
  pact: { slotLevel: 1, max: 0 },
  spells: [] as Array<{ id: string; name: string; level: number; school?: string }>
});

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
  return merged;
});

function onConcentrationChange(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  emit("set-concentration", checked);
}

function toggleOpen() {
  isOpen.value = !isOpen.value;
}

function useSpell(spell: SpellEntry) {
  if (!props.spellcasting) return;
  if (spell.level <= 0) return;
  if (props.spellcasting.mode === "pact" && props.spellcasting.pact) {
    emit("slot-mod", props.spellcasting.pact.slotLevel, 1);
    return;
  }
  emit("slot-mod", spell.level, 1);
}

function openEditor() {
  const spellcasting = props.spellcasting;
  if (!spellcasting) return;
  editor.value = {
    slots: (spellcasting.slots ?? []).map((slot) => ({ level: slot.level, max: slot.max })),
    pact: {
      slotLevel: spellcasting.pact?.slotLevel ?? 1,
      max: spellcasting.pact?.max ?? 0
    },
    spells: filteredSpells.value.map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      school: spell.school
    }))
  };
  editorOpen.value = true;
}

function addSpell() {
  editor.value.spells.push({ id: makeId(), name: "", level: 0 });
}

function removeSpell(index: number) {
  editor.value.spells.splice(index, 1);
}

function addSlot() {
  const levels = editor.value.slots.map((slot) => slot.level);
  const nextLevel = levels.length ? Math.max(...levels) + 1 : 1;
  editor.value.slots.push({ level: nextLevel, max: 0 });
}

function removeSlot(level: number) {
  editor.value.slots = editor.value.slots.filter((slot) => slot.level !== level);
}

function saveEditor() {
  if (!props.spellcasting) return;
  const cleanedSpells = editor.value.spells
    .filter((spell) => spell.name.trim())
    .map((spell) => ({
      id: spell.id || makeId(),
      name: spell.name.trim(),
      level: Math.max(0, Number(spell.level || 0)),
      school: spell.school?.trim() || undefined
    }));

  const existingSlots = new Map(
    (props.spellcasting.slots ?? []).map((slot) => [slot.level, slot.used])
  );
  const updatedSlots =
    props.spellcasting.mode === "slots"
      ? editor.value.slots.map((slot) => ({
          level: slot.level,
          max: Math.max(0, slot.max),
          used: existingSlots.get(slot.level) ?? 0
        }))
      : props.spellcasting.slots;

  const updated: SpellcastingBlock = {
    ...props.spellcasting,
    slots: updatedSlots,
    pact:
      props.spellcasting.mode === "pact"
        ? { slotLevel: Math.max(1, editor.value.pact.slotLevel), max: Math.max(0, editor.value.pact.max), used: 0 }
        : props.spellcasting.pact,
    preparedSpells: cleanedSpells
  };

  emit("update-spellcasting", updated);
  editorOpen.value = false;
}

function cancelEditor() {
  editorOpen.value = false;
}
</script>
