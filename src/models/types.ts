export type SortMode = "initiative_desc" | "manual";
export type CombatantType = "PC" | "NPC" | "Monster" | "Summon";
export type ConditionName = string;
export type DurationType = "rounds" | "minutes" | "hours" | "until_discarded";
export type ConditionEndPhase = "start_of_turn" | "end_of_turn";

export interface EncounterSettings {
  confirmOnDelete: boolean;
  showHiddenByDefault: boolean;
}

export interface Encounter {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  round: number;
  turnIndex: number;
  isActive: boolean;
  sortMode: SortMode;
  notes?: string;
  settings: EncounterSettings;
}

export interface AbilityBlock {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface SaveBlock {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
}

export interface PassiveBlock {
  perception?: number;
  insight?: number;
}

export interface ResistVulnImmune {
  resist?: string[];
  vuln?: string[];
  immune?: string[];
}

export interface DeathSaves {
  success: number;
  fail: number;
}

export interface SpellEntry {
  id: string;
  name: string;
  level: number;
  school?: string;
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  notes?: string;
}

export interface SlotResource {
  level: number;
  max: number;
  used: number;
}

export interface PactResource {
  slotLevel: number;
  max: number;
  used: number;
}

export interface SpellcastingBlock {
  mode: "slots" | "pact";
  slots?: SlotResource[];
  pact?: PactResource;
  spellsKnown?: SpellEntry[];
  preparedSpells?: SpellEntry[];
  spellNotes?: string;
  showSpells: boolean;
}

export interface Combatant {
  id: string;
  encounterId: string;
  type: CombatantType;
  name: string;
  initiative: number | null;
  initiativeTieBreaker?: number;
  manualOrder?: number;
  hpCurrent: number;
  hpMax: number;
  tempHp: number;
  ac: number | null;
  speed?: string;
  abilities?: AbilityBlock;
  saves?: SaveBlock;
  passives?: PassiveBlock;
  resistVulnImmune?: ResistVulnImmune;
  tags?: string[];
  isExpanded: boolean;
  isHidden: boolean;
  publicNotes?: string;
  gmNotes?: string;
  deathSaves?: DeathSaves;
  spellcasting?: SpellcastingBlock;
}

export interface ConditionInstance {
  id: string;
  combatantId: string;
  encounterId: string;
  name: ConditionName;
  source?: string;
  durationType: DurationType;
  durationRemaining?: number;
  endsOn?: ConditionEndPhase;
  concentration?: boolean;
  notes?: string;
  createdAt: number;
}

export type LogActionType =
  | "damage"
  | "heal"
  | "set_hp"
  | "add_condition"
  | "remove_condition"
  | "break_concentration"
  | "slot_used"
  | "slot_restored"
  | "next_turn"
  | "prev_turn"
  | "sort_initiative";

export interface CombatLogEntry {
  id: string;
  encounterId: string;
  timestamp: number;
  combatantId?: string;
  actionType: LogActionType;
  payload: Record<string, unknown>;
}

export interface ImportPayload {
  version: number;
  exportedAt: number;
  encounters: Encounter[];
  combatants: Combatant[];
  conditions: ConditionInstance[];
  logs: CombatLogEntry[];
}

export function isImportPayload(value: unknown): value is ImportPayload {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<ImportPayload>;
  return (
    typeof data.version === "number" &&
    Array.isArray(data.encounters) &&
    Array.isArray(data.combatants) &&
    Array.isArray(data.conditions) &&
    Array.isArray(data.logs)
  );
}
