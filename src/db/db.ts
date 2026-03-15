import Dexie, { type Table } from "dexie";
import type {
  BestiaryCollection,
  BestiaryEntry,
  CombatLogEntry,
  Combatant,
  ConditionInstance,
  Encounter,
  Party,
  PartyMemberTemplate
} from "../models/types";

export class BattleDb extends Dexie {
  encounters!: Table<Encounter, string>;
  combatants!: Table<Combatant, string>;
  conditions!: Table<ConditionInstance, string>;
  logs!: Table<CombatLogEntry, string>;
  parties!: Table<Party, string>;
  partyMembers!: Table<PartyMemberTemplate, string>;
  bestiaryCollections!: Table<BestiaryCollection, string>;
  bestiaryEntries!: Table<BestiaryEntry, string>;

  constructor() {
    super("battle-panel-db");

    this.version(1).stores({
      encounters: "id, createdAt, updatedAt, isActive",
      combatants: "id, encounterId, name",
      conditions: "id, combatantId, encounterId, name",
      logs: "id, encounterId, timestamp"
    });

    this.version(2).stores({
      encounters: "id, createdAt, updatedAt, isActive",
      combatants: "id, encounterId, name",
      conditions: "id, combatantId, encounterId, name",
      logs: "id, encounterId, timestamp",
      parties: "id, scope, updatedAt, isDefault",
      partyMembers: "id, partyId, order, name",
      bestiaryCollections: "id, scope, updatedAt",
      bestiaryEntries: "id, collectionId, order, name"
    });
  }
}

export const db = new BattleDb();
