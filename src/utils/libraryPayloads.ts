import type {
  BestiaryCollection,
  BestiaryEntry,
  CombatantBlueprint,
  Party,
  PartyMemberTemplate
} from "../models/types";

export interface CombatantBlueprintPayload {
  version: number;
  kind: "combatant_blueprint";
  exportedAt: number;
  combatant: CombatantBlueprint;
}

export interface PartyPayload {
  version: number;
  kind: "party";
  exportedAt: number;
  party: Pick<Party, "name" | "scope" | "isDefault">;
  members: PartyMemberTemplate[];
}

export interface BestiaryCollectionPayload {
  version: number;
  kind: "bestiary_collection";
  exportedAt: number;
  collection: Pick<BestiaryCollection, "name" | "scope">;
  entries: BestiaryEntry[];
}
