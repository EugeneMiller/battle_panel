<template>
  <section class="combat-log">
    <h3>Combat Log</h3>
    <ul>
      <li v-for="entry in entries" :key="entry.id">
        <span class="muted">{{ formatTime(entry.timestamp) }}</span>
        {{ entry.actionType }}
        <span v-if="entry.combatantId">({{ nameFor(entry.combatantId) }})</span>
      </li>
      <li v-if="!entries.length" class="muted">No actions yet</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { CombatLogEntry, Combatant } from "../models/types";

const props = defineProps<{
  entries: CombatLogEntry[];
  combatants: Combatant[];
}>();

function nameFor(combatantId: string): string {
  return props.combatants.find((c) => c.id === combatantId)?.name ?? "Unknown";
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}
</script>
