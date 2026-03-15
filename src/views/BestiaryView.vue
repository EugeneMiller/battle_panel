<template>
  <section class="page">
    <div class="split wrap row">
      <div>
        <h2>Bestiary</h2>
        <p class="muted">Use the core NPC library, copy entries into your own collections, and export one sheet or a full custom roster as JSON.</p>
      </div>
      <div class="row wrap">
        <input v-model="newCollectionName" class="input" placeholder="New NPC library name" />
        <button class="btn btn-primary" @click="createCollection">Create library</button>
      </div>
    </div>

    <article v-for="collection in libraryStore.orderedCollections" :key="collection.id" class="home-card">
      <div class="split wrap row">
        <div>
          <h3>{{ collection.name }}</h3>
          <div class="muted">
            {{ collection.scope === "system" ? "System bestiary" : "Custom NPC library" }}
          </div>
        </div>
        <div class="row wrap">
          <button class="btn" @click="toggleCollectionOpen(collection.id)">
            {{ openedCollectionIds[collection.id] ? "Collapse" : "Expand" }}
          </button>
          <button class="btn" @click="copyCollectionJson(collection.id)">Copy library JSON</button>
          <button
            v-if="collection.scope === 'custom'"
            class="btn btn-primary"
            @click="addNpc(collection.id)"
          >
            Add NPC
          </button>
          <button
            v-if="collection.scope === 'custom'"
            class="btn btn-danger"
            @click="removeCollection(collection.id)"
          >
            Delete library
          </button>
        </div>
      </div>

      <div v-if="openedCollectionIds[collection.id] && collection.scope === 'system'" class="row wrap">
        <select v-model="collectionTargets[collection.id]" class="input-sm">
          <option value="">Select target library</option>
          <option v-for="target in customCollections" :key="target.id" :value="target.id">
            {{ target.name }}
          </option>
        </select>
        <span class="muted">Choose a custom library before copying a system NPC.</span>
      </div>

      <div v-if="openedCollectionIds[collection.id]" class="card-list">
        <article
          v-for="entry in libraryStore.getCollectionEntries(collection.id)"
          :key="entry.id"
          class="combatant-card"
        >
          <div class="split wrap row">
            <div>
              <h3 class="title">{{ entry.name }}</h3>
              <div class="muted">{{ entry.blueprint.type }}</div>
            </div>
            <div class="row wrap">
              <button class="btn" @click="copyEntryJson(entry.id)">Copy JSON</button>
              <button
                v-if="collection.scope === 'system'"
                class="btn btn-primary"
                @click="copyEntryToCollection(entry.id, collectionTargets[collection.id])"
              >
                Copy to library
              </button>
              <button
                v-if="collection.scope === 'custom'"
                class="btn"
                @click="toggleEditing(entry.id)"
              >
                {{ editingEntryIds[entry.id] ? "Hide editor" : "Edit" }}
              </button>
              <button
                v-if="collection.scope === 'custom'"
                class="btn btn-danger"
                @click="removeEntry(entry.id)"
              >
                Delete
              </button>
            </div>
          </div>

          <div class="muted">
            HP {{ entry.blueprint.hpCurrent ?? entry.blueprint.hpMax }}/{{ entry.blueprint.hpMax }}
            - AC {{ entry.blueprint.ac ?? "-" }}
            <span v-if="entry.blueprint.speed"> - {{ entry.blueprint.speed }}</span>
          </div>

          <PartyMemberEditor
            v-if="collection.scope === 'custom' && editingEntryIds[entry.id]"
            :combatant="editableEntries[entry.id]"
            @update="updateEntryCombatant(entry.id, $event)"
          />
        </article>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import PartyMemberEditor from "../components/PartyMemberEditor.vue";
import { useLibraryStore } from "../stores/libraryStore";
import type { Combatant } from "../models/types";
import { copyText } from "../utils/clipboard";
import { blueprintToEditableCombatant, combatantToBlueprint } from "../utils/combatantBlueprints";

const libraryStore = useLibraryStore();
const newCollectionName = ref("");
const collectionTargets = reactive<Record<string, string>>({});
const editingEntryIds = reactive<Record<string, boolean>>({});
const openedCollectionIds = reactive<Record<string, boolean>>({});

const customCollections = computed(() =>
  libraryStore.orderedCollections.filter((collection) => collection.scope === "custom")
);

const editableEntries = computed<Record<string, Combatant>>(() =>
  Object.fromEntries(
    libraryStore.bestiaryEntries.map((entry) => [
      entry.id,
      blueprintToEditableCombatant(entry.id, entry.blueprint)
    ])
  )
);

async function createCollection() {
  const collectionId = await libraryStore.createBestiaryCollection(newCollectionName.value);
  openedCollectionIds[collectionId] = true;
  newCollectionName.value = "";
}

async function addNpc(collectionId: string) {
  await libraryStore.addEntryToCollection(
    collectionId,
    {
      type: "NPC",
      name: "New NPC",
      hpMax: 10,
      hpCurrent: 10,
      ac: 10,
      speed: "30 ft.",
      tags: []
    },
    "New NPC"
  );
}

async function copyEntryToCollection(entryId: string, collectionId?: string) {
  if (!collectionId) {
    window.alert("Create a custom NPC library and select it first.");
    return;
  }
  const entry = libraryStore.bestiaryEntries.find((item) => item.id === entryId);
  if (!entry) return;
  const entryName = window.prompt("NPC name", entry.name)?.trim();
  if (!entryName) return;
  await libraryStore.copyBestiaryEntry(entryId, collectionId, entryName);
}

async function updateEntryCombatant(entryId: string, patch: Partial<Combatant>) {
  const base = editableEntries.value[entryId];
  if (!base) return;
  const merged: Combatant = { ...base, ...patch };
  await libraryStore.updateBestiaryEntry(entryId, {
    name: merged.name,
    blueprint: combatantToBlueprint(merged)
  });
}

async function removeEntry(entryId: string) {
  if (!window.confirm("Delete NPC entry?")) return;
  await libraryStore.deleteBestiaryEntry(entryId);
}

async function removeCollection(collectionId: string) {
  if (!window.confirm("Delete NPC library and all entries?")) return;
  await libraryStore.deleteBestiaryCollection(collectionId);
}

function toggleEditing(entryId: string) {
  editingEntryIds[entryId] = !editingEntryIds[entryId];
}

function toggleCollectionOpen(collectionId: string) {
  openedCollectionIds[collectionId] = !openedCollectionIds[collectionId];
}

async function copyEntryJson(entryId: string) {
  const payload = libraryStore.exportBestiaryEntryPayload(entryId);
  if (!payload) return;
  await copyText(JSON.stringify(payload, null, 2));
}

async function copyCollectionJson(collectionId: string) {
  const payload = libraryStore.exportBestiaryCollectionPayload(collectionId);
  if (!payload) return;
  await copyText(JSON.stringify(payload, null, 2));
}
</script>
