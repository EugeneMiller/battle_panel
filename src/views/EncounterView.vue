<template>
  <section v-if="encounter" class="page">
    <EncounterHeader
      :encounter="encounter"
      :active-name="activeCombatant?.name"
      @next="store.nextTurn(encounter.id)"
      @prev="store.prevTurn(encounter.id)"
      @sort="store.sortByInitiative(encounter.id)"
      @undo="store.undoLast()"
      @clear="store.clearEncounterState(encounter.id)"
    />

    <section class="add-form">
      <h3>Add combatant</h3>
      <div class="row wrap">
        <input v-model="draft.name" class="input-sm" placeholder="Name" />
        <select v-model="draft.type" class="input-sm">
          <option value="PC">PC</option>
          <option value="NPC">NPC</option>
          <option value="Monster">Monster</option>
          <option value="Summon">Summon</option>
        </select>
        <input v-model.number="draft.hpMax" class="input-sm" type="number" min="1" placeholder="HP max" />
        <input v-model.number="draft.ac" class="input-sm" type="number" min="0" placeholder="AC" />
        <label class="check"><input v-model="draft.spellcaster" type="checkbox" /> Spellcaster</label>
        <select v-if="draft.spellcaster" v-model="draft.spellMode" class="input-sm">
          <option value="slots">Slots</option>
          <option value="pact">Pact</option>
        </select>
        <button class="btn btn-primary" @click="addCombatant">Add</button>
      </div>
    </section>

    <ImportExport
      @export-all="download(store.exportAsJson(), `battle-export-${Date.now()}.json`)"
      @export-encounter="download(store.exportAsJson(encounter.id), `${encounter.name}.json`)"
      @import="onImport"
    />

    <div class="card-list">
      <CombatantCard
        v-for="combatant in combatants"
        :key="combatant.id"
        :combatant="combatant"
        :conditions="store.getConditionsForCombatant(combatant.id)"
        :active="combatant.id === activeCombatant?.id"
        @initiative-change="store.updateCombatant(combatant.id, { initiative: $event })"
        @damage="store.applyDamage(combatant.id, $event)"
        @heal="store.heal(combatant.id, $event)"
        @set-hp="store.setHp(combatant.id, $event)"
        @add-condition="store.addCondition(combatant.id, $event)"
        @remove-condition="store.removeCondition($event)"
        @break-concentration="store.breakConcentration(combatant.id)"
        @slot-mod="(level, delta) => store.modifySlot(combatant.id, level, delta)"
        @toggle-spells="store.toggleSpellsVisible(combatant.id)"
        @toggle-details="store.toggleCombatantExpanded(combatant.id)"
        @remove="removeCombatant(combatant.id)"
      />
    </div>

    <CombatLog :entries="store.logsForEncounter(encounter.id)" :combatants="combatants" />
  </section>

  <section v-else class="page">
    <p>Encounter not found.</p>
    <RouterLink to="/" class="btn">Back home</RouterLink>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRoute } from "vue-router";
import { useEncounterStore } from "../stores/encounterStore";
import EncounterHeader from "../components/EncounterHeader.vue";
import CombatantCard from "../components/CombatantCard.vue";
import ImportExport from "../components/ImportExport.vue";
import CombatLog from "../components/CombatLog.vue";
import type { CombatantType, SpellcastingBlock } from "../models/types";

const route = useRoute();
const store = useEncounterStore();

const encounterId = computed(() => String(route.params.id ?? ""));
const encounter = computed(() => store.getEncounterById(encounterId.value));
const combatants = computed(() => store.getCombatantsForEncounter(encounterId.value));
const activeCombatant = computed(() => store.getActiveCombatant(encounterId.value));

const draft = reactive({
  name: "",
  type: "NPC" as CombatantType,
  hpMax: 10,
  ac: 10,
  spellcaster: false,
  spellMode: "slots" as "slots" | "pact"
});

async function addCombatant() {
  if (!encounter.value || !draft.name.trim()) return;
  let spellcasting: SpellcastingBlock | undefined;
  if (draft.spellcaster) {
    spellcasting =
      draft.spellMode === "slots"
        ? {
            mode: "slots",
            slots: Array.from({ length: 9 }).map((_, idx) => ({ level: idx + 1, used: 0, max: 0 })),
            spellsKnown: [],
            showSpells: false
          }
        : {
            mode: "pact",
            pact: { slotLevel: 1, max: 0, used: 0 },
            spellsKnown: [],
            showSpells: false
          };
  }
  await store.addCombatant(encounter.value.id, {
    name: draft.name,
    type: draft.type,
    hpMax: draft.hpMax,
    ac: draft.ac,
    spellcasting
  });
  draft.name = "";
}

async function removeCombatant(combatantId: string) {
  if (!window.confirm("Delete combatant?")) return;
  await store.removeCombatant(combatantId);
}

async function onImport(json: string, strategy: "replace" | "merge") {
  await store.importFromJson(json, strategy);
}

function download(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
</script>
