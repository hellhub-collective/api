// TODO: Reverse engineer the data types from the game that have never[] as a type

export interface CurrentWarId {
  id: number;
}

export interface CurrentWarTime {
  time: number;
}

export interface News {
  id: number;
  type: number;
  tagIds: number[];
  message: string;
  published: number;
}

export interface AssignmentTask {
  type: number;
  values: number[];
  valueTypes: number[];
}

export interface AssignmentReward {
  type: number;
  id32: number;
  amount: number;
}

export interface AssignmentSetting {
  type: number;
  overrideTitle: string;
  overrideBrief: string;
  taskDescription: string;
  tasks: AssignmentTask[];
  reward: AssignmentReward;
  flags: number;
}

export interface Assignment {
  id32: number;
  progress: number[];
  expiresIn: number;
  setting: AssignmentSetting;
}

export interface GalaxyStats {
  missionsWon: number;
  missionsLost: number;
  missionTime: number;
  bugKills: number;
  automatonKills: number;
  illuminateKills: number;
  bulletsFired: number;
  bulletsHit: number;
  timePlayed: number;
  deaths: number;
  revives: number;
  friendlies: number;
  missionSuccessRate: number;
  accurracy: number;
}

export interface PlanetStats extends GalaxyStats {
  planetIndex: number;
}

export interface Stats {
  galaxy_stats: GalaxyStats;
  planets_stats: PlanetStats[];
}

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

export interface JointOperation {
  id: number;
  planetIndex: number;
  hqNodeIndex: number;
}

export interface PlanetEvent {
  id: number;
  planetIndex: number;
  eventType: number;
  race: number;
  health: number;
  maxHealth: number;
  startTime: number;
  expireTime: number;
  campaignId: number;
  jointOperationIds: number[];
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
  jointOperations: JointOperation[];
  planetEvents: PlanetEvent[];
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
