import type {
  BestiaryEntry,
  Combatant,
  CombatantBlueprint,
  PartyMemberTemplate
} from "../models/types";

type PortableRoot = Record<string, unknown>;

function isRecord(value: unknown): value is PortableRoot {
  return Boolean(value) && typeof value === "object";
}

function isCombatantBlueprint(value: unknown): value is CombatantBlueprint {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.type === "string" &&
    typeof value.hpMax === "number"
  );
}

function asRoot(raw: string): PortableRoot {
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) throw new Error("Invalid JSON");
  return parsed;
}

function clonePortable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function parsePortableCombatants(raw: string): CombatantBlueprint[] {
  const root = asRoot(raw);

  if (root.kind === "combatant_blueprint" && isCombatantBlueprint(root.combatant)) {
    return [clonePortable(root.combatant)];
  }

  if (root.kind === "party" && Array.isArray(root.members)) {
    const members = root.members as PartyMemberTemplate[];
    return members
      .map((member) => member.blueprint)
      .filter((blueprint): blueprint is CombatantBlueprint => isCombatantBlueprint(blueprint))
      .map((blueprint) => clonePortable(blueprint));
  }

  if (root.kind === "bestiary_collection" && Array.isArray(root.entries)) {
    const entries = root.entries as BestiaryEntry[];
    return entries
      .map((entry) => entry.blueprint)
      .filter((blueprint): blueprint is CombatantBlueprint => isCombatantBlueprint(blueprint))
      .map((blueprint) => clonePortable(blueprint));
  }

  const candidate =
    (root.kind === "combatant" || root.kind === "combatant_blueprint") && isRecord(root.combatant)
      ? (root.combatant as PortableRoot)
      : root;
  if (!isCombatantBlueprint(candidate)) throw new Error("Invalid combatant JSON");
  return [clonePortable(candidate as unknown as Partial<Combatant> as CombatantBlueprint)];
}
