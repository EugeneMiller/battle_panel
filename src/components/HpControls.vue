<template>
  <div class="hp-controls">
    <div class="hp-line">
      <strong>HP:</strong> {{ combatant.hpCurrent }}/{{ combatant.hpMax }} <span>Temp {{ combatant.tempHp }}</span>
    </div>
    <div class="row">
      <input v-model.number="delta" type="number" min="0" class="input-sm" />
      <button class="btn" @click="damage">Damage</button>
      <button class="btn" @click="heal">Heal</button>
      <button class="btn" @click="setExact">Set HP</button>
      <button class="btn" @click="setTemp">Set Temp</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Combatant } from "../models/types";

const props = defineProps<{ combatant: Combatant }>();
const emit = defineEmits<{
  damage: [number];
  heal: [number];
  setHp: [number];
  setTemp: [number];
}>();

const delta = ref(0);

function damage() {
  if (delta.value > 0) emit("damage", delta.value);
}

function heal() {
  if (delta.value > 0) emit("heal", delta.value);
}

function setExact() {
  emit("setHp", delta.value);
}

function setTemp() {
  emit("setTemp", delta.value);
}
</script>
