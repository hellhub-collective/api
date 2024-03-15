// TODO: Reverse engineer the data types from the game that have never[] as a type

export interface PlanetStatus {
  index: number;
  owner: number;
  health: number;
  regenPerSecond: number;
  players: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface PlanetAttack {
  source: number;
  target: number;
}

export interface Campaign {
  id: number;
  planetIndex: number;
  type: number;
  count: number;
}

export interface GlobalEvent {
  eventId: number;
  id32: number;
  portraitId32: number;
  title: string;
  titleId32: number;
  message: string;
  messageId32: number;
  race: number;
  flag: number;
  assignmentId32: number;
  effectIds: number[];
  planetIndices: number[];
}

export interface PlanetInfo {
  index: number;
  settingsHash: number;
  position: Position;
  waypoints: number[];
  sector: number;
  maxHealth: number;
  disabled: boolean;
  initialOwner: number;
}

export interface HomeWorld {
  race: number;
  planetIndices: number[];
}

export interface WarStatus {
  warId: number;
  time: number;
  impactMultiplier: number;
  storyBeatId32: number;
  planetStatus: PlanetStatus[];
  planetAttacks: PlanetAttack[];
  campaigns: Campaign[];
  communityTargets: never[];
  jointOperations: never[];
  planetEvents: never[];
  planetActiveEffects: never[];
  activeElectionPolicyEffects: never[];
  globalEvents: GlobalEvent[];
  superEarthWarResults: never[];
}

export interface WarInfo {
  warId: number;
  startDate: number;
  endDate: number;
  minimumClientVersion: string;
  planetInfos: PlanetInfo[];
  homeWorlds: HomeWorld[];
  capitalInfos: never[];
  planetPermanentEffects: never[];
}
