<template>
  <section class="conditions-panel">
    <div class="row split">
      <strong>Conditions</strong>
      <button class="btn" @click="expanded = !expanded">{{ expanded ? "Hide" : "+ Condition" }}</button>
    </div>
    <div class="chips">
      <span v-for="cond in conditions" :key="cond.id" class="chip">
        {{ cond.name }}
        <small v-if="cond.durationType === 'rounds' && cond.durationRemaining">({{ cond.durationRemaining }})</small>
        <button class="chip-close" @click="$emit('remove', cond.id)">x</button>
      </span>
      <span v-if="!conditions.length" class="muted">No conditions</span>
    </div>
    <div v-if="expanded" class="row wrap">
      <select v-model="name" class="input-sm">
        <option v-for="preset in presets" :key="preset" :value="preset">{{ preset }}</option>
      </select>
      <input v-model="customName" class="input-sm" placeholder="Custom name" />
      <select v-model="durationType" class="input-sm">
        <option value="until_discarded">Until removed</option>
        <option value="rounds">Rounds</option>
        <option value="minutes">Minutes</option>
        <option value="hours">Hours</option>
      </select>
      <input
        v-if="durationType !== 'until_discarded'"
        v-model.number="durationRemaining"
        class="input-sm"
        type="number"
        min="1"
        placeholder="Duration"
      />
      <select v-if="durationType === 'rounds'" v-model="endsOn" class="input-sm">
        <option value="end_of_turn">End of turn</option>
        <option value="start_of_turn">Start of turn</option>
      </select>
      <label class="check"><input v-model="concentration" type="checkbox" /> Concentration</label>
      <button class="btn btn-primary" @click="submit">Add</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { ConditionEndPhase, ConditionInstance, DurationType } from "../models/types";

const props = defineProps<{ conditions: ConditionInstance[] }>();
const emit = defineEmits<{
  add: [
    {
      name: string;
      durationType: DurationType;
      durationRemaining?: number;
      endsOn?: ConditionEndPhase;
      concentration?: boolean;
    }
  ];
  remove: [conditionId: string];
}>();

const presets = [
  "frightened",
  "charmed",
  "paralyzed",
  "poisoned",
  "stunned",
  "prone",
  "restrained",
  "blinded",
  "grappled",
  "incapacitated",
  "invisible",
  "petrified",
  "unconscious",
  "exhaustion",
  "slowed",
  "haste"
];

const expanded = ref(false);
const name = ref(presets[0]);
const customName = ref("");
const durationType = ref<DurationType>("until_discarded");
const durationRemaining = ref(1);
const endsOn = ref<ConditionEndPhase>("end_of_turn");
const concentration = ref(false);

function submit() {
  const finalName = customName.value.trim() || name.value;
  if (!finalName) return;
  emit("add", {
    name: finalName,
    durationType: durationType.value,
    durationRemaining: durationType.value === "until_discarded" ? undefined : durationRemaining.value,
    endsOn: durationType.value === "rounds" ? endsOn.value : undefined,
    concentration: concentration.value
  });
  expanded.value = false;
  customName.value = "";
}
</script>
