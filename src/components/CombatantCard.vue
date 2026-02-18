<template>
  <article class="combatant-card" :class="{ active }">
    <header class="card-top">
      <div>
        <h3>{{ combatant.name }}</h3>
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
      </div>
      <div class="row">
        <span v-if="hasConcentration" class="badge">CONC</span>
        <button class="btn" @click="$emit('break-concentration')">Break conc</button>
        <button class="btn btn-danger" @click="$emit('remove')">Delete</button>
      </div>
    </header>

    <HpControls :combatant="combatant" @damage="$emit('damage', $event)" @heal="$emit('heal', $event)" @set-hp="$emit('set-hp', $event)" />

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

    <DetailsAccordion :combatant="combatant" @toggle="$emit('toggle-details')" />

    <div v-if="combatant.type === 'PC' && combatant.hpCurrent <= 0 && combatant.deathSaves" class="death-saves">
      Death saves: {{ combatant.deathSaves.success }} success / {{ combatant.deathSaves.fail }} fail
    </div>
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
  "add-condition": [
    {
      name: string;
      durationType: "rounds" | "minutes" | "hours" | "until_discarded";
      durationRemaining?: number;
      endsOn?: "start_of_turn" | "end_of_turn";
      concentration?: boolean;
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
      concentration?: boolean;
    }
  ];
  "break-concentration": [];
  "slot-mod": [level: number, delta: 1 | -1];
  "toggle-spells": [];
  "toggle-details": [];
  remove: [];
}>();

const hasConcentration = computed(() => props.conditions.some((c) => c.concentration));

function onInitiativeChange(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isNaN(value)) emit("initiative-change", null);
  else emit("initiative-change", value);
}
</script>
