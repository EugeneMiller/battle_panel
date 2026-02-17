<template>
  <section class="page">
    <h2>Encounters</h2>
    <div class="row wrap">
      <input v-model="newEncounterName" class="input" placeholder="Encounter name" />
      <button class="btn btn-primary" @click="create">Create encounter</button>
    </div>

    <div class="card-list">
      <article v-for="encounter in store.homeList" :key="encounter.id" class="home-card">
        <div>
          <h3>{{ encounter.name }}</h3>
          <div class="muted">{{ new Date(encounter.updatedAt).toLocaleString() }}</div>
        </div>
        <div class="row wrap">
          <RouterLink class="btn" :to="`/encounter/${encounter.id}`">Open</RouterLink>
          <button class="btn" @click="duplicate(encounter.id)">Duplicate</button>
          <button class="btn btn-danger" @click="remove(encounter.id)">Delete</button>
        </div>
      </article>
      <p v-if="!store.homeList.length" class="muted">No encounters yet</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useEncounterStore } from "../stores/encounterStore";

const router = useRouter();
const store = useEncounterStore();
const newEncounterName = ref("");

async function create() {
  const id = await store.createEncounter(newEncounterName.value);
  newEncounterName.value = "";
  await router.push(`/encounter/${id}`);
}

async function duplicate(encounterId: string) {
  const id = await store.duplicateEncounter(encounterId);
  if (id) await router.push(`/encounter/${id}`);
}

async function remove(encounterId: string) {
  const encounter = store.getEncounterById(encounterId);
  if (!encounter) return;
  if (encounter.settings.confirmOnDelete && !window.confirm("Delete encounter?")) return;
  await store.deleteEncounter(encounterId);
}
</script>
