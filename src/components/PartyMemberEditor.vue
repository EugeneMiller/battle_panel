<template>
  <section class="details-panel">
    <div class="row wrap">
      <label class="field">
        <span class="muted">Name</span>
        <input :value="combatant.name" class="input-sm" @input="updateString('name', $event)" />
      </label>
      <label class="field">
        <span class="muted">Type</span>
        <select :value="combatant.type" class="input-sm" @change="updateString('type', $event)">
          <option value="PC">PC</option>
          <option value="NPC">NPC</option>
          <option value="Monster">Monster</option>
          <option value="Summon">Summon</option>
        </select>
      </label>
      <label class="field">
        <span class="muted">HP Max</span>
        <input :value="combatant.hpMax" class="input-sm" type="number" min="1" @input="updateNumber('hpMax', $event)" />
      </label>
      <label class="field">
        <span class="muted">HP Current</span>
        <input :value="combatant.hpCurrent" class="input-sm" type="number" min="0" @input="updateNumber('hpCurrent', $event)" />
      </label>
      <label class="field">
        <span class="muted">Temp HP</span>
        <input :value="combatant.tempHp" class="input-sm" type="number" min="0" @input="updateNumber('tempHp', $event)" />
      </label>
      <label class="field">
        <span class="muted">AC</span>
        <input :value="combatant.ac ?? ''" class="input-sm" type="number" min="0" @input="updateNullableNumber('ac', $event)" />
      </label>
      <label class="field">
        <span class="muted">Speed</span>
        <input :value="combatant.speed ?? ''" class="input-sm" @input="updateString('speed', $event)" />
      </label>
      <label class="check">
        <input :checked="combatant.isHidden" type="checkbox" @change="updateCheckbox('isHidden', $event)" />
        Hidden
      </label>
      <label class="check">
        <input :checked="combatant.isConcentrating" type="checkbox" @change="updateCheckbox('isConcentrating', $event)" />
        Concentration
      </label>
    </div>

    <div class="row wrap">
      <button class="btn" @click="ensureSpellcasting('slots')">Spell Slots</button>
      <button class="btn" @click="ensureSpellcasting('pact')">Pact Magic</button>
      <button v-if="combatant.spellcasting" class="btn btn-danger" @click="removeSpellcasting">Remove spellcasting</button>
    </div>

    <SpellcastingPanel
      :spellcasting="combatant.spellcasting"
      :concentration="combatant.isConcentrating"
      @slot-mod="onSlotMod"
      @set-concentration="emitPatch({ isConcentrating: $event })"
      @update-spellcasting="emitPatch({ spellcasting: $event })"
    />

    <DetailsAccordion
      :combatant="combatant"
      @update="emitPatch($event)"
    />
  </section>
</template>

<script setup lang="ts">
import type { Combatant, SpellcastingBlock } from "../models/types";
import DetailsAccordion from "./DetailsAccordion.vue";
import SpellcastingPanel from "./SpellcastingPanel.vue";

const props = defineProps<{
  combatant: Combatant;
}>();

const emit = defineEmits<{
  update: [patch: Partial<Combatant>];
}>();

function emitPatch(patch: Partial<Combatant>) {
  emit("update", patch);
}

function updateString(field: keyof Combatant, event: Event) {
  const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
  emitPatch({ [field]: value || undefined } as Partial<Combatant>);
}

function updateNumber(field: keyof Combatant, event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  emitPatch({ [field]: Math.max(0, value) } as Partial<Combatant>);
}

function updateNullableNumber(field: keyof Combatant, event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  emitPatch({ [field]: raw === "" ? null : Number(raw) } as Partial<Combatant>);
}

function updateCheckbox(field: keyof Combatant, event: Event) {
  emitPatch({ [field]: (event.target as HTMLInputElement).checked } as Partial<Combatant>);
}

function ensureSpellcasting(mode: SpellcastingBlock["mode"]) {
  if (mode === "slots") {
    emitPatch({
      spellcasting: {
        mode: "slots",
        slots: Array.from({ length: 9 }).map((_, index) => ({ level: index + 1, max: 0, used: 0 })),
        preparedSpells: [],
        showSpells: false
      }
    });
    return;
  }

  emitPatch({
    spellcasting: {
      mode: "pact",
      pact: { slotLevel: 1, max: 1, used: 0 },
      preparedSpells: [],
      showSpells: false
    }
  });
}

function removeSpellcasting() {
  emitPatch({ spellcasting: undefined, isConcentrating: false });
}

function onSlotMod(level: number, delta: 1 | -1) {
  const spellcasting = props.combatant.spellcasting;
  if (!spellcasting) return;
  if (spellcasting.mode === "slots" && spellcasting.slots) {
    emitPatch({
      spellcasting: {
        ...spellcasting,
        slots: spellcasting.slots.map((slot) =>
          slot.level === level
            ? { ...slot, used: Math.max(0, Math.min(slot.max, slot.used + delta)) }
            : slot
        )
      }
    });
    return;
  }
  if (spellcasting.mode === "pact" && spellcasting.pact) {
    emitPatch({
      spellcasting: {
        ...spellcasting,
        pact: {
          ...spellcasting.pact,
          used: Math.max(0, Math.min(spellcasting.pact.max, spellcasting.pact.used + delta))
        }
      }
    });
  }
}
</script>
