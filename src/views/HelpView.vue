<template>
  <section class="page">
    <article class="home-card">
      <h2>Help</h2>
      <p class="muted">Battle Panel 1.1 keeps encounters, party templates, and NPC libraries in one offline workspace.</p>
    </article>

    <article class="home-card">
      <h3>Encounters</h3>
      <p>Create an encounter on the home screen, add combatants manually, or paste JSON exported from a party, a single NPC sheet, or a whole custom library.</p>
      <p>Inside an encounter you can track initiative, HP, conditions, spell slots, and export any combatant back into reusable JSON.</p>
    </article>

    <article class="home-card">
      <h3>Parties</h3>
      <p><code>Default Party</code> contains level 1 class templates for the core Players Handbook classes. Pick a custom party, copy a template, enter the character name, then edit the copied sheet.</p>
      <p>Use <code>Copy JSON</code> on one hero or the whole party and paste that JSON into the encounter import box.</p>
    </article>

    <article class="home-card">
      <h3>Bestiary</h3>
      <p>The system bestiary is a starting NPC and monster library. Copy any system sheet into your own library when you need a customized version.</p>
      <p>Custom libraries support single-entry JSON export and full-library JSON export, so you can drop one NPC or a whole prepared roster into battle.</p>
    </article>

    <article class="home-card">
      <h3>JSON Formats</h3>
      <p>The app accepts three portable payloads: one combatant blueprint, one full party, or one bestiary collection. All of them can be pasted directly into the encounter import field.</p>
      <p>If clipboard access is blocked by the browser, the app falls back to a manual copy prompt.</p>
    </article>
  </section>
</template>

<script setup lang="ts"></script>
