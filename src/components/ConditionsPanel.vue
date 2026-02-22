<template>
  <section class="conditions-panel">
    <div class="row split">
      <strong>Conditions</strong>
    </div>

    <div class="row wrap">
      <select v-model="selectedPreset" class="input-sm">
        <option v-for="preset in presets" :key="preset" :value="preset">
          {{ preset }}
        </option>
      </select>
      <div class="row">
        <button class="btn" @click="applyPreset">Set</button>
        <button class="btn" @click="specPreset">Spec</button>
        <button class="btn" @click="openEditor()">+ Custom</button>
      </div>
    </div>
    <div class="chips">
      <button
        v-for="cond in conditions"
        :key="cond.id"
        class="chip chip-toggle"
        @click="$emit('remove', cond.id)"
        @dblclick.prevent.stop="openEditor(cond)"
      >
        {{ cond.name }}
        <small v-if="cond.durationType !== 'until_discarded' && cond.durationRemaining">
          ({{ cond.durationRemaining }} {{ cond.durationType }})
        </small>
      </button>
      <span v-if="!conditions.length" class="muted">No conditions</span>
    </div>

    <div v-if="editorOpen" class="row wrap">
      <input v-model="editor.name" class="input-sm" placeholder="Condition name" />
      <select v-model="editor.durationType" class="input-sm">
        <option value="until_discarded">Until removed</option>
        <option value="rounds">Rounds</option>
        <option value="minutes">Minutes</option>
        <option value="hours">Hours</option>
      </select>
      <input
        v-if="editor.durationType !== 'until_discarded'"
        v-model.number="editor.durationRemaining"
        class="input-sm"
        type="number"
        min="1"
        placeholder="Duration"
      />
      <select v-if="editor.durationType === 'rounds'" v-model="editor.endsOn" class="input-sm">
        <option value="end_of_turn">End of turn</option>
        <option value="start_of_turn">Start of turn</option>
      </select>
      <button class="btn btn-primary" @click="saveEditor">Save</button>
      <button class="btn" @click="editorOpen = false">Cancel</button>
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
    }
  ];
  remove: [conditionId: string];
  update: [
    conditionId: string,
    patch: {
      name?: string;
      durationType?: DurationType;
      durationRemaining?: number;
      endsOn?: ConditionEndPhase;
    }
  ];
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

const editorOpen = ref(false);
const suppressClickUntil = ref(0);
const selectedPreset = ref(presets[0] ?? "");
const editor = ref<{
  conditionId?: string;
  name: string;
  durationType: DurationType;
  durationRemaining: number;
  endsOn: ConditionEndPhase;
}>({
  name: "",
  durationType: "hours",
  durationRemaining: 1,
  endsOn: "end_of_turn"
});

function hasCondition(name: string): boolean {
  return props.conditions.some((cond) => cond.name.toLowerCase() === name.toLowerCase());
}

function findConditionByName(name: string): ConditionInstance | undefined {
  return props.conditions.find((cond) => cond.name.toLowerCase() === name.toLowerCase());
}

function togglePreset(name: string) {
  if (Date.now() < suppressClickUntil.value) return;
  const existing = findConditionByName(name);
  if (existing) {
    emit("remove", existing.id);
    return;
  }
  emit("add", {
    name,
    durationType: "hours",
    durationRemaining: 1
  });
}

function applyPreset() {
  if (!selectedPreset.value) return;
  togglePreset(selectedPreset.value);
}

function specPreset() {
  if (!selectedPreset.value) return;
  openEditorByName(selectedPreset.value);
}

function openEditorByName(name: string) {
  const existing = findConditionByName(name);
  if (existing) {
    openEditor(existing);
    return;
  }
  openEditor({
    name,
    durationType: "hours",
    durationRemaining: 1
  });
}

function openEditor(
  condition?:
    | ConditionInstance
    | {
        name: string;
        durationType: DurationType;
        durationRemaining?: number;
        endsOn?: ConditionEndPhase;
      }
) {
  suppressClickUntil.value = Date.now() + 250;
  const conditionId = condition && "id" in condition ? condition.id : undefined;
  const endsOn = condition && "endsOn" in condition ? condition.endsOn : undefined;
  editor.value = {
    conditionId,
    name: condition?.name ?? "",
    durationType: condition?.durationType ?? "hours",
    durationRemaining: condition?.durationRemaining ?? 1,
    endsOn: endsOn ?? "end_of_turn"
  };
  editorOpen.value = true;
}

function saveEditor() {
  const name = editor.value.name.trim();
  if (!name) return;

  const payload = {
    name,
    durationType: editor.value.durationType,
    durationRemaining:
      editor.value.durationType === "until_discarded"
        ? undefined
        : Math.max(1, Number(editor.value.durationRemaining || 1)),
    endsOn: editor.value.durationType === "rounds" ? editor.value.endsOn : undefined
  };

  if (editor.value.conditionId) emit("update", editor.value.conditionId, payload);
  else emit("add", payload);
  editorOpen.value = false;
}
</script>
