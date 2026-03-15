import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { db } from "../db/db";
import { makeId } from "../utils/id";
import type {
  CombatLogEntry,
  Combatant,
  ConditionEndPhase,
  ConditionInstance,
  Encounter,
  ImportPayload,
  LogActionType
} from "../models/types";
import { isImportPayload } from "../models/types";

type ImportStrategy = "replace" | "merge";

interface UndoSnapshot {
  encounterId: string;
  encounter: Encounter;
  combatants: Combatant[];
  conditions: ConditionInstance[];
}

function now(): number {
  return Date.now();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sortCombatants(list: Combatant[], mode: Encounter["sortMode"]): Combatant[] {
  const copy = [...list];
  if (mode === "manual") {
    return copy.sort((a, b) => (a.manualOrder ?? 0) - (b.manualOrder ?? 0));
  }

  return copy.sort((a, b) => {
    const aInit = a.initiative ?? Number.NEGATIVE_INFINITY;
    const bInit = b.initiative ?? Number.NEGATIVE_INFINITY;
    if (bInit !== aInit) return bInit - aInit;
    return (a.initiativeTieBreaker ?? 0) - (b.initiativeTieBreaker ?? 0);
  });
}

const defaultEncounterSettings = {
  confirmOnDelete: true,
  showHiddenByDefault: false
};

const MAX_UNDO = 30;

export const useEncounterStore = defineStore("encounter", () => {
  const initialized = ref(false);
  const encounters = ref<Encounter[]>([]);
  const combatants = ref<Combatant[]>([]);
  const conditions = ref<ConditionInstance[]>([]);
  const logs = ref<CombatLogEntry[]>([]);
  const undoStack = ref<UndoSnapshot[]>([]);

  const homeList = computed(() =>
    [...encounters.value].sort((a, b) => b.updatedAt - a.updatedAt)
  );

  async function init() {
    if (initialized.value) return;
    encounters.value = await db.encounters.toArray();
    combatants.value = await db.combatants.toArray();
    conditions.value = await db.conditions.toArray();
    logs.value = await db.logs.toArray();
    initialized.value = true;
  }

  function getEncounterById(encounterId: string): Encounter | undefined {
    return encounters.value.find((e) => e.id === encounterId);
  }

  function getCombatantsForEncounter(encounterId: string): Combatant[] {
    const encounter = getEncounterById(encounterId);
    if (!encounter) return [];
    const list = combatants.value.filter((c) => c.encounterId === encounterId);
    return sortCombatants(list, encounter.sortMode);
  }

  function getConditionsForCombatant(combatantId: string): ConditionInstance[] {
    return conditions.value
      .filter((c) => c.combatantId === combatantId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  function getActiveCombatant(encounterId: string): Combatant | undefined {
    const encounter = getEncounterById(encounterId);
    if (!encounter) return undefined;
    const list = getCombatantsForEncounter(encounterId);
    return list[encounter.turnIndex];
  }

  async function persistEncounter(encounter: Encounter) {
    encounter.updatedAt = now();
    await db.encounters.put(encounter);
  }

  async function persistCombatant(combatant: Combatant) {
    const normalized = clone(combatant);
    await db.combatants.put(normalized);
    const encounter = getEncounterById(normalized.encounterId);
    if (encounter) {
      encounter.updatedAt = now();
      await db.encounters.put(encounter);
    }
  }

  async function addLog(
    encounterId: string,
    actionType: LogActionType,
    payload: Record<string, unknown>,
    combatantId?: string
  ) {
    const log: CombatLogEntry = {
      id: makeId(),
      encounterId,
      timestamp: now(),
      combatantId,
      actionType,
      payload
    };
    logs.value.push(log);
    await db.logs.put(log);
  }

  async function recordUndo(encounterId: string) {
    const encounter = getEncounterById(encounterId);
    if (!encounter) return;
    const snapshot: UndoSnapshot = {
      encounterId,
      encounter: clone(encounter),
      combatants: clone(combatants.value.filter((c) => c.encounterId === encounterId)),
      conditions: clone(conditions.value.filter((c) => c.encounterId === encounterId))
    };
    undoStack.value.push(snapshot);
    if (undoStack.value.length > MAX_UNDO) undoStack.value.shift();
  }

  async function undoLast() {
    const snapshot = undoStack.value.pop();
    if (!snapshot) return false;

    const encounter = getEncounterById(snapshot.encounterId);
    if (!encounter) return false;

    await db.transaction("rw", db.encounters, db.combatants, db.conditions, async () => {
      await db.encounters.put(snapshot.encounter);
      const existingCombatants = combatants.value.filter((c) => c.encounterId === snapshot.encounterId);
      const existingConditions = conditions.value.filter((c) => c.encounterId === snapshot.encounterId);
      await db.combatants.bulkDelete(existingCombatants.map((c) => c.id));
      await db.conditions.bulkDelete(existingConditions.map((c) => c.id));
      if (snapshot.combatants.length) await db.combatants.bulkPut(snapshot.combatants);
      if (snapshot.conditions.length) await db.conditions.bulkPut(snapshot.conditions);
    });

    encounters.value = encounters.value.map((e) =>
      e.id === snapshot.encounterId ? snapshot.encounter : e
    );
    combatants.value = [
      ...combatants.value.filter((c) => c.encounterId !== snapshot.encounterId),
      ...snapshot.combatants
    ];
    conditions.value = [
      ...conditions.value.filter((c) => c.encounterId !== snapshot.encounterId),
      ...snapshot.conditions
    ];

    return true;
  }

  async function createEncounter(name: string) {
    const stamp = now();
    const encounter: Encounter = {
      id: makeId(),
      name: name.trim() || "New Encounter",
      createdAt: stamp,
      updatedAt: stamp,
      round: 1,
      turnIndex: 0,
      isActive: true,
      sortMode: "initiative_desc",
      settings: { ...defaultEncounterSettings }
    };
    encounters.value.push(encounter);
    await db.encounters.put(encounter);
    return encounter.id;
  }

  async function duplicateEncounter(encounterId: string) {
    const src = getEncounterById(encounterId);
    if (!src) return null;
    const stamp = now();
    const newId = makeId();
    const encounter: Encounter = {
      ...clone(src),
      id: newId,
      name: `${src.name} (copy)`,
      createdAt: stamp,
      updatedAt: stamp,
      round: 1,
      turnIndex: 0,
      isActive: false
    };

    const srcCombatants = combatants.value.filter((c) => c.encounterId === encounterId);
    const srcConditions = conditions.value.filter((c) => c.encounterId === encounterId);

    const idMap = new Map<string, string>();
    const copiedCombatants = srcCombatants.map((c, idx) => {
      const newCombatantId = makeId();
      idMap.set(c.id, newCombatantId);
      return {
        ...clone(c),
        id: newCombatantId,
        encounterId: newId,
        initiativeTieBreaker: idx
      };
    });

    const copiedConditions = srcConditions.map((cond) => ({
      ...clone(cond),
      id: makeId(),
      encounterId: newId,
      combatantId: idMap.get(cond.combatantId) ?? cond.combatantId
    }));

    await db.transaction("rw", db.encounters, db.combatants, db.conditions, async () => {
      await db.encounters.put(encounter);
      if (copiedCombatants.length) await db.combatants.bulkPut(copiedCombatants);
      if (copiedConditions.length) await db.conditions.bulkPut(copiedConditions);
    });

    encounters.value.push(encounter);
    combatants.value.push(...copiedCombatants);
    conditions.value.push(...copiedConditions);
    return newId;
  }

  async function deleteEncounter(encounterId: string) {
    const relatedCombatants = combatants.value.filter((c) => c.encounterId === encounterId);
    const relatedConditions = conditions.value.filter((c) => c.encounterId === encounterId);
    const relatedLogs = logs.value.filter((l) => l.encounterId === encounterId);
    await db.transaction("rw", db.encounters, db.combatants, db.conditions, db.logs, async () => {
      await db.encounters.delete(encounterId);
      if (relatedCombatants.length) await db.combatants.bulkDelete(relatedCombatants.map((c) => c.id));
      if (relatedConditions.length) await db.conditions.bulkDelete(relatedConditions.map((c) => c.id));
      if (relatedLogs.length) await db.logs.bulkDelete(relatedLogs.map((l) => l.id));
    });
    encounters.value = encounters.value.filter((e) => e.id !== encounterId);
    combatants.value = combatants.value.filter((c) => c.encounterId !== encounterId);
    conditions.value = conditions.value.filter((c) => c.encounterId !== encounterId);
    logs.value = logs.value.filter((l) => l.encounterId !== encounterId);
  }

  async function addCombatant(
    encounterId: string,
    input: Partial<Combatant> & Pick<Combatant, "name" | "type" | "hpMax">
  ) {
    const currentCount = combatants.value.filter((c) => c.encounterId === encounterId).length;
    const combatant: Combatant = clone({
      id: makeId(),
      encounterId,
      type: input.type,
      name: input.name,
      initiative: input.initiative ?? null,
      initiativeTieBreaker: currentCount,
      manualOrder: currentCount,
      hpCurrent: input.hpCurrent ?? input.hpMax,
      hpMax: input.hpMax,
      tempHp: input.tempHp ?? 0,
      ac: input.ac ?? null,
      speed: input.speed,
      abilities: input.abilities,
      saves: input.saves,
      passives: input.passives,
      resistVulnImmune: input.resistVulnImmune,
      tags: input.tags ?? [],
      isExpanded: input.isExpanded ?? false,
      isHidden: input.isHidden ?? false,
      isConcentrating: input.isConcentrating ?? false,
      publicNotes: input.publicNotes,
      gmNotes: input.gmNotes,
      attacks: input.attacks,
      deathSaves: input.deathSaves,
      multiattackCount: input.multiattackCount,
      spellcasting: input.spellcasting
    });
    combatants.value.push(combatant);
    await persistCombatant(combatant);
    return combatant.id;
  }

  async function updateCombatant(combatantId: string, patch: Partial<Combatant>) {
    const index = combatants.value.findIndex((c) => c.id === combatantId);
    if (index < 0) return;
    const merged = clone({ ...combatants.value[index], ...patch });
    combatants.value[index] = merged;
    await persistCombatant(merged);
  }

  async function removeCombatant(combatantId: string) {
    const combatant = combatants.value.find((c) => c.id === combatantId);
    if (!combatant) return;
    await recordUndo(combatant.encounterId);
    const condIds = conditions.value
      .filter((c) => c.combatantId === combatantId)
      .map((c) => c.id);
    await db.transaction("rw", db.combatants, db.conditions, async () => {
      await db.combatants.delete(combatantId);
      if (condIds.length) await db.conditions.bulkDelete(condIds);
    });
    combatants.value = combatants.value.filter((c) => c.id !== combatantId);
    conditions.value = conditions.value.filter((c) => c.combatantId !== combatantId);
  }

  async function sortByInitiative(encounterId: string) {
    const encounter = getEncounterById(encounterId);
    if (!encounter) return;
    await recordUndo(encounterId);
    encounter.sortMode = "initiative_desc";
    const list = getCombatantsForEncounter(encounterId);
    const updated = list.map((c, index) => ({
      ...c,
      initiativeTieBreaker: c.initiativeTieBreaker ?? index
    }));
    combatants.value = [
      ...combatants.value.filter((c) => c.encounterId !== encounterId),
      ...updated
    ];
    await db.transaction("rw", db.encounters, db.combatants, async () => {
      await persistEncounter(encounter);
      await db.combatants.bulkPut(updated);
    });
    await addLog(encounterId, "sort_initiative", { combatants: updated.length });
  }

  async function setManualOrder(encounterId: string, orderedCombatantIds: string[]) {
    const encounter = getEncounterById(encounterId);
    if (!encounter) return;
    await recordUndo(encounterId);
    encounter.sortMode = "manual";
    const map = new Map<string, number>();
    orderedCombatantIds.forEach((id, index) => map.set(id, index));
    const updated = combatants.value.map((c) => {
      if (c.encounterId !== encounterId) return c;
      return { ...c, manualOrder: map.get(c.id) ?? c.manualOrder ?? 0 };
    });
    combatants.value = updated;
    await db.transaction("rw", db.encounters, db.combatants, async () => {
      await persistEncounter(encounter);
      const changed = updated.filter((c) => c.encounterId === encounterId);
      await db.combatants.bulkPut(changed);
    });
  }

  async function tickRoundConditions(combatantId: string, phase: ConditionEndPhase) {
    const affected = conditions.value.filter(
      (cond) =>
        cond.combatantId === combatantId &&
        cond.durationType === "rounds" &&
        cond.endsOn === phase &&
        typeof cond.durationRemaining === "number"
    );
    if (!affected.length) return;

    const toUpdate: ConditionInstance[] = [];
    const toDelete: string[] = [];
    for (const condition of affected) {
      const next = (condition.durationRemaining ?? 0) - 1;
      if (next <= 0) toDelete.push(condition.id);
      else toUpdate.push({ ...condition, durationRemaining: next });
    }

    await db.transaction("rw", db.conditions, async () => {
      if (toUpdate.length) await db.conditions.bulkPut(toUpdate);
      if (toDelete.length) await db.conditions.bulkDelete(toDelete);
    });

    conditions.value = conditions.value
      .filter((c) => !toDelete.includes(c.id))
      .map((c) => toUpdate.find((u) => u.id === c.id) ?? c);
  }

  async function nextTurn(encounterId: string) {
    const encounter = getEncounterById(encounterId);
    if (!encounter) return;
    const ordered = getCombatantsForEncounter(encounterId);
    if (!ordered.length) return;
    await recordUndo(encounterId);

    const current = ordered[encounter.turnIndex];
    if (current) await tickRoundConditions(current.id, "end_of_turn");

    let nextIndex = encounter.turnIndex + 1;
    let wrapped = false;
    if (nextIndex >= ordered.length) {
      nextIndex = 0;
      wrapped = true;
    }
    encounter.turnIndex = nextIndex;
    if (wrapped) encounter.round += 1;

    const active = ordered[nextIndex];
    if (active) await tickRoundConditions(active.id, "start_of_turn");

    await collapseInactiveCombatants(encounterId, active?.id);
    await persistEncounter(encounter);
    await addLog(encounterId, "next_turn", { turnIndex: encounter.turnIndex, round: encounter.round }, active?.id);
  }

  async function prevTurn(encounterId: string) {
    const encounter = getEncounterById(encounterId);
    if (!encounter) return;
    const ordered = getCombatantsForEncounter(encounterId);
    if (!ordered.length) return;
    await recordUndo(encounterId);

    let nextIndex = encounter.turnIndex - 1;
    if (nextIndex < 0) {
      nextIndex = ordered.length - 1;
      encounter.round = Math.max(1, encounter.round - 1);
    }
    encounter.turnIndex = nextIndex;
    await persistEncounter(encounter);
    const active = ordered[nextIndex];
    await collapseInactiveCombatants(encounterId, active?.id);
    await addLog(encounterId, "prev_turn", { turnIndex: encounter.turnIndex, round: encounter.round }, active?.id);
  }

  async function applyDamage(combatantId: string, amount: number) {
    const combatant = combatants.value.find((c) => c.id === combatantId);
    if (!combatant || amount <= 0) return;
    await recordUndo(combatant.encounterId);

    const absorb = Math.min(combatant.tempHp, amount);
    const remainingDamage = amount - absorb;
    const updated: Combatant = {
      ...combatant,
      tempHp: combatant.tempHp - absorb,
      hpCurrent: clamp(combatant.hpCurrent - remainingDamage, 0, combatant.hpMax)
    };
    await updateCombatant(combatantId, updated);
    await addLog(combatant.encounterId, "damage", { amount }, combatantId);
  }

  async function heal(combatantId: string, amount: number) {
    const combatant = combatants.value.find((c) => c.id === combatantId);
    if (!combatant || amount <= 0) return;
    await recordUndo(combatant.encounterId);
    const updated: Combatant = {
      ...combatant,
      hpCurrent: clamp(combatant.hpCurrent + amount, 0, combatant.hpMax)
    };
    await updateCombatant(combatantId, updated);
    await addLog(combatant.encounterId, "heal", { amount }, combatantId);
  }

  async function setHp(combatantId: string, value: number) {
    const combatant = combatants.value.find((c) => c.id === combatantId);
    if (!combatant) return;
    await recordUndo(combatant.encounterId);
    const updated = { ...combatant, hpCurrent: clamp(value, 0, combatant.hpMax) };
    await updateCombatant(combatantId, updated);
    await addLog(combatant.encounterId, "set_hp", { value: updated.hpCurrent }, combatantId);
  }

  async function setTempHp(combatantId: string, value: number) {
    const combatant = combatants.value.find((c) => c.id === combatantId);
    if (!combatant) return;
    await recordUndo(combatant.encounterId);
    const updated = { ...combatant, tempHp: Math.max(0, value) };
    await updateCombatant(combatantId, updated);
  }

  async function addCondition(
    combatantId: string,
    input: Omit<ConditionInstance, "id" | "combatantId" | "encounterId" | "createdAt">
  ) {
    const combatant = combatants.value.find((c) => c.id === combatantId);
    if (!combatant) return;
    await recordUndo(combatant.encounterId);
    const condition: ConditionInstance = {
      ...input,
      id: makeId(),
      combatantId,
      encounterId: combatant.encounterId,
      createdAt: now()
    };
    conditions.value.push(condition);
    await db.conditions.put(condition);
    await addLog(combatant.encounterId, "add_condition", { name: condition.name }, combatantId);
  }

  async function removeCondition(conditionId: string) {
    const condition = conditions.value.find((c) => c.id === conditionId);
    if (!condition) return;
    await recordUndo(condition.encounterId);
    conditions.value = conditions.value.filter((c) => c.id !== conditionId);
    await db.conditions.delete(conditionId);
    await addLog(condition.encounterId, "remove_condition", { conditionId }, condition.combatantId);
  }

  async function updateCondition(conditionId: string, patch: Partial<ConditionInstance>) {
    const index = conditions.value.findIndex((c) => c.id === conditionId);
    if (index < 0) return;
    const current = conditions.value[index];
    await recordUndo(current.encounterId);
    const updated: ConditionInstance = { ...current, ...patch, id: current.id };
    conditions.value[index] = updated;
    await db.conditions.put(updated);
  }

  async function breakConcentration(combatantId: string) {
    const combatant = combatants.value.find((c) => c.id === combatantId);
    if (!combatant) return;
    if (!combatant.isConcentrating) return;
    await recordUndo(combatant.encounterId);
    await updateCombatant(combatantId, { isConcentrating: false });
    await addLog(combatant.encounterId, "break_concentration", { removed: 0 }, combatantId);
  }

  async function modifySlot(combatantId: string, level: number, delta: 1 | -1) {
    const combatant = combatants.value.find((c) => c.id === combatantId);
    if (!combatant?.spellcasting) return;
    await recordUndo(combatant.encounterId);
    const spellcasting = clone(combatant.spellcasting);
    if (spellcasting.mode === "slots" && spellcasting.slots) {
      const slot = spellcasting.slots.find((s) => s.level === level);
      if (!slot) return;
      slot.used = clamp(slot.used + delta, 0, slot.max);
    } else if (spellcasting.mode === "pact" && spellcasting.pact) {
      spellcasting.pact.used = clamp(spellcasting.pact.used + delta, 0, spellcasting.pact.max);
    } else {
      return;
    }
    await updateCombatant(combatantId, { spellcasting });
    await addLog(
      combatant.encounterId,
      delta > 0 ? "slot_used" : "slot_restored",
      { level, delta },
      combatantId
    );
  }

  async function toggleCombatantExpanded(combatantId: string) {
    const combatant = combatants.value.find((c) => c.id === combatantId);
    if (!combatant) return;
    await updateCombatant(combatantId, { isExpanded: !combatant.isExpanded });
  }

  async function collapseInactiveCombatants(encounterId: string, activeCombatantId?: string) {
    if (!activeCombatantId) return;
    const changed: Combatant[] = [];
    const updated = combatants.value.map((combatant) => {
      if (combatant.encounterId !== encounterId) return combatant;
      if (combatant.id === activeCombatantId) {
        if (combatant.isExpanded) return combatant;
        const next = { ...combatant, isExpanded: true };
        changed.push(next);
        return next;
      }
      if (!combatant.isExpanded) return combatant;
      const next = { ...combatant, isExpanded: false };
      changed.push(next);
      return next;
    });
    if (!changed.length) return;
    combatants.value = updated;
    await db.transaction("rw", db.combatants, async () => {
      await db.combatants.bulkPut(changed);
    });
  }

  async function toggleSpellsVisible(combatantId: string) {
    const combatant = combatants.value.find((c) => c.id === combatantId);
    if (!combatant?.spellcasting) return;
    await updateCombatant(combatantId, {
      spellcasting: { ...combatant.spellcasting, showSpells: !combatant.spellcasting.showSpells }
    });
  }

  async function clearEncounterState(encounterId: string) {
    const encounter = getEncounterById(encounterId);
    if (!encounter) return;
    await recordUndo(encounterId);
    encounter.round = 1;
    encounter.turnIndex = 0;
    const updatedCombatants = combatants.value.map((c) =>
      c.encounterId === encounterId ? { ...c, initiative: null, tempHp: 0 } : c
    );
    combatants.value = updatedCombatants;
    await db.transaction("rw", db.encounters, db.combatants, async () => {
      await persistEncounter(encounter);
      await db.combatants.bulkPut(updatedCombatants.filter((c) => c.encounterId === encounterId));
    });
  }

  function logsForEncounter(encounterId: string): CombatLogEntry[] {
    return logs.value
      .filter((l) => l.encounterId === encounterId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  function exportPayload(encounterId?: string): ImportPayload {
    if (!encounterId) {
      return {
        version: 1,
        exportedAt: now(),
        encounters: clone(encounters.value),
        combatants: clone(combatants.value),
        conditions: clone(conditions.value),
        logs: clone(logs.value)
      };
    }
    return {
      version: 1,
      exportedAt: now(),
      encounters: clone(encounters.value.filter((e) => e.id === encounterId)),
      combatants: clone(combatants.value.filter((c) => c.encounterId === encounterId)),
      conditions: clone(conditions.value.filter((c) => c.encounterId === encounterId)),
      logs: clone(logs.value.filter((l) => l.encounterId === encounterId))
    };
  }

  function exportAsJson(encounterId?: string): string {
    return JSON.stringify(exportPayload(encounterId), null, 2);
  }

  async function importFromJson(rawJson: string, strategy: ImportStrategy = "replace") {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!isImportPayload(parsed)) throw new Error("Invalid import payload");
    const payload = parsed;

    if (strategy === "replace") {
      await db.transaction("rw", db.encounters, db.combatants, db.conditions, db.logs, async () => {
        await db.encounters.clear();
        await db.combatants.clear();
        await db.conditions.clear();
        await db.logs.clear();
        if (payload.encounters.length) await db.encounters.bulkPut(payload.encounters);
        if (payload.combatants.length) await db.combatants.bulkPut(payload.combatants);
        if (payload.conditions.length) await db.conditions.bulkPut(payload.conditions);
        if (payload.logs.length) await db.logs.bulkPut(payload.logs);
      });
      encounters.value = payload.encounters;
      combatants.value = payload.combatants;
      conditions.value = payload.conditions;
      logs.value = payload.logs;
      return;
    }

    await db.transaction("rw", db.encounters, db.combatants, db.conditions, db.logs, async () => {
      if (payload.encounters.length) await db.encounters.bulkPut(payload.encounters);
      if (payload.combatants.length) await db.combatants.bulkPut(payload.combatants);
      if (payload.conditions.length) await db.conditions.bulkPut(payload.conditions);
      if (payload.logs.length) await db.logs.bulkPut(payload.logs);
    });
    encounters.value = await db.encounters.toArray();
    combatants.value = await db.combatants.toArray();
    conditions.value = await db.conditions.toArray();
    logs.value = await db.logs.toArray();
  }

  return {
    initialized,
    encounters,
    combatants,
    conditions,
    logs,
    homeList,
    init,
    getEncounterById,
    getCombatantsForEncounter,
    getConditionsForCombatant,
    getActiveCombatant,
    createEncounter,
    duplicateEncounter,
    deleteEncounter,
    addCombatant,
    updateCombatant,
    removeCombatant,
    sortByInitiative,
    setManualOrder,
    nextTurn,
    prevTurn,
    applyDamage,
    heal,
    setHp,
    setTempHp,
    addCondition,
    updateCondition,
    removeCondition,
    breakConcentration,
    modifySlot,
    toggleCombatantExpanded,
    toggleSpellsVisible,
    clearEncounterState,
    logsForEncounter,
    exportAsJson,
    importFromJson,
    undoLast
  };
});
