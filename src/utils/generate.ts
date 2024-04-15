import path from "path";
import fs from "fs/promises";

import type {
  News,
  Stats,
  WarInfo,
  WarStatus,
  Assignment,
  CurrentWarId,
  CurrentWarTime,
} from "types/source";

import { db } from "utils/database";
import type { HistoryEntry } from "types/history";
import type { StratagemMap } from "types/stratagem";

export interface NameEntry {
  index: number;
  name: string;
}

export interface SectorEntry {
  index: number;
  name: string;
  planets: NameEntry[];
}

/**
 * Populate the database with names from static JSON files, this needs to be
 * executed before the helldiver's 2 server is contacted.
 */
export async function prepareForSourceData() {
  const [factions, planets, sectors]: [
    NameEntry[],
    NameEntry[],
    SectorEntry[],
  ] = [[], [], []];

  const [planetsData, sectorsData, factionsData, stratagemsData] =
    await Promise.all([
      fs.readFile(
        path.join(process.cwd(), "src", "static/json/planets.json"),
        "utf-8",
      ),
      fs.readFile(
        path.join(process.cwd(), "src", "static/json/sectors.json"),
        "utf-8",
      ),
      fs.readFile(
        path.join(process.cwd(), "src", "static/json/factions.json"),
        "utf-8",
      ),
      fs.readFile(
        path.join(process.cwd(), "src", "static/json/stratagems.json"),
        "utf-8",
      ),
    ]);

  const stratagemsJSON: StratagemMap = JSON.parse(stratagemsData);
  const planetsJSON: Record<string, string> = JSON.parse(planetsData);
  const factionsJSON: Record<string, string> = JSON.parse(factionsData);
  const sectorsJSON: Record<string, Array<number>> = JSON.parse(sectorsData);

  // populate planets
  for (const key in planetsJSON) {
    const name = planetsJSON[key];
    planets.push({ index: parseInt(key), name });
  }

  // populate sectors
  const sectorKeys = Object.keys(sectorsJSON);
  for (let i = 0; i < sectorKeys.length; i++) {
    const key = sectorKeys[i];
    const children = sectorsJSON[key];
    sectors.push({
      name: key,
      index: i + 1,
      planets: children.map(index => ({
        index: index,
        name: planetsJSON[index],
      })),
    });
  }

  // populate factions
  for (const key in factionsJSON) {
    const name = factionsJSON[key];
    factions.push({ index: parseInt(key), name });
  }

  return { factions, planets, sectors, stratagems: stratagemsJSON };
}

/**
 * Get the data from the helldiver's 2 server, this does only fetch the data
 * and not transform, or store it in the database.
 */
export async function fetchSourceData() {
  const API_URL = process.env.API_URL!;
  const HISTORY_API_URL = process.env.HISTORY_API_URL!;

  const response = await fetch(`${API_URL}/WarSeason/current/WarID`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Language": "en-US",
    },
  });

  const { id: warId }: CurrentWarId = (await response.json()) as any;

  const responses = await Promise.all([
    fetch(`${API_URL}/WarSeason/${warId}/Status`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "en-US",
      },
    }),
    fetch(`${API_URL}/WarSeason/${warId}/WarInfo`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "en-US",
      },
    }),
    fetch(`${API_URL}/WarSeason/${warId}/WarTime`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "en-US",
      },
    }),
    fetch(`${API_URL}/v2/Assignment/War/${warId}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "en-US",
      },
    }),
    fetch(`${API_URL}/NewsFeed/${warId}?maxEntries=1024`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "en-US",
      },
    }),
    fetch(`${API_URL}/Stats/War/${warId}/Summary`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "en-US",
      },
    }),
    fetch(`${HISTORY_API_URL}/current-planets-progress`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "en-US",
      },
    }),
  ]);

  const data = await Promise.all(responses.map(res => res.json()));

  return {
    warId,
    warNews: data[4] as News[],
    warStats: data[5] as Stats,
    warInfo: data[1] as WarInfo,
    warStatus: data[0] as WarStatus,
    warTime: data[2] as CurrentWarTime,
    warAssignments: data[3] as Assignment[],
    warHistory: data[6] as { planetsProgress: HistoryEntry[] },
  };
}

/**
 * Transform the data from the helldiver's 2 server, and store it in the
 * database.
 */
export async function transformAndStoreSourceData() {
  const {
    warId,
    warInfo,
    warTime,
    warNews,
    warStats,
    warStatus,
    warHistory,
    warAssignments,
  } = await fetchSourceData();

  const { factions, planets, sectors, stratagems } =
    await prepareForSourceData();

  // index all stratagems
  await Promise.all([
    db.stratagem.deleteMany(),
    db.stratagemGroup.deleteMany(),
  ]);

  // generate the assignment data
  for (const assignment of warAssignments) {
    const now = Date.now();
    const expiresAt = now + assignment.expiresIn * 1000;

    await db.reward.create({
      data: {
        type: assignment.setting.reward.type,
        index: assignment.setting.reward.id32,
        amount: assignment.setting.reward.amount,
      },
    });

    await db.assignment.create({
      data: {
        index: assignment.id32,
        type: assignment.setting.type,
        expiresAt: new Date(expiresAt),
        progress: assignment.progress[0],
        title: assignment.setting.overrideTitle,
        briefing: assignment.setting.overrideBrief,
        description: assignment.setting.taskDescription,
        reward: { connect: { index: assignment.setting.reward.id32 } },
      },
    });
  }

  // generate news data
  for (const article of warNews.sort((a, b) => a.id - b.id)) {
    await db.news.create({
      data: {
        index: article.id,
        type: article.type,
        message: article.message ?? "",
        tagIds: article.tagIds.join(","),
        publishedAt: new Date(article.published * 1000),
      },
    });
  }

  // generate stratagem data
  for (const key in stratagems) {
    const group = await db.stratagemGroup.create({
      data: { name: stratagems[key].name },
    });

    for (const stratagem of stratagems[key].entries) {
      await db.stratagem.create({
        data: {
          ...stratagem,
          keys: stratagem.keys.join(","),
          group: { connect: { id: group.id } },
        },
      });
    }
  }

  // create the war data
  await db.war.create({
    data: {
      index: warId,
      time: new Date(warTime.time * 1000),
      endDate: new Date(warInfo.endDate * 1000),
      startDate: new Date(warInfo.startDate * 1000),
    },
  });

  // generate the sector data
  for (const sector of sectors) {
    await db.sector.create({
      data: { index: sector.index, name: sector.name },
    });
  }

  // generate the faction data
  for (const faction of factions) {
    await db.faction.create({ data: faction });
  }

  // generate global stats
  if (warStats.galaxy_stats) {
    const global = warStats.galaxy_stats;
    await db.stats.create({
      data: {
        accuracy: global.accurracy,
        deaths: BigInt(global.deaths),
        revives: BigInt(global.revives),
        bugKills: BigInt(global.bugKills),
        timePlayed: BigInt(global.timePlayed),
        bulletsHit: BigInt(global.bulletsHit),
        missionTime: BigInt(global.missionTime),
        missionsWon: BigInt(global.missionsWon),
        friendlyKills: BigInt(global.friendlies),
        missionsLost: BigInt(global.missionsLost),
        bulletsFired: BigInt(global.bulletsFired),
        missionSuccessRate: global.missionSuccessRate,
        automatonKills: BigInt(global.automatonKills),
        illuminateKills: BigInt(global.illuminateKills),
      },
    });
  }

  // generate the planet data
  for (const planet of planets) {
    const { planetsProgress } = warHistory;

    const info = warInfo.planetInfos.find(p => p.index === planet.index);
    const lib = planetsProgress.find(p => p.planetIndex === planet.index);
    const status = warStatus.planetStatus.find(p => p.index === planet.index);

    if (!status || !info) {
      console.warn(`No data for planet ${planet.name}`, { status, info });
      continue;
    }

    const planetSector = sectors.find(s => {
      return s.planets.some(p => p.index === planet.index);
    });

    const liberationState = (() => {
      if (!lib) return "N/A" as const;

      let value;
      const max_h = info.maxHealth;
      const lib_r = lib.liberationChange;

      const libPerHour = max_h * (lib_r / 100);
      const regPerHour = status.regenPerSecond * 3600;

      if (libPerHour > regPerHour) {
        value = "WINNING" as const;
      } else if (lib_r < 0.05) {
        value = "DRAW" as const;
      } else {
        value = "LOSING" as const;
      }

      return value;
    })();

    await db.planet.create({
      data: {
        name: planet.name,
        index: planet.index,
        health: status.health,
        disabled: info.disabled,
        players: status.players,
        maxHealth: info.maxHealth,
        positionX: info.position.x,
        positionY: info.position.y,
        regeneration: status.regenPerSecond,
        owner: { connect: { index: status.owner } },
        sector: { connect: { index: planetSector?.index } },
        initialOwner: { connect: { index: info.initialOwner } },
        // liberation data based on history api
        liberationState,
        liberationRate: lib?.liberationChange ?? 0,
        liberation: 100 - (100 / info.maxHealth) * status.health,
      },
    });

    const stats = warStats.planets_stats.find(p => {
      return p.planetIndex === planet.index;
    });

    if (!stats) continue;

    // create planetary stats
    await db.stats.create({
      data: {
        accuracy: stats.accurracy,
        deaths: BigInt(stats.deaths),
        revives: BigInt(stats.revives),
        bugKills: BigInt(stats.bugKills),
        timePlayed: BigInt(stats.timePlayed),
        bulletsHit: BigInt(stats.bulletsHit),
        missionTime: BigInt(stats.missionTime),
        missionsWon: BigInt(stats.missionsWon),
        friendlyKills: BigInt(stats.friendlies),
        missionsLost: BigInt(stats.missionsLost),
        bulletsFired: BigInt(stats.bulletsFired),
        missionSuccessRate: stats.missionSuccessRate,
        automatonKills: BigInt(stats.automatonKills),
        planet: { connect: { index: planet.index } },
        illuminateKills: BigInt(stats.illuminateKills),
      },
    });
  }

  // generate attack and defense data
  for (const attack of warStatus.planetAttacks) {
    await db.attack.create({
      data: {
        source: { connect: { index: attack.source } },
        target: { connect: { index: attack.target } },
      },
    });
  }

  // generate the campaign data
  const campaignPlanets = planets.filter(p => {
    return warStatus.campaigns.map(c => c.planetIndex).includes(p.index);
  });

  // generate the campaign data
  for (const campaign of warStatus.campaigns) {
    const planet = campaignPlanets.find(p => p.index === campaign.planetIndex);

    if (!planet) {
      console.warn(`No planet found for campaign`, {
        campaign,
      });
      continue;
    }

    await db.campaign.create({
      data: {
        index: campaign.id,
        type: campaign.type,
        count: campaign.count,
        planet: { connect: { index: planet.index } },
      },
    });
  }

  // generate the planet event data (attack/defend orders)
  for (const event of warStatus.planetEvents) {
    const planet = planets.find(p => p.index === event.planetIndex);
    const faction = factions.find(f => f.index === event.race);
    const jointOp = warStatus.jointOperations.find(j => j.id === event.id);

    await db.order.create({
      data: {
        index: event.id,
        eventType: event.eventType === 1 ? "DEFEND" : "ATTACK",
        health: event.health,
        maxHealth: event.maxHealth,
        hqNodeIndex: jointOp?.hqNodeIndex,
        startTime: new Date(event.startTime * 1000),
        expireTime: new Date(event.expireTime * 1000),
        campaign: { connect: { index: event.campaignId } },
        planet: planet ? { connect: { index: planet.index } } : undefined,
        faction: faction ? { connect: { index: faction.index } } : undefined,
      },
    });
  }

  // generate the global event data
  for (const globals of warStatus.globalEvents) {
    const faction = factions.find(f => f.index === globals.race);

    const targets = planets.filter(p => {
      globals.planetIndices.includes(p.index);
    });

    await db.globalEvent.create({
      data: {
        title: globals.title,
        index: globals.eventId,
        message: globals.message,
        planets: { connect: targets.map(p => ({ index: p.index })) },
        faction: faction ? { connect: { index: faction.index } } : undefined,
      },
    });
  }

  // create the home world data
  for (const homeWorld of warInfo.homeWorlds) {
    const homeWorldPlanet = planets.find(p => {
      return homeWorld.planetIndices?.[0] === p.index;
    });

    if (!homeWorldPlanet) {
      console.warn(`No planets found for home world`, {
        homeWorld,
      });
      continue;
    }

    const owner = factions.find(f => f.index === homeWorld.race);

    if (!owner) {
      console.warn(`No owner found for home world`, {
        homeWorld,
      });
      continue;
    }

    await db.homeWorld.create({
      data: {
        faction: { connect: { index: owner.index } },
        planet: { connect: { index: homeWorldPlanet.index } },
      },
    });
  }
}
