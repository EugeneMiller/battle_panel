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
          STR {{ formatAbility(combatant.abilities.str) }} DEX {{ formatAbility(combatant.abilities.dex) }}
          CON {{ formatAbility(combatant.abilities.con) }} INT {{ formatAbility(combatant.abilities.int) }}
          WIS {{ formatAbility(combatant.abilities.wis) }} CHA {{ formatAbility(combatant.abilities.cha) }}
        </span>
        <span v-else>-</span>
      </div>
      <div>
        <strong>Attacks:</strong>
        <div v-if="combatant.attacks?.length">
          <div v-if="getMultiattackCount(combatant.attacks)" class="attack-multi muted">
            Multiattack: x{{ getMultiattackCount(combatant.attacks) }}
          </div>
          <table class="attack-table">
            <thead>
              <tr>
                <th>Attack</th>
                <th>Bonus</th>
                <th>Damage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="attack in combatant.attacks" :key="attack.id">
                <td>
                  <div>{{ attack.name }}</div>
                  <div v-if="attack.notes" class="muted attack-notes">{{ attack.notes }}</div>
                </td>
                <td>{{ typeof attack.toHit === "number" ? formatModifier(attack.toHit) : "-" }}</td>
                <td>{{ formatDamage(attack) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
import type { AttackEntry, Combatant } from "../models/types";

defineProps<{ combatant: Combatant }>();
defineEmits<{ toggle: [] }>();

function formatAbility(score: number): string {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : String(modifier);
}

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : String(modifier);
}

function formatDamage(attack: AttackEntry): string {
  if (!attack.damage) return "-";
  return attack.damageType ? `${attack.damage} ${attack.damageType}` : attack.damage;
}

function getMultiattackCount(attacks?: AttackEntry[]): number | null {
  if (!attacks?.length) return null;
  const total = attacks.reduce((sum, attack) => {
    if (typeof attack.attacksCount !== "number") return sum;
    return sum + attack.attacksCount;
  }, 0);
  return total > 1 ? total : null;
}
</script>
