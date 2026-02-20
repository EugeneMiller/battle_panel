<template>
  <article class="combatant-card" :class="{ active }">
    <header class="card-top">
      <div>
        <div class="row">
          <h3>{{ combatant.name }}</h3>
          <span v-if="active" class="badge">ACTIVE</span>
          <span v-if="hasConcentration" class="badge">CONC</span>
        </div>
        <div class="muted">
          {{ combatant.type }} | Init:
          <input
            :value="combatant.initiative ?? ''"
            type="number"
            class="input-sm inline"
            @change="onInitiativeChange"
          />
          <span v-if="combatant.ac !== null">| AC {{ combatant.ac }}</span>
        </div>
        <div v-if="!isExpanded" class="hp-compact">
          <strong>HP:</strong> {{ combatant.hpCurrent }}/{{ combatant.hpMax }}
          <span v-if="combatant.tempHp"> Temp {{ combatant.tempHp }}</span>
        </div>
        <div v-if="!isExpanded && conditionSummary" class="muted hp-compact">
          {{ conditionSummary }}
        </div>
      </div>
      <div class="row card-actions">
        <template v-if="isExpanded">
          <button class="btn" @click="$emit('break-concentration')">Break conc</button>
          <button class="btn btn-danger" @click="$emit('remove')">Delete</button>
        </template>
        <button
          class="btn btn-icon"
          :disabled="active"
          :title="active ? 'Active combatant stays expanded' : 'Toggle details'"
          @click="$emit('toggle-expanded')"
        >
          {{ isExpanded ? "v" : ">" }}
        </button>
      </div>
    </header>

    <template v-if="isExpanded">
      <HpControls
        :combatant="combatant"
        @damage="$emit('damage', $event)"
        @heal="$emit('heal', $event)"
        @set-hp="$emit('set-hp', $event)"
        @set-temp="$emit('set-temp', $event)"
      />

      <label class="check conc-toggle">
        <input type="checkbox" :checked="hasConcentration" @change="onConcentrationChange" /> Concentration
      </label>

      <ConditionsPanel
        :conditions="conditions"
        @add="$emit('add-condition', $event)"
        @remove="$emit('remove-condition', $event)"
        @update="(conditionId, patch) => $emit('update-condition', conditionId, patch)"
      />

      <SpellcastingPanel
        :spellcasting="combatant.spellcasting"
        @slot-mod="(level, delta) => $emit('slot-mod', level, delta)"
        @toggle-show-spells="$emit('toggle-spells')"
      />

      <DetailsAccordion
        :combatant="combatant"
        @update="$emit('update-combatant', $event)"
        @export-combatant="$emit('export-combatant')"
      />

      <div v-if="combatant.type === 'PC' && combatant.hpCurrent <= 0 && combatant.deathSaves" class="death-saves">
        Death saves: {{ combatant.deathSaves.success }} success / {{ combatant.deathSaves.fail }} fail
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Combatant, ConditionInstance } from "../models/types";
import HpControls from "./HpControls.vue";
import ConditionsPanel from "./ConditionsPanel.vue";
import SpellcastingPanel from "./SpellcastingPanel.vue";
import DetailsAccordion from "./DetailsAccordion.vue";

const props = defineProps<{
  combatant: Combatant;
  conditions: ConditionInstance[];
  active?: boolean;
}>();

const emit = defineEmits<{
  "initiative-change": [value: number | null];
  damage: [amount: number];
  heal: [amount: number];
  "set-hp": [value: number];
  "set-temp": [value: number];
  "add-condition": [
    {
      name: string;
      durationType: "rounds" | "minutes" | "hours" | "until_discarded";
      durationRemaining?: number;
      endsOn?: "start_of_turn" | "end_of_turn";
    }
  ];
  "remove-condition": [conditionId: string];
  "update-condition": [
    conditionId: string,
    patch: {
      name?: string;
      durationType?: "rounds" | "minutes" | "hours" | "until_discarded";
      durationRemaining?: number;
      endsOn?: "start_of_turn" | "end_of_turn";
    }
  ];
  "break-concentration": [];
  "set-concentration": [value: boolean];
  "slot-mod": [level: number, delta: 1 | -1];
  "toggle-spells": [];
  "toggle-expanded": [];
  "update-combatant": [patch: Partial<Combatant>];
  "export-combatant": [];
  remove: [];
}>();

const hasConcentration = computed(() => Boolean(props.combatant.isConcentrating));
const isExpanded = computed(() => props.active || props.combatant.isExpanded);
const conditionSummary = computed(() =>
  props.conditions.length ? `Conditions: ${props.conditions.map((c) => c.name).join(", ")}` : ""
);

function onInitiativeChange(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isNaN(value)) emit("initiative-change", null);
  else emit("initiative-change", value);
}

function onConcentrationChange(event: Event) {
  emit("set-concentration", (event.target as HTMLInputElement).checked);
}
</script>
