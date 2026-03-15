<template>
  <div class="app-shell">
    <header class="app-top">
      <RouterLink to="/" class="brand">D&D Combat Tracker</RouterLink>
      <nav class="nav-links">
        <RouterLink to="/" class="about-link">Encounters</RouterLink>
        <RouterLink to="/parties" class="about-link">Parties</RouterLink>
        <RouterLink to="/about" class="about-link">About</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts"></script>
