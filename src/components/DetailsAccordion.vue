<template>
  <section class="details-panel">
    <button class="btn" @click="$emit('toggle')">
      {{ combatant.isExpanded ? "Hide details" : "Show details" }}
    </button>
    <div v-if="combatant.isExpanded" class="details-grid">
      <div><strong>Speed:</strong> {{ combatant.speed || "-" }}</div>
      <div><strong>Tags:</strong> {{ combatant.tags?.join(", ") || "-" }}</div>
      <div>
        <strong>Abilities:</strong>
        <span v-if="combatant.abilities">
          STR {{ combatant.abilities.str }} DEX {{ combatant.abilities.dex }} CON {{ combatant.abilities.con }}
          INT {{ combatant.abilities.int }} WIS {{ combatant.abilities.wis }} CHA {{ combatant.abilities.cha }}
        </span>
        <span v-else>-</span>
      </div>
      <div><strong>Public notes:</strong> {{ combatant.publicNotes || "-" }}</div>
      <div><strong>GM notes:</strong> {{ combatant.gmNotes || "-" }}</div>
      <div>
        <strong>Resist/Vuln/Immune:</strong>
        R {{ combatant.resistVulnImmune?.resist?.join(", ") || "-" }}
        V {{ combatant.resistVulnImmune?.vuln?.join(", ") || "-" }}
        I {{ combatant.resistVulnImmune?.immune?.join(", ") || "-" }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Combatant } from "../models/types";

defineProps<{ combatant: Combatant }>();
defineEmits<{ toggle: [] }>();
</script>
