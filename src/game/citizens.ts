/**
 * Občania regiónu Rimavská Sobota ako priateľské NPC v štýle Dizzy/Towdie (1–2 na kolo).
 * Keď sa hráč priblíži, zobrazí sa ich krátka hláška (max 56 znakov) na 3,0 sekundy bez extra tlačidla.
 */

export interface CitizenNpc {
  id: string;
  stageIndex: number;
  name: string;
  role: string;
  quote: string; // max 56 chars
  x: number;
  y: number;
}

export interface CitizenSpeechState {
  activeCitizenId: string | null;
  activeName: string;
  activeQuote: string;
  timer: number;
  /** Cooldown per citizen ID so standing beside an NPC doesn't re-trigger immediately */
  cooldowns: Record<string, number>;
}

export const CITIZEN_TRIGGER_RADIUS = 18;
export const CITIZEN_SPEECH_DURATION = 3.0;
export const CITIZEN_RETRIGGER_COOLDOWN = 6.0;

// TODO: nahradiť skutočnými menami a hláškami občanov
export const STAGE_CITIZENS: readonly CitizenNpc[] = [
  // Stage 1: Klinika microDENT
  {
    id: 'c1_clinic',
    stageIndex: 0,
    name: 'Jana',
    role: 'Pacientka z Hatvaniho',
    quote: 'Radšej kaz v hre než v ústach.',
    x: 92,
    y: 92,
  },
  {
    id: 'c2_clinic',
    stageIndex: 0,
    name: 'Marek',
    role: 'Sused z RS',
    quote: 'V microDENTe svieti UV lúč – počkaj, kým zhasne!',
    x: 164,
    y: 92,
  },
  // Stage 2: Endo & 3D CBCT Lab
  {
    id: 'c3_endo',
    stageIndex: 1,
    name: 'Katarína',
    role: 'Asistentka',
    quote: 'Cez CBCT lúč prebehni Saboteur úhybom [Shift]!',
    x: 84,
    y: 132,
  },
  // Stage 3: Optický uzol TeatrO
  {
    id: 'c4_teatro',
    stageIndex: 2,
    name: 'Tomáš',
    role: 'Technik RSNET',
    quote: 'Vlákna zapájaj po poriadku 1 až 7 ako v Atomixe!',
    x: 172,
    y: 92,
  },
  // Stage 4: Rieka Rimava & Kurinec
  {
    id: 'c5_rimava',
    stageIndex: 3,
    name: 'Peter',
    role: 'Cyklista z Kurinca',
    quote: 'Zelená voda je dnes hladká ako optika na 10G.',
    x: 124,
    y: 68,
  },
  {
    id: 'c6_kurinec',
    stageIndex: 3,
    name: 'Eva',
    role: 'Zelená voda',
    quote: 'Voda Rimavy spomaľuje – využi suché cyklomosty!',
    x: 124,
    y: 140,
  },
  // Stage 5: Gemersko-malohontské múzeum
  {
    id: 'c7_museum',
    stageIndex: 4,
    name: 'Martin',
    role: 'Kronikár Gemera',
    quote: 'Rymos Zumbota 1270. Aj vtedy sa tu začínalo niečo veľké.',
    x: 84,
    y: 92,
  },
  // Stage 6: Hlavné námestie · Plaketa MVP
  {
    id: 'c8_square',
    stageIndex: 5,
    name: 'Zuzka',
    role: 'Hlavné námestie RS',
    quote: 'Free Wi-Fi na námestí? To bude Signálik!',
    x: 92,
    y: 148,
  },
  {
    id: 'c9_square',
    stageIndex: 5,
    name: 'Lukáš',
    role: 'Fanúšik Didaktiku',
    quote: 'Poraz Veľkého Rušiča a odnes Radovi plaketu na pódium!',
    x: 164,
    y: 148,
  },
  // Stage 7: Servisný úraz
  {
    id: 'c10_service',
    stageIndex: 6,
    name: 'Ivana',
    role: 'Vedúca servisu',
    quote: 'Vyber zónu, prebehni koridor a obráň centrálny hub!',
    x: 44,
    y: 12,
  },
  {
    id: 'c11_service',
    stageIndex: 6,
    name: 'Ondrej',
    role: 'Technik RSNET',
    quote: 'Relé zapoj v poradí – Signálik ti pomôže.',
    x: 212,
    y: 12,
  },
];

export function createCitizenSpeechState(): CitizenSpeechState {
  return {
    activeCitizenId: null,
    activeName: '',
    activeQuote: '',
    timer: 0,
    cooldowns: {},
  };
}

export function getCitizensForStage(stageIndex: number): CitizenNpc[] {
  return STAGE_CITIZENS.filter((c) => c.stageIndex === stageIndex);
}

/**
 * Pure proximity & 3-second speech timer updater for stage NPC citizens.
 */
export function updateCitizenSpeech(
  stageIndex: number,
  playerX: number,
  playerY: number,
  dt: number,
  state: CitizenSpeechState,
  citizens: readonly CitizenNpc[] = STAGE_CITIZENS
): CitizenSpeechState {
  // Decay cooldowns
  for (const id of Object.keys(state.cooldowns)) {
    state.cooldowns[id] = Math.max(0, state.cooldowns[id] - dt);
  }

  // Decay active speech timer
  if (state.timer > 0) {
    state.timer = Math.max(0, state.timer - dt);
    if (state.timer <= 0) {
      state.activeCitizenId = null;
      state.activeName = '';
      state.activeQuote = '';
    }
  }

  // Trigger speech when player approaches an available citizen on current stage
  for (const npc of citizens) {
    if (npc.stageIndex !== stageIndex) continue;
    const dist = Math.hypot(playerX - npc.x, playerY - npc.y);
    const cd = state.cooldowns[npc.id] ?? 0;
    if (dist <= CITIZEN_TRIGGER_RADIUS && cd <= 0 && state.activeCitizenId !== npc.id) {
      state.activeCitizenId = npc.id;
      state.activeName = npc.name;
      state.activeQuote = npc.quote;
      state.timer = CITIZEN_SPEECH_DURATION;
      state.cooldowns[npc.id] = CITIZEN_RETRIGGER_COOLDOWN;
      break;
    }
  }

  return state;
}
