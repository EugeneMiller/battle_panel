# Battle Panel 1.1 Roadmap

## Goal
Version `1.1` expands the app from a single encounter tracker into a small DM workspace with reusable player and NPC libraries.

## Phases
1. Data foundation
   - Add IndexedDB tables and TypeScript models for parties and bestiary collections.
   - Seed a `Default Party` with level 1 class templates from `Players Handbook`.
   - Seed a core bestiary collection with baseline NPC and monster entries.
   - Define reusable JSON payloads for single entries and whole collections.
2. Parties
   - Add a `Parties` screen with custom party creation.
   - Allow copying a system class template into a DM party with a prompted character name.
   - Allow editing party members after creation.
   - Allow exporting one party member or the whole party as JSON.
   - Allow loading JSON payloads from a party into an encounter.
3. Bestiary
   - Add a `Bestiary` screen with a system library plus DM-owned libraries.
   - Allow adding custom NPC entries and organizing them by collection.
   - Allow exporting a single system NPC as JSON.
   - Allow loading one NPC or an entire custom collection into an encounter.
4. Help and finish
   - Add a `Help` screen with short usage instructions for encounter flow, parties, bestiary, and JSON import/export.
   - Update navigation and small UX copy for the new workspace structure.
   - Run type-check/build verification and prepare release notes for `1.1`.
