<template>
  <section v-if="encounter" class="page">
    <EncounterHeader
      :encounter="encounter"
      :active-name="activeCombatant?.name"
      @next="store.nextTurn(encounter.id)"
      @prev="store.prevTurn(encounter.id)"
      @sort="store.sortByInitiative(encounter.id)"
      @clear="store.clearEncounterState(encounter.id)"
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
        @update-condition="(conditionId, patch) => store.updateCondition(conditionId, patch)"
        @break-concentration="store.breakConcentration(combatant.id)"
        @set-concentration="store.updateCombatant(combatant.id, { isConcentrating: $event })"
        @slot-mod="(level, delta) => store.modifySlot(combatant.id, level, delta)"
        @toggle-spells="store.toggleSpellsVisible(combatant.id)"
        @toggle-expanded="store.toggleCombatantExpanded(combatant.id)"
        @update-combatant="store.updateCombatant(combatant.id, $event)"
        @export-combatant="exportCombatant(combatant)"
        @remove="removeCombatant(combatant.id)"
      />
    </div>

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
      <div class="row wrap">
        <textarea
          v-model="combatantJsonText"
          class="json-box"
          placeholder='Paste combatant JSON here'
        ></textarea>
      </div>
      <div class="row wrap">
        <button class="btn" @click="importCombatantFromJson">Load combatant</button>
      </div>
    </section>

    <ImportExport
      @export-all="download(store.exportAsJson(), `battle-export-${Date.now()}.json`)"
      @export-encounter="download(store.exportAsJson(encounter.id), `${encounter.name}.json`)"
      @import="onImport"
    />

    <CombatLog :entries="store.logsForEncounter(encounter.id)" :combatants="combatants" />
  </section>

  <section v-else class="page">
    <p>Encounter not found.</p>
    <RouterLink to="/" class="btn">Back home</RouterLink>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useEncounterStore } from "../stores/encounterStore";
import EncounterHeader from "../components/EncounterHeader.vue";
import CombatantCard from "../components/CombatantCard.vue";
import ImportExport from "../components/ImportExport.vue";
import CombatLog from "../components/CombatLog.vue";
import type { Combatant, CombatantType, SpellcastingBlock } from "../models/types";

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
const combatantJsonText = ref("");

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

function exportCombatant(combatant: Combatant) {
  const payload = {
    version: 1,
    kind: "combatant",
    exportedAt: Date.now(),
    combatant: {
      type: combatant.type,
      name: combatant.name,
      initiative: combatant.initiative,
      hpCurrent: combatant.hpCurrent,
      hpMax: combatant.hpMax,
      tempHp: combatant.tempHp,
      ac: combatant.ac,
      speed: combatant.speed,
      abilities: combatant.abilities,
      saves: combatant.saves,
      passives: combatant.passives,
      resistVulnImmune: combatant.resistVulnImmune,
      tags: combatant.tags,
      isHidden: combatant.isHidden,
      isConcentrating: combatant.isConcentrating,
      publicNotes: combatant.publicNotes,
      gmNotes: combatant.gmNotes,
      attacks: combatant.attacks,
      multiattackCount: combatant.multiattackCount,
      deathSaves: combatant.deathSaves,
      spellcasting: combatant.spellcasting
    }
  };
  download(JSON.stringify(payload, null, 2), `${combatant.name}.combatant.json`);
}

function getImportedCombatantPayload(raw: string): Partial<Combatant> | null {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") return null;
  const root = parsed as Record<string, unknown>;
  const candidate =
    root.kind === "combatant" && root.combatant && typeof root.combatant === "object"
      ? (root.combatant as Record<string, unknown>)
      : root;
  if (typeof candidate.name !== "string" || typeof candidate.type !== "string") return null;
  if (typeof candidate.hpMax !== "number") return null;
  return candidate as Partial<Combatant>;
}

async function importCombatantFromJson() {
  if (!encounter.value) return;
  const text = combatantJsonText.value.trim();
  if (!text) return;
  let input: Partial<Combatant> | null = null;
  try {
    input = getImportedCombatantPayload(text);
  } catch {
    input = null;
  }
  if (!input || typeof input.name !== "string" || typeof input.type !== "string" || typeof input.hpMax !== "number") {
    window.alert("Invalid combatant JSON");
    return;
  }
  await store.addCombatant(encounter.value.id, {
    name: input.name,
    type: input.type as CombatantType,
    hpMax: input.hpMax,
    hpCurrent: typeof input.hpCurrent === "number" ? input.hpCurrent : input.hpMax,
    tempHp: typeof input.tempHp === "number" ? input.tempHp : 0,
    initiative: typeof input.initiative === "number" ? input.initiative : null,
    ac: typeof input.ac === "number" ? input.ac : null,
    speed: input.speed,
    abilities: input.abilities,
    saves: input.saves,
    passives: input.passives,
    resistVulnImmune: input.resistVulnImmune,
    tags: input.tags,
    isHidden: Boolean(input.isHidden),
    isConcentrating: Boolean(input.isConcentrating),
    publicNotes: input.publicNotes,
    gmNotes: input.gmNotes,
    attacks: input.attacks,
    multiattackCount: input.multiattackCount,
    deathSaves: input.deathSaves,
    spellcasting: input.spellcasting
  });
  combatantJsonText.value = "";
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
