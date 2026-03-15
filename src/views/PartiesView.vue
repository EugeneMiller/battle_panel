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
                <span v-if="member.level"> · Level {{ member.level }}</span>
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
            · AC {{ member.blueprint.ac ?? "-" }}
            <span v-if="member.blueprint.speed"> · {{ member.blueprint.speed }}</span>
          </div>

          <LibraryCombatantEditor
            v-if="party.scope === 'custom' && editingMemberIds[member.id]"
            :model="member.blueprint"
            @update="updateMemberBlueprint(member.id, $event)"
          />
        </article>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useLibraryStore } from "../stores/libraryStore";
import LibraryCombatantEditor from "../components/LibraryCombatantEditor.vue";
import type { CombatantBlueprint } from "../models/types";

const libraryStore = useLibraryStore();
const newPartyName = ref("");
const partyTargets = reactive<Record<string, string>>({});
const editingMemberIds = reactive<Record<string, boolean>>({});

const customParties = computed(() =>
  libraryStore.orderedParties.filter((party) => party.scope === "custom")
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

async function updateMemberBlueprint(memberId: string, blueprint: CombatantBlueprint) {
  await libraryStore.updatePartyMember(memberId, {
    name: blueprint.name,
    blueprint
  });
}

async function removeMember(memberId: string) {
  if (!window.confirm("Delete party member?")) return;
  await libraryStore.deletePartyMember(memberId);
}

function toggleEditing(memberId: string) {
  editingMemberIds[memberId] = !editingMemberIds[memberId];
}

async function copyMemberJson(memberId: string) {
  const payload = libraryStore.exportMemberPayload(memberId);
  if (!payload) return;
  await copyJson(JSON.stringify(payload, null, 2));
}

async function copyPartyJson(partyId: string) {
  const payload = libraryStore.exportPartyPayload(partyId);
  if (!payload) return;
  await copyJson(JSON.stringify(payload, null, 2));
}

async function copyJson(text: string) {
  await navigator.clipboard.writeText(text);
  window.alert("JSON copied to clipboard.");
}
</script>
