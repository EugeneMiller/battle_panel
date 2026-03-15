import type { Combatant, CombatantBlueprint, CombatantType } from "../models/types";

export function blueprintToCombatantInput(blueprint: CombatantBlueprint): Partial<Combatant> &
  Pick<Combatant, "name" | "type" | "hpMax"> {
  return {
    name: blueprint.name,
    type: blueprint.type as CombatantType,
    hpMax: blueprint.hpMax,
    hpCurrent: blueprint.hpCurrent ?? blueprint.hpMax,
    tempHp: blueprint.tempHp ?? 0,
    initiative: typeof blueprint.initiative === "number" ? blueprint.initiative : null,
    ac: typeof blueprint.ac === "number" ? blueprint.ac : null,
    speed: blueprint.speed,
    abilities: blueprint.abilities,
    saves: blueprint.saves,
    passives: blueprint.passives,
    resistVulnImmune: blueprint.resistVulnImmune,
    tags: blueprint.tags ?? [],
    isHidden: Boolean(blueprint.isHidden),
    isConcentrating: Boolean(blueprint.isConcentrating),
    publicNotes: blueprint.publicNotes,
    gmNotes: blueprint.gmNotes,
    attacks: blueprint.attacks,
    multiattackCount: blueprint.multiattackCount,
    deathSaves: blueprint.deathSaves,
    spellcasting: blueprint.spellcasting
  };
}

export function combatantToBlueprint(combatant: Combatant): CombatantBlueprint {
  return {
    type: combatant.type,
    name: combatant.name,
    initiative: combatant.initiative,
    hpCurrent: combatant.hpCurrent,
    hpMax: combatant.hpMax,
    tempHp: combatant.tempHp,
    ac: combatant.ac,
    speed: combatant.speed,
    abilities: combatant.abilities,
    saves: combatant.saves,
    passives: combatant.passives,
    resistVulnImmune: combatant.resistVulnImmune,
    tags: combatant.tags,
    isHidden: combatant.isHidden,
    isConcentrating: combatant.isConcentrating,
    publicNotes: combatant.publicNotes,
    gmNotes: combatant.gmNotes,
    attacks: combatant.attacks,
    multiattackCount: combatant.multiattackCount,
    deathSaves: combatant.deathSaves,
    spellcasting: combatant.spellcasting
  };
}
