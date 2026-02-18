<template>
  <section class="conditions-panel">
    <div class="row split">
      <strong>Conditions</strong>
      <button class="btn" @click="openEditor()">+ Custom</button>
    </div>

    <div class="row wrap">
      <button
        v-for="preset in presets"
        :key="preset"
        class="btn condition-toggle"
        :class="{ active: hasCondition(preset) }"
        @click="togglePreset(preset)"
        @dblclick.prevent.stop="openEditorByName(preset)"
      >
        {{ preset }}
      </button>
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
      <label class="check"><input v-model="editor.concentration" type="checkbox" /> Concentration</label>
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
      concentration?: boolean;
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
      concentration?: boolean;
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
const editor = ref<{
  conditionId?: string;
  name: string;
  durationType: DurationType;
  durationRemaining: number;
  endsOn: ConditionEndPhase;
  concentration: boolean;
}>({
  name: "",
  durationType: "hours",
  durationRemaining: 1,
  endsOn: "end_of_turn",
  concentration: false
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
    durationRemaining: 1,
    concentration: false
  });
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
    durationRemaining: 1,
    concentration: false
  });
}

function openEditor(
  condition?:
    | ConditionInstance
    | {
        name: string;
        durationType: DurationType;
        durationRemaining?: number;
        concentration?: boolean;
      }
) {
  suppressClickUntil.value = Date.now() + 250;
  editor.value = {
    conditionId: condition?.id || undefined,
    name: condition?.name ?? "",
    durationType: condition?.durationType ?? "hours",
    durationRemaining: condition?.durationRemaining ?? 1,
    endsOn: condition?.endsOn ?? "end_of_turn",
    concentration: condition?.concentration ?? false
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
    endsOn: editor.value.durationType === "rounds" ? editor.value.endsOn : undefined,
    concentration: editor.value.concentration
  };

  if (editor.value.conditionId) emit("update", editor.value.conditionId, payload);
  else emit("add", payload);
  editorOpen.value = false;
}
</script>
