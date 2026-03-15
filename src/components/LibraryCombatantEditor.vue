<template>
  <div class="details-grid">
    <div class="row wrap">
      <input :value="model.name" class="input-sm" placeholder="Name" @input="updateString('name', $event)" />
      <select :value="model.type" class="input-sm" @change="updateString('type', $event)">
        <option value="PC">PC</option>
        <option value="NPC">NPC</option>
        <option value="Monster">Monster</option>
        <option value="Summon">Summon</option>
      </select>
      <input :value="model.hpMax" class="input-sm" type="number" min="1" placeholder="HP max" @input="updateNumber('hpMax', $event)" />
      <input :value="model.ac ?? ''" class="input-sm" type="number" min="0" placeholder="AC" @input="updateNullableNumber('ac', $event)" />
      <input :value="model.speed ?? ''" class="input-sm" placeholder="Speed" @input="updateString('speed', $event)" />
    </div>

    <div class="row wrap abilities-grid">
      <label v-for="ability in abilities" :key="ability" class="field-inline">
        <span>{{ ability.toUpperCase() }}</span>
        <input
          :value="model.abilities?.[ability] ?? ''"
          class="input-sm inline"
          type="number"
          @input="updateAbility(ability, $event)"
        />
      </label>
    </div>

    <input :value="tagsText" class="input" placeholder="Tags, comma separated" @input="updateTags" />
    <textarea :value="model.publicNotes ?? ''" class="json-box compact-box" placeholder="Public notes" @input="updateString('publicNotes', $event)"></textarea>
    <textarea :value="model.gmNotes ?? ''" class="json-box compact-box" placeholder="GM notes" @input="updateString('gmNotes', $event)"></textarea>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AbilityBlock, CombatantBlueprint } from "../models/types";

const props = defineProps<{
  model: CombatantBlueprint;
}>();

const emit = defineEmits<{
  update: [value: CombatantBlueprint];
}>();

const abilities: Array<keyof AbilityBlock> = ["str", "dex", "con", "int", "wis", "cha"];

const tagsText = computed(() => props.model.tags?.join(", ") ?? "");

function push(next: CombatantBlueprint) {
  emit("update", next);
}

function updateString(field: keyof CombatantBlueprint, event: Event) {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  push({
    ...props.model,
    [field]: value || undefined
  });
}

function updateNumber(field: keyof CombatantBlueprint, event: Event) {
  const raw = Number((event.target as HTMLInputElement).value);
  push({
    ...props.model,
    [field]: Number.isFinite(raw) ? raw : props.model[field]
  });
}

function updateNullableNumber(field: keyof CombatantBlueprint, event: Event) {
  const value = (event.target as HTMLInputElement).value;
  push({
    ...props.model,
    [field]: value === "" ? null : Number(value)
  });
}

function updateAbility(field: keyof AbilityBlock, event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  push({
    ...props.model,
    abilities: {
      ...(props.model.abilities ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),
      [field]: Number.isFinite(value) ? value : 10
    }
  });
}

function updateTags(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  push({
    ...props.model,
    tags: value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  });
}
</script>
