import type {
  BestiaryCollection,
  BestiaryEntry,
  CombatantBlueprint,
  Party,
  PartyMemberTemplate
} from "../models/types";

const now = Date.now();

function slots(maxByLevel: number[]): CombatantBlueprint["spellcasting"] {
  return {
    mode: "slots",
    slots: maxByLevel.map((max, index) => ({ level: index + 1, max, used: 0 })),
    spellsKnown: [],
    showSpells: false
  };
}

const defaultPartyId = "party-default";
const systemBestiaryId = "bestiary-core";

export const defaultParty: Party = {
  id: defaultPartyId,
  name: "Default Party",
  scope: "system",
  isDefault: true,
  createdAt: now,
  updatedAt: now
};

function pcTemplate(
  name: string,
  abilities: CombatantBlueprint["abilities"],
  extras: Partial<CombatantBlueprint> = {}
): CombatantBlueprint {
  return {
    type: "PC",
    name,
    hpMax: extras.hpMax ?? 10,
    hpCurrent: extras.hpCurrent ?? extras.hpMax ?? 10,
    tempHp: 0,
    ac: extras.ac ?? 10,
    speed: extras.speed ?? "30 ft.",
    abilities,
    saves: extras.saves,
    passives: extras.passives,
    resistVulnImmune: extras.resistVulnImmune,
    tags: extras.tags ?? ["Level 1"],
    isHidden: false,
    isConcentrating: false,
    publicNotes: extras.publicNotes,
    gmNotes: extras.gmNotes,
    attacks: extras.attacks ?? [],
    multiattackCount: extras.multiattackCount,
    deathSaves: { success: 0, fail: 0 },
    spellcasting: extras.spellcasting
  };
}

export const defaultPartyMembers: PartyMemberTemplate[] = [
  {
    id: "party-member-barbarian",
    partyId: defaultPartyId,
    order: 0,
    name: "Barbarian",
    className: "Barbarian",
    level: 1,
    blueprint: pcTemplate("Barbarian", { str: 16, dex: 14, con: 16, int: 8, wis: 10, cha: 10 }, {
      hpMax: 14,
      ac: 14,
      attacks: [{ id: "greataxe", name: "Greataxe", toHit: 5, damage: "1d12+3", damageType: "slashing" }]
    })
  },
  {
    id: "party-member-bard",
    partyId: defaultPartyId,
    order: 1,
    name: "Bard",
    className: "Bard",
    level: 1,
    blueprint: pcTemplate("Bard", { str: 8, dex: 14, con: 12, int: 10, wis: 10, cha: 16 }, {
      hpMax: 9,
      ac: 14,
      passives: { perception: 10, insight: 10 },
      spellcasting: slots([2])
    })
  },
  {
    id: "party-member-cleric",
    partyId: defaultPartyId,
    order: 2,
    name: "Cleric",
    className: "Cleric",
    level: 1,
    blueprint: pcTemplate("Cleric", { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 }, {
      hpMax: 11,
      ac: 18,
      passives: { perception: 13, insight: 13 },
      spellcasting: slots([2])
    })
  },
  {
    id: "party-member-druid",
    partyId: defaultPartyId,
    order: 3,
    name: "Druid",
    className: "Druid",
    level: 1,
    blueprint: pcTemplate("Druid", { str: 8, dex: 14, con: 14, int: 10, wis: 16, cha: 12 }, {
      hpMax: 10,
      ac: 14,
      passives: { perception: 13, insight: 13 },
      spellcasting: slots([2])
    })
  },
  {
    id: "party-member-fighter",
    partyId: defaultPartyId,
    order: 4,
    name: "Fighter",
    className: "Fighter",
    level: 1,
    blueprint: pcTemplate("Fighter", { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 10 }, {
      hpMax: 12,
      ac: 18,
      attacks: [{ id: "longsword", name: "Longsword", toHit: 5, damage: "1d8+3", damageType: "slashing" }]
    })
  },
  {
    id: "party-member-monk",
    partyId: defaultPartyId,
    order: 5,
    name: "Monk",
    className: "Monk",
    level: 1,
    blueprint: pcTemplate("Monk", { str: 10, dex: 16, con: 14, int: 10, wis: 16, cha: 8 }, {
      hpMax: 10,
      ac: 16,
      attacks: [{ id: "quarterstaff", name: "Quarterstaff", toHit: 5, damage: "1d8+3", damageType: "bludgeoning" }]
    })
  },
  {
    id: "party-member-paladin",
    partyId: defaultPartyId,
    order: 6,
    name: "Paladin",
    className: "Paladin",
    level: 1,
    blueprint: pcTemplate("Paladin", { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 16 }, {
      hpMax: 12,
      ac: 18,
      attacks: [{ id: "warhammer", name: "Warhammer", toHit: 5, damage: "1d8+3", damageType: "bludgeoning" }]
    })
  },
  {
    id: "party-member-ranger",
    partyId: defaultPartyId,
    order: 7,
    name: "Ranger",
    className: "Ranger",
    level: 1,
    blueprint: pcTemplate("Ranger", { str: 10, dex: 16, con: 14, int: 10, wis: 14, cha: 10 }, {
      hpMax: 12,
      ac: 15,
      passives: { perception: 14, insight: 12 },
      attacks: [{ id: "longbow", name: "Longbow", toHit: 5, damage: "1d8+3", damageType: "piercing" }]
    })
  },
  {
    id: "party-member-rogue",
    partyId: defaultPartyId,
    order: 8,
    name: "Rogue",
    className: "Rogue",
    level: 1,
    blueprint: pcTemplate("Rogue", { str: 8, dex: 16, con: 14, int: 12, wis: 12, cha: 14 }, {
      hpMax: 10,
      ac: 14,
      passives: { perception: 13, insight: 11 },
      attacks: [{ id: "shortbow", name: "Shortbow", toHit: 5, damage: "1d6+3", damageType: "piercing" }]
    })
  },
  {
    id: "party-member-sorcerer",
    partyId: defaultPartyId,
    order: 9,
    name: "Sorcerer",
    className: "Sorcerer",
    level: 1,
    blueprint: pcTemplate("Sorcerer", { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 }, {
      hpMax: 8,
      ac: 12,
      spellcasting: slots([2])
    })
  },
  {
    id: "party-member-warlock",
    partyId: defaultPartyId,
    order: 10,
    name: "Warlock",
    className: "Warlock",
    level: 1,
    blueprint: pcTemplate("Warlock", { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 16 }, {
      hpMax: 10,
      ac: 13,
      spellcasting: {
        mode: "pact",
        pact: { slotLevel: 1, max: 1, used: 0 },
        spellsKnown: [],
        showSpells: false
      }
    })
  },
  {
    id: "party-member-wizard",
    partyId: defaultPartyId,
    order: 11,
    name: "Wizard",
    className: "Wizard",
    level: 1,
    blueprint: pcTemplate("Wizard", { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 }, {
      hpMax: 8,
      ac: 12,
      spellcasting: slots([2])
    })
  }
];

export const systemBestiaryCollection: BestiaryCollection = {
  id: systemBestiaryId,
  name: "Core Bestiary",
  scope: "system",
  createdAt: now,
  updatedAt: now
};

function npcEntry(
  id: string,
  order: number,
  name: string,
  blueprint: CombatantBlueprint
): BestiaryEntry {
  return {
    id,
    collectionId: systemBestiaryId,
    order,
    name,
    blueprint
  };
}

export const systemBestiaryEntries: BestiaryEntry[] = [
  npcEntry("bestiary-bandit", 0, "Bandit", {
    type: "NPC",
    name: "Bandit",
    hpMax: 11,
    hpCurrent: 11,
    ac: 12,
    speed: "30 ft.",
    abilities: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
    attacks: [{ id: "scimitar", name: "Scimitar", toHit: 3, damage: "1d6+1", damageType: "slashing" }]
  }),
  npcEntry("bestiary-guard", 1, "Guard", {
    type: "NPC",
    name: "Guard",
    hpMax: 11,
    hpCurrent: 11,
    ac: 16,
    speed: "30 ft.",
    abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 },
    attacks: [{ id: "spear", name: "Spear", toHit: 3, damage: "1d6+1", damageType: "piercing" }]
  }),
  npcEntry("bestiary-cultist", 2, "Cultist", {
    type: "NPC",
    name: "Cultist",
    hpMax: 9,
    hpCurrent: 9,
    ac: 12,
    speed: "30 ft.",
    abilities: { str: 11, dex: 12, con: 10, int: 10, wis: 11, cha: 10 },
    attacks: [{ id: "scimitar", name: "Scimitar", toHit: 3, damage: "1d6+1", damageType: "slashing" }]
  }),
  npcEntry("bestiary-goblin", 3, "Goblin", {
    type: "Monster",
    name: "Goblin",
    hpMax: 7,
    hpCurrent: 7,
    ac: 15,
    speed: "30 ft.",
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    attacks: [{ id: "scimitar", name: "Scimitar", toHit: 4, damage: "1d6+2", damageType: "slashing" }]
  }),
  npcEntry("bestiary-orc", 4, "Orc", {
    type: "Monster",
    name: "Orc",
    hpMax: 15,
    hpCurrent: 15,
    ac: 13,
    speed: "30 ft.",
    abilities: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
    attacks: [{ id: "greataxe", name: "Greataxe", toHit: 5, damage: "1d12+3", damageType: "slashing" }]
  }),
  npcEntry("bestiary-skeleton", 5, "Skeleton", {
    type: "Monster",
    name: "Skeleton",
    hpMax: 13,
    hpCurrent: 13,
    ac: 13,
    speed: "30 ft.",
    abilities: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
    resistVulnImmune: { vuln: ["bludgeoning"], immune: ["poison"] },
    attacks: [{ id: "shortsword", name: "Shortsword", toHit: 4, damage: "1d6+2", damageType: "piercing" }]
  }),
  npcEntry("bestiary-wolf", 6, "Wolf", {
    type: "Monster",
    name: "Wolf",
    hpMax: 11,
    hpCurrent: 11,
    ac: 13,
    speed: "40 ft.",
    abilities: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
    passives: { perception: 13 },
    attacks: [{ id: "bite", name: "Bite", toHit: 4, damage: "2d4+2", damageType: "piercing" }]
  })
];
