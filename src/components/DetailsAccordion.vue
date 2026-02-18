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
          STR {{ formatMod(combatant.abilities.str) }} DEX {{ formatMod(combatant.abilities.dex) }}
          CON {{ formatMod(combatant.abilities.con) }} INT {{ formatMod(combatant.abilities.int) }}
          WIS {{ formatMod(combatant.abilities.wis) }} CHA {{ formatMod(combatant.abilities.cha) }}
        </span>
        <span v-else>-</span>
      </div>
      <div>
        <strong>Attacks:</strong>
        <ul v-if="combatant.attacks?.length" class="attack-list">
          <li v-for="attack in combatant.attacks" :key="attack.id">
            {{ attack.name }}
            <span v-if="typeof attack.attacksCount === 'number' && attack.attacksCount > 1">
              (x{{ attack.attacksCount }})
            </span>
            <span v-if="typeof attack.toHit === 'number'"> | to hit {{ formatMod(attack.toHit) }}</span>
            <span v-if="attack.damage"> | dmg {{ attack.damage }}</span>
            <span v-if="attack.damageType"> {{ attack.damageType }}</span>
            <span v-if="attack.notes"> | {{ attack.notes }}</span>
          </li>
        </ul>
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

function formatMod(scoreOrMod: number): string {
  const maybeScore = Number(scoreOrMod);
  const modifier = maybeScore >= 1 && maybeScore <= 30 ? Math.floor((maybeScore - 10) / 2) : maybeScore;
  return modifier >= 0 ? `+${modifier}` : String(modifier);
}
</script>
