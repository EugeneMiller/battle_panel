<template>
  <section class="encounter-header">
    <div>
      <h1 class="title">{{ encounter.name }}</h1>
      <div class="meta">Round {{ encounter.round }} | Active: {{ activeName || "None" }}</div>
    </div>
    <div class="actions">
      <button class="btn" @click="$emit('prev')">Prev turn</button>
      <button class="btn btn-primary" @click="$emit('next')">Next turn</button>
      <button class="btn" @click="$emit('sort')">Sort by initiative</button>
      <button class="btn" @click="$emit('undo')">Undo</button>
      <button class="btn btn-danger" @click="$emit('clear')">Clear state</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Encounter } from "../models/types";

defineProps<{
  encounter: Encounter;
  activeName?: string;
}>();

defineEmits<{
  prev: [];
  next: [];
  sort: [];
  undo: [];
  clear: [];
}>();
</script>
