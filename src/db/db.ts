import Dexie, { type Table } from "dexie";
import type { CombatLogEntry, Combatant, ConditionInstance, Encounter } from "../models/types";

export class BattleDb extends Dexie {
  encounters!: Table<Encounter, string>;
  combatants!: Table<Combatant, string>;
  conditions!: Table<ConditionInstance, string>;
  logs!: Table<CombatLogEntry, string>;

  constructor() {
    super("battle-panel-db");

    this.version(1).stores({
      encounters: "id, createdAt, updatedAt, isActive",
      combatants: "id, encounterId, name",
      conditions: "id, combatantId, encounterId, name",
      logs: "id, encounterId, timestamp"
    });
  }
}

export const db = new BattleDb();
