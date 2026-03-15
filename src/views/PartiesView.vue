<template>
  <section class="page">
    <div class="split wrap row">
      <div>
        <h2>Parties</h2>
        <p class="muted">Store player templates, duplicate class presets, and export one hero or a whole party as JSON.</p>
      </div>
      <div class="row wrap">
        <input v-model="newPartyName" class="input" placeholder="New party name" />
        <button class="btn btn-primary" @click="createParty">Create party</button>
      </div>
    </div>

    <article v-for="party in libraryStore.orderedParties" :key="party.id" class="home-card">
      <div class="split wrap row">
        <div>
          <h3>{{ party.name }}</h3>
          <div class="muted">
            {{ party.scope === "system" ? "System library" : "Custom party" }}
          </div>
        </div>
        <div class="row wrap">
          <button class="btn" @click="copyPartyJson(party.id)">Copy party JSON</button>
          <button
            v-if="party.scope === 'custom'"
            class="btn btn-danger"
            @click="removeParty(party.id)"
          >
            Delete party
          </button>
        </div>
      </div>

      <div v-if="party.scope === 'system'" class="row wrap">
        <select v-model="partyTargets[party.id]" class="input-sm">
          <option value="">Select target party</option>
          <option v-for="target in customParties" :key="target.id" :value="target.id">
            {{ target.name }}
          </option>
        </select>
        <span class="muted">Pick a custom party before copying templates.</span>
      </div>
      <div v-else class="details-editor">
        <div class="row wrap">
          <textarea
            v-model="partyImportJson[party.id]"
            class="json-box compact-box"
            placeholder="Paste combatant, party, or bestiary JSON to add members"
          ></textarea>
        </div>
        <div class="row wrap">
          <button class="btn" @click="importIntoParty(party.id)">Import JSON into party</button>
        </div>
      </div>

      <div class="card-list">
        <article
          v-for="member in libraryStore.getPartyMembers(party.id)"
          :key="member.id"
          class="combatant-card"
        >
          <div class="split wrap row">
            <div>
              <h3 class="title">{{ member.name }}</h3>
              <div class="muted">
                {{ member.className ?? member.blueprint.type }}
                <span v-if="member.level"> - Level {{ member.level }}</span>
              </div>
            </div>
            <div class="row wrap">
              <button class="btn" @click="copyMemberJson(member.id)">Copy JSON</button>
              <button
                v-if="party.scope === 'system'"
                class="btn btn-primary"
                @click="copyTemplateToParty(member.id, partyTargets[party.id])"
              >
                Copy to party
              </button>
              <button
                v-if="party.scope === 'custom'"
                class="btn"
                @click="toggleEditing(member.id)"
              >
                {{ editingMemberIds[member.id] ? "Hide editor" : "Edit" }}
              </button>
              <button
                v-if="party.scope === 'custom'"
                class="btn btn-danger"
                @click="removeMember(member.id)"
              >
                Delete
              </button>
            </div>
          </div>

          <div class="muted">
            HP {{ member.blueprint.hpCurrent ?? member.blueprint.hpMax }}/{{ member.blueprint.hpMax }}
            - AC {{ member.blueprint.ac ?? "-" }}
            <span v-if="member.blueprint.speed"> - {{ member.blueprint.speed }}</span>
          </div>

          <PartyMemberEditor
            v-if="party.scope === 'custom' && editingMemberIds[member.id]"
            :combatant="editableCombatants[member.id]"
            @update="updateMemberCombatant(member.id, $event)"
          />
        </article>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useLibraryStore } from "../stores/libraryStore";
import PartyMemberEditor from "../components/PartyMemberEditor.vue";
import type { Combatant } from "../models/types";
import { copyText } from "../utils/clipboard";
import { blueprintToEditableCombatant, combatantToBlueprint } from "../utils/combatantBlueprints";
import { parsePortableCombatants } from "../utils/importParsers";

const libraryStore = useLibraryStore();
const newPartyName = ref("");
const partyTargets = reactive<Record<string, string>>({});
const editingMemberIds = reactive<Record<string, boolean>>({});
const partyImportJson = reactive<Record<string, string>>({});

const customParties = computed(() =>
  libraryStore.orderedParties.filter((party) => party.scope === "custom")
);

const editableCombatants = computed<Record<string, Combatant>>(() =>
  Object.fromEntries(
    libraryStore.partyMembers.map((member) => [
      member.id,
      blueprintToEditableCombatant(member.id, member.blueprint)
    ])
  )
);

async function createParty() {
  await libraryStore.createParty(newPartyName.value);
  newPartyName.value = "";
}

async function copyTemplateToParty(memberId: string, targetPartyId?: string) {
  if (!targetPartyId) {
    window.alert("Create a custom party and select it first.");
    return;
  }
  const member = libraryStore.partyMembers.find((item) => item.id === memberId);
  if (!member) return;
  const characterName = window.prompt("Character name", member.name)?.trim();
  if (!characterName) return;
  await libraryStore.copyMemberToParty(memberId, targetPartyId, characterName);
}

async function updateMemberCombatant(memberId: string, patch: Partial<Combatant>) {
  const base = editableCombatants.value[memberId];
  if (!base) return;
  const merged: Combatant = { ...base, ...patch };
  await libraryStore.updatePartyMember(memberId, {
    name: merged.name,
    blueprint: combatantToBlueprint(merged)
  });
}

async function removeMember(memberId: string) {
  if (!window.confirm("Delete party member?")) return;
  await libraryStore.deletePartyMember(memberId);
}

async function removeParty(partyId: string) {
  if (!window.confirm("Delete party and all members?")) return;
  await libraryStore.deleteParty(partyId);
}

async function importIntoParty(partyId: string) {
  const raw = partyImportJson[partyId]?.trim();
  if (!raw) return;
  try {
    const blueprints = parsePortableCombatants(raw);
    for (const blueprint of blueprints) {
      const characterName = window.prompt("Character name", blueprint.name)?.trim();
      if (!characterName) continue;
      await libraryStore.addMemberToParty(
        partyId,
        { ...blueprint, name: characterName, initiative: null },
        characterName
      );
    }
    partyImportJson[partyId] = "";
  } catch {
    window.alert("Invalid character JSON");
  }
}

function toggleEditing(memberId: string) {
  editingMemberIds[memberId] = !editingMemberIds[memberId];
}

async function copyMemberJson(memberId: string) {
  const payload = libraryStore.exportMemberPayload(memberId);
  if (!payload) return;
  await copyText(JSON.stringify(payload, null, 2));
}

async function copyPartyJson(partyId: string) {
  const payload = libraryStore.exportPartyPayload(partyId);
  if (!payload) return;
  await copyText(JSON.stringify(payload, null, 2));
}
</script>
