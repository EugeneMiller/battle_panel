<template>
  <section class="page">
    <h2>About</h2>
    <p>Offline-friendly D&D 5e combat tracker as a PWA.</p>
    <p>Version: {{ APP_VERSION }}</p>
    <p>Data format version: 2</p>
  </section>
</template>

<script setup lang="ts">
import { APP_VERSION } from "../pwa/version";
</script>
