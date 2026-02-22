<template>
  <section class="details-panel">
    <div class="row">
      <strong>Details</strong>
      <button class="btn" @click="toggleDetails">{{ isOpen ? "-" : "+" }}</button>
    </div>

    <div v-if="isOpen && !editorOpen" class="details-grid">
      <div><strong>Speed:</strong> {{ combatant.speed || "-" }}</div>
      <div><strong>Tags:</strong> {{ combatant.tags?.join(", ") || "-" }}</div>
      <div>
        <strong>Abilities:</strong>
        <span v-if="combatant.abilities">
          STR {{ formatAbility(combatant.abilities.str) }} DEX {{ formatAbility(combatant.abilities.dex) }}
          CON {{ formatAbility(combatant.abilities.con) }} INT {{ formatAbility(combatant.abilities.int) }}
          WIS {{ formatAbility(combatant.abilities.wis) }} CHA {{ formatAbility(combatant.abilities.cha) }}
        </span>
        <span v-else>-</span>
      </div>
      <div>
        <strong>Attacks:</strong>
        <div v-if="combatant.attacks?.length || combatant.multiattackCount">
          <div v-if="getMultiattackCount(combatant.attacks, combatant.multiattackCount)" class="attack-multi muted">
            Multiattack: x{{ getMultiattackCount(combatant.attacks, combatant.multiattackCount) }}
          </div>
          <table v-if="combatant.attacks?.length" class="attack-table">
            <thead>
              <tr>
                <th>Attack</th>
                <th>Bonus</th>
                <th>Damage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="attack in combatant.attacks" :key="attack.id">
                <td>
                  <div>{{ attack.name }}</div>
                  <div v-if="attack.notes" class="muted attack-notes">{{ attack.notes }}</div>
                </td>
                <td>{{ typeof attack.toHit === "number" ? formatModifier(attack.toHit) : "-" }}</td>
                <td>{{ formatDamage(attack) }}</td>
              </tr>
            </tbody>
          </table>
          <span v-else>-</span>
        </div>
        <span v-else>-</span>
      </div>
      <div><strong>Public notes:</strong> {{ combatant.publicNotes || "-" }}</div>
      <div><strong>GM notes:</strong> {{ combatant.gmNotes || "-" }}</div>
      <div>
        <strong>Resist/Vuln/Immune:</strong>
        R {{ combatant.resistVulnImmune?.resist?.join(", ") || "-" }}
        V {{ combatant.resistVulnImmune?.vuln?.join(", ") || "-" }}
        I {{ combatant.resistVulnImmune?.immune?.join(", ") || "-" }}
      </div>
      <div class="row">
        <button class="btn" @click="openEditor">Edit details</button>
      </div>
    </div>

    <div v-else-if="isOpen" class="details-editor">
      <div class="row wrap">
        <label class="field">
          <span class="muted">Speed</span>
          <input v-model="editor.speed" class="input-sm" placeholder="30 ft" />
        </label>
        <label class="field">
          <span class="muted">Tags</span>
          <input v-model="editor.tags" class="input-sm" placeholder="NPC, CR 1/2" />
        </label>
      </div>
      <div class="row wrap">
        <label class="field">
          <span class="muted">STR</span>
          <input v-model="editor.abilities.str" class="input-sm" type="number" min="1" max="30" />
        </label>
        <label class="field">
          <span class="muted">DEX</span>
          <input v-model="editor.abilities.dex" class="input-sm" type="number" min="1" max="30" />
        </label>
        <label class="field">
          <span class="muted">CON</span>
          <input v-model="editor.abilities.con" class="input-sm" type="number" min="1" max="30" />
        </label>
        <label class="field">
          <span class="muted">INT</span>
          <input v-model="editor.abilities.int" class="input-sm" type="number" min="1" max="30" />
        </label>
        <label class="field">
          <span class="muted">WIS</span>
          <input v-model="editor.abilities.wis" class="input-sm" type="number" min="1" max="30" />
        </label>
        <label class="field">
          <span class="muted">CHA</span>
          <input v-model="editor.abilities.cha" class="input-sm" type="number" min="1" max="30" />
        </label>
      </div>
      <div class="row wrap">
        <label class="field">
          <span class="muted">Resist</span>
          <input v-model="editor.resist" class="input-sm" placeholder="fire, cold" />
        </label>
        <label class="field">
          <span class="muted">Vuln</span>
          <input v-model="editor.vuln" class="input-sm" placeholder="radiant" />
        </label>
        <label class="field">
          <span class="muted">Immune</span>
          <input v-model="editor.immune" class="input-sm" placeholder="poison" />
        </label>
      </div>
      <div class="row wrap">
        <label class="field">
          <span class="muted">Public notes</span>
          <textarea v-model="editor.publicNotes" class="input block" rows="2" />
        </label>
        <label class="field">
          <span class="muted">GM notes</span>
          <textarea v-model="editor.gmNotes" class="input block" rows="2" />
        </label>
      </div>
      <div class="row wrap">
        <label class="field">
          <span class="muted">Number of attacks</span>
          <input v-model.number="editor.multiattackCount" class="input-sm" type="number" min="0" />
        </label>
      </div>
      <div class="details-attacks">
        <div class="row split">
          <strong>Attacks</strong>
          <button class="btn" @click="addAttack">+ Attack</button>
        </div>
        <div v-if="!editor.attacks.length" class="muted">No attacks</div>
        <div v-for="(attack, index) in editor.attacks" :key="attack.id" class="row wrap">
          <input v-model="attack.name" class="input-sm" placeholder="Name" />
          <input v-model.number="attack.toHit" class="input-sm" type="number" placeholder="Bonus" />
          <input v-model="attack.damage" class="input-sm" placeholder="Damage" />
          <input v-model="attack.damageType" class="input-sm" placeholder="Type" />
          <input v-model="attack.notes" class="input-sm" placeholder="Notes" />
          <button class="btn btn-danger" @click="removeAttack(index)">Remove</button>
        </div>
      </div>
      <div class="row">
        <button class="btn btn-primary" @click="saveEditor">Save</button>
        <button class="btn" @click="cancelEditor">Cancel</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { makeId } from "../utils/id";
import type { AbilityBlock, AttackEntry, Combatant, ResistVulnImmune } from "../models/types";

const props = defineProps<{ combatant: Combatant }>();
const emit = defineEmits<{
  update: [patch: Partial<Combatant>];
}>();
const isOpen = ref(false);
const editorOpen = ref(false);
const editor = ref({
  speed: "",
  tags: "",
  publicNotes: "",
  gmNotes: "",
  resist: "",
  vuln: "",
  immune: "",
  multiattackCount: 0,
  abilities: {
    str: null as number | null,
    dex: null as number | null,
    con: null as number | null,
    int: null as number | null,
    wis: null as number | null,
    cha: null as number | null
  },
  attacks: [] as Array<{
    id: string;
    name: string;
    toHit: number | null;
    damage: string;
    damageType: string;
    notes: string;
  }>
});

function formatAbility(score: number): string {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : String(modifier);
}

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : String(modifier);
}

function toggleDetails() {
  isOpen.value = !isOpen.value;
  if (!isOpen.value) editorOpen.value = false;
}

function openEditor() {
  const combatant = props.combatant;
  editor.value = {
    speed: combatant.speed ?? "",
    tags: (combatant.tags ?? []).join(", "),
    publicNotes: combatant.publicNotes ?? "",
    gmNotes: combatant.gmNotes ?? "",
    resist: (combatant.resistVulnImmune?.resist ?? []).join(", "),
    vuln: (combatant.resistVulnImmune?.vuln ?? []).join(", "),
    immune: (combatant.resistVulnImmune?.immune ?? []).join(", "),
    multiattackCount: combatant.multiattackCount ?? getMultiattackCount(combatant.attacks) ?? 0,
    abilities: {
      str: combatant.abilities?.str ?? null,
      dex: combatant.abilities?.dex ?? null,
      con: combatant.abilities?.con ?? null,
      int: combatant.abilities?.int ?? null,
      wis: combatant.abilities?.wis ?? null,
      cha: combatant.abilities?.cha ?? null
    },
    attacks: (combatant.attacks ?? []).map((attack) => ({
      id: attack.id,
      name: attack.name,
      toHit: attack.toHit ?? null,
      damage: attack.damage ?? "",
      damageType: attack.damageType ?? "",
      notes: attack.notes ?? ""
    }))
  };
  isOpen.value = true;
  editorOpen.value = true;
}

function addAttack() {
  editor.value.attacks.push({
    id: makeId(),
    name: "",
    toHit: null,
    damage: "",
    damageType: "",
    notes: ""
  });
}

function removeAttack(index: number) {
  editor.value.attacks.splice(index, 1);
}

function parseNumber(value: number | string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseList(value: string): string[] | undefined {
  const list = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

function buildAbilities(): AbilityBlock | undefined {
  const str = parseNumber(editor.value.abilities.str);
  const dex = parseNumber(editor.value.abilities.dex);
  const con = parseNumber(editor.value.abilities.con);
  const int = parseNumber(editor.value.abilities.int);
  const wis = parseNumber(editor.value.abilities.wis);
  const cha = parseNumber(editor.value.abilities.cha);
  if (
    typeof str !== "number" ||
    typeof dex !== "number" ||
    typeof con !== "number" ||
    typeof int !== "number" ||
    typeof wis !== "number" ||
    typeof cha !== "number"
  )
    return undefined;
  return { str, dex, con, int, wis, cha };
}

function buildResistBlock(): ResistVulnImmune | undefined {
  const resist = parseList(editor.value.resist);
  const vuln = parseList(editor.value.vuln);
  const immune = parseList(editor.value.immune);
  if (!resist && !vuln && !immune) return undefined;
  return { resist, vuln, immune };
}

function saveEditor() {
  const attacks: AttackEntry[] = editor.value.attacks
    .filter((attack) => attack.name.trim())
    .map((attack) => ({
      id: attack.id || makeId(),
      name: attack.name.trim(),
      toHit: parseNumber(attack.toHit),
      damage: attack.damage.trim() || undefined,
      damageType: attack.damageType.trim() || undefined,
      notes: attack.notes.trim() || undefined
    }));

  emit("update", {
    speed: editor.value.speed.trim() || undefined,
    tags: parseList(editor.value.tags),
    publicNotes: editor.value.publicNotes.trim() || undefined,
    gmNotes: editor.value.gmNotes.trim() || undefined,
    abilities: buildAbilities(),
    resistVulnImmune: buildResistBlock(),
    attacks,
    multiattackCount: parseNumber(editor.value.multiattackCount)
  });
  editorOpen.value = false;
  isOpen.value = true;
}

function cancelEditor() {
  editorOpen.value = false;
  isOpen.value = true;
}

function formatDamage(attack: AttackEntry): string {
  if (!attack.damage) return "-";
  return attack.damageType ? `${attack.damage} ${attack.damageType}` : attack.damage;
}

function getMultiattackCount(attacks?: AttackEntry[], explicit?: number | null): number | null {
  if (typeof explicit === "number" && explicit > 1) return explicit;
  if (!attacks?.length) return null;
  const total = attacks.reduce((sum, attack) => {
    if (typeof attack.attacksCount !== "number") return sum;
    return sum + attack.attacksCount;
  }, 0);
  return total > 1 ? total : null;
}
</script>
