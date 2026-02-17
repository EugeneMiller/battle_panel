<template>
  <div class="app-shell">
    <header class="app-top">
      <RouterLink to="/" class="brand">D&D Combat Tracker</RouterLink>
      <RouterLink to="/about" class="about-link">About</RouterLink>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts"></script>
