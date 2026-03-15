import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { db } from "../db/db";
import {
  defaultParty,
  defaultPartyMembers,
  systemBestiaryCollection,
  systemBestiaryEntries
} from "../data/defaultLibraries";
import type {
  BestiaryCollection,
  BestiaryEntry,
  CombatantBlueprint,
  Party,
  PartyMemberTemplate
} from "../models/types";
import { DATA_FORMAT_VERSION } from "../models/types";
import { makeId } from "../utils/id";
import type {
  BestiaryCollectionPayload,
  CombatantBlueprintPayload,
  PartyPayload
} from "../utils/libraryPayloads";

function now(): number {
  return Date.now();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const useLibraryStore = defineStore("library", () => {
  const initialized = ref(false);
  const parties = ref<Party[]>([]);
  const partyMembers = ref<PartyMemberTemplate[]>([]);
  const bestiaryCollections = ref<BestiaryCollection[]>([]);
  const bestiaryEntries = ref<BestiaryEntry[]>([]);

  const orderedParties = computed(() =>
    [...parties.value].sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      if (a.scope !== b.scope) return a.scope === "system" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
  );

  const orderedCollections = computed(() =>
    [...bestiaryCollections.value].sort((a, b) => {
      if (a.scope !== b.scope) return a.scope === "system" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
  );

  async function init() {
    if (initialized.value) return;
    parties.value = await db.parties.toArray();
    partyMembers.value = await db.partyMembers.toArray();
    bestiaryCollections.value = await db.bestiaryCollections.toArray();
    bestiaryEntries.value = await db.bestiaryEntries.toArray();
    await ensureDefaults();
    initialized.value = true;
  }

  async function ensureDefaults() {
    const writes: Promise<unknown>[] = [];

    if (!parties.value.some((party) => party.id === defaultParty.id)) {
      parties.value.push(clone(defaultParty));
      writes.push(db.parties.put(defaultParty));
    }
    if (!partyMembers.value.some((member) => member.partyId === defaultParty.id)) {
      partyMembers.value.push(...clone(defaultPartyMembers));
      writes.push(db.partyMembers.bulkPut(defaultPartyMembers));
    }
    if (!bestiaryCollections.value.some((collection) => collection.id === systemBestiaryCollection.id)) {
      bestiaryCollections.value.push(clone(systemBestiaryCollection));
      writes.push(db.bestiaryCollections.put(systemBestiaryCollection));
    }
    if (!bestiaryEntries.value.some((entry) => entry.collectionId === systemBestiaryCollection.id)) {
      bestiaryEntries.value.push(...clone(systemBestiaryEntries));
      writes.push(db.bestiaryEntries.bulkPut(systemBestiaryEntries));
    }

    if (writes.length) await Promise.all(writes);
  }

  function getPartyMembers(partyId: string): PartyMemberTemplate[] {
    return partyMembers.value
      .filter((member) => member.partyId === partyId)
      .sort((a, b) => a.order - b.order);
  }

  function getCollectionEntries(collectionId: string): BestiaryEntry[] {
    return bestiaryEntries.value
      .filter((entry) => entry.collectionId === collectionId)
      .sort((a, b) => a.order - b.order);
  }

  async function createParty(name: string) {
    const stamp = now();
    const party: Party = {
      id: makeId(),
      name: name.trim() || "New Party",
      scope: "custom",
      isDefault: false,
      createdAt: stamp,
      updatedAt: stamp
    };
    parties.value.push(party);
    await db.parties.put(party);
    return party.id;
  }

  async function addMemberToParty(
    partyId: string,
    blueprint: CombatantBlueprint,
    name: string,
    meta: Pick<PartyMemberTemplate, "className" | "level"> = {}
  ) {
    const order = getPartyMembers(partyId).length;
    const member: PartyMemberTemplate = {
      id: makeId(),
      partyId,
      order,
      name,
      className: meta.className,
      level: meta.level,
      blueprint: { ...clone(blueprint), name }
    };
    partyMembers.value.push(member);
    await db.partyMembers.put(member);
    return member.id;
  }

  async function copyMemberToParty(memberId: string, targetPartyId: string, characterName: string) {
    const member = partyMembers.value.find((item) => item.id === memberId);
    if (!member) return null;
    return addMemberToParty(
      targetPartyId,
      { ...clone(member.blueprint), name: characterName },
      characterName,
      { className: member.className, level: member.level }
    );
  }

  async function updatePartyMember(memberId: string, patch: Partial<PartyMemberTemplate>) {
    const index = partyMembers.value.findIndex((item) => item.id === memberId);
    if (index < 0) return;
    const current = partyMembers.value[index];
    const updated: PartyMemberTemplate = {
      ...current,
      ...patch,
      id: current.id,
      blueprint: patch.blueprint ? clone(patch.blueprint) : current.blueprint
    };
    partyMembers.value[index] = updated;
    await db.partyMembers.put(updated);
  }

  async function deletePartyMember(memberId: string) {
    partyMembers.value = partyMembers.value.filter((item) => item.id !== memberId);
    await db.partyMembers.delete(memberId);
  }

  async function createBestiaryCollection(name: string) {
    const stamp = now();
    const collection: BestiaryCollection = {
      id: makeId(),
      name: name.trim() || "New NPC Library",
      scope: "custom",
      createdAt: stamp,
      updatedAt: stamp
    };
    bestiaryCollections.value.push(collection);
    await db.bestiaryCollections.put(collection);
    return collection.id;
  }

  async function addEntryToCollection(collectionId: string, blueprint: CombatantBlueprint, name: string) {
    const order = getCollectionEntries(collectionId).length;
    const entry: BestiaryEntry = {
      id: makeId(),
      collectionId,
      order,
      name,
      blueprint: { ...clone(blueprint), name }
    };
    bestiaryEntries.value.push(entry);
    await db.bestiaryEntries.put(entry);
    return entry.id;
  }

  async function copyBestiaryEntry(entryId: string, targetCollectionId: string, entryName: string) {
    const entry = bestiaryEntries.value.find((item) => item.id === entryId);
    if (!entry) return null;
    return addEntryToCollection(
      targetCollectionId,
      { ...clone(entry.blueprint), name: entryName },
      entryName
    );
  }

  async function updateBestiaryEntry(entryId: string, patch: Partial<BestiaryEntry>) {
    const index = bestiaryEntries.value.findIndex((item) => item.id === entryId);
    if (index < 0) return;
    const current = bestiaryEntries.value[index];
    const updated: BestiaryEntry = {
      ...current,
      ...patch,
      id: current.id,
      blueprint: patch.blueprint ? clone(patch.blueprint) : current.blueprint
    };
    bestiaryEntries.value[index] = updated;
    await db.bestiaryEntries.put(updated);
  }

  async function deleteBestiaryEntry(entryId: string) {
    bestiaryEntries.value = bestiaryEntries.value.filter((item) => item.id !== entryId);
    await db.bestiaryEntries.delete(entryId);
  }

  function exportMemberPayload(memberId: string): CombatantBlueprintPayload | null {
    const member = partyMembers.value.find((item) => item.id === memberId);
    if (!member) return null;
    return {
      version: DATA_FORMAT_VERSION,
      kind: "combatant_blueprint",
      exportedAt: now(),
      combatant: clone(member.blueprint)
    };
  }

  function exportPartyPayload(partyId: string): PartyPayload | null {
    const party = parties.value.find((item) => item.id === partyId);
    if (!party) return null;
    return {
      version: DATA_FORMAT_VERSION,
      kind: "party",
      exportedAt: now(),
      party: {
        name: party.name,
        scope: party.scope,
        isDefault: party.isDefault
      },
      members: clone(getPartyMembers(partyId))
    };
  }

  function exportBestiaryEntryPayload(entryId: string): CombatantBlueprintPayload | null {
    const entry = bestiaryEntries.value.find((item) => item.id === entryId);
    if (!entry) return null;
    return {
      version: DATA_FORMAT_VERSION,
      kind: "combatant_blueprint",
      exportedAt: now(),
      combatant: clone(entry.blueprint)
    };
  }

  function exportBestiaryCollectionPayload(collectionId: string): BestiaryCollectionPayload | null {
    const collection = bestiaryCollections.value.find((item) => item.id === collectionId);
    if (!collection) return null;
    return {
      version: DATA_FORMAT_VERSION,
      kind: "bestiary_collection",
      exportedAt: now(),
      collection: {
        name: collection.name,
        scope: collection.scope
      },
      entries: clone(getCollectionEntries(collectionId))
    };
  }

  return {
    initialized,
    parties,
    partyMembers,
    bestiaryCollections,
    bestiaryEntries,
    orderedParties,
    orderedCollections,
    init,
    getPartyMembers,
    getCollectionEntries,
    createParty,
    addMemberToParty,
    copyMemberToParty,
    updatePartyMember,
    deletePartyMember,
    createBestiaryCollection,
    addEntryToCollection,
    copyBestiaryEntry,
    updateBestiaryEntry,
    deleteBestiaryEntry,
    exportMemberPayload,
    exportPartyPayload,
    exportBestiaryEntryPayload,
    exportBestiaryCollectionPayload
  };
});
