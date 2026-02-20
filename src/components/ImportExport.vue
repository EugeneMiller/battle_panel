<template>
  <section class="import-export">
    <h3>Import / Export</h3>
    <div class="row wrap">
      <button v-if="showAllExport" class="btn" @click="$emit('export-all')">Export all</button>
      <button v-if="showEncounterExport" class="btn" @click="$emit('export-encounter')">Export encounter</button>
      <select v-model="strategy" class="input-sm">
        <option value="replace">Replace</option>
        <option value="merge">Merge</option>
      </select>
      <button class="btn btn-primary" @click="$emit('import', jsonText, strategy)">Import JSON</button>
    </div>
    <textarea v-model="jsonText" class="json-box" placeholder="Paste JSON here"></textarea>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    showAllExport?: boolean;
    showEncounterExport?: boolean;
  }>(),
  {
    showAllExport: true,
    showEncounterExport: true
  }
);

const jsonText = ref("");
const strategy = ref<"replace" | "merge">("replace");

defineEmits<{
  "export-all": [];
  "export-encounter": [];
  import: [json: string, strategy: "replace" | "merge"];
}>();
</script>
