import path from "path";
import fs from "fs/promises";
import * as Sentry from "@sentry/bun";

import type {
  News,
  Stats,
  WarInfo,
  WarStatus,
  Assignment,
  CurrentWarId,
  CurrentWarTime,
} from "types/source";

import db from "utils/database";
import type { HistoryEntry } from "types/history";
import type { StratagemMap } from "types/stratagem";

export interface NameEntry {
  index: number;
  name: string;
}

export interface PlanetEntry {
  name: string;
  index: number;
  biome: string;
  imageName: string;
  effects: string[];
}

export interface SectorEntry {
  index: number;
  name: string;
  planets: PlanetEntry[];
}

export interface BiomeEntry {
  name: string;
  description: string;
}

export interface EffectEntry extends BiomeEntry {}

/**
 * Populate the database with names from static JSON files, this needs to be
 * executed before the helldiver's 2 server is contacted.
 */
export async function prepareForSourceData() {
  const [factions, planets, sectors, biomes, effects]: [
    NameEntry[],
    Array<NameEntry & { imageUrl: string; biome: string; effects: string[] }>,
    SectorEntry[],
    Array<Omit<NameEntry, "index"> & { index: string; description: string }>,
    Array<Omit<NameEntry, "index"> & { index: string; description: string }>,
  ] = [[], [], [], [], []];

  const [
    planetsData,
    sectorsData,
    factionsData,
    stratagemsData,
    biomesData,
    effectsData,
  ] = await Promise.all([
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
    fs.readFile(
      path.join(process.cwd(), "src", "static/json/biomes.json"),
      "utf-8",
    ),
    fs.readFile(
      path.join(process.cwd(), "src", "static/json/effects.json"),
      "utf-8",
    ),
  ]);

  const stratagemsJSON: StratagemMap = JSON.parse(stratagemsData);
  const biomesJSON: Record<string, BiomeEntry> = JSON.parse(biomesData);
  const factionsJSON: Record<string, string> = JSON.parse(factionsData);
  const effectsJSON: Record<string, EffectEntry> = JSON.parse(effectsData);
  const planetsJSON: Record<string, PlanetEntry> = JSON.parse(planetsData);
  const sectorsJSON: Record<string, Array<number>> = JSON.parse(sectorsData);

  // populate biomes
  for (const key in biomesJSON) {
    biomes.push({ ...biomesJSON[key], index: key });
  }

  // populate effects
  for (const key in effectsJSON) {
    effects.push({ ...effectsJSON[key], index: key });
  }

  // populate planets
  for (const key in planetsJSON) {
    const entry = planetsJSON[key];
    const folder = entry.imageName ? "unique" : "biome";
    const file = `${entry.imageName ?? entry.biome}.webp`;
    const baseImageUrl = process.env.STORAGE_URL
      ? `${process.env.STORAGE_URL}`
      : "";

    planets.push({
      ...planetsJSON[key],
      index: parseInt(key),
      imageUrl: `${baseImageUrl}/planets/${folder}/${file}`,
    });
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
        ...planetsJSON[index],
        index,
      })),
    });
  }

  // populate factions
  for (const key in factionsJSON) {
    const name = factionsJSON[key];
    factions.push({ index: parseInt(key), name });
  }

  return {
    factions,
    planets,
    sectors,
    stratagems: stratagemsJSON,
    effects,
    biomes,
  };
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
  try {
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

    const { factions, planets, sectors, stratagems, biomes, effects } =
      await prepareForSourceData();

    await db.$transaction([
      // create the war data
      db.war.create({
        data: {
          index: warId,
          time: new Date(warTime.time * 1000),
          endDate: new Date(warInfo.endDate * 1000),
          startDate: new Date(warInfo.startDate * 1000),
        },
      }),
      // generate the faction data
      ...factions.map(faction => db.faction.create({ data: faction })),
      // create all biomes
      ...biomes.map(biome => db.biome.create({ data: biome })),
      // create all effects
      ...effects.map(effect => db.effect.create({ data: effect })),
      // generate the assignment data
      ...warAssignments.map(assignment => {
        const now = Date.now();
        const expiresAt = now + assignment.expiresIn * 1000;
        return db.assignment.create({
          data: {
            index: assignment.id32,
            type: assignment.setting.type,
            expiresAt: new Date(expiresAt),
            progress: assignment.progress.join(","),
            title: assignment.setting.overrideTitle,
            briefing: assignment.setting.overrideBrief,
            description: assignment.setting.taskDescription,
            reward: {
              create: {
                type: assignment.setting.reward.type,
                index: assignment.setting.reward.id32,
                amount: assignment.setting.reward.amount,
              },
            },
            tasks: {
              create: assignment.setting.tasks.map(task => ({
                type: task.type,
                values: task.values.join(","),
                valueTypes: task.valueTypes.join(","),
              })),
            },
          },
        });
      }),
      // generate news data
      ...warNews
        .sort((a, b) => a.id - b.id)
        .map(article => {
          return db.news.create({
            data: {
              index: article.id,
              type: article.type,
              message: article.message ?? "",
              tagIds: article.tagIds.join(","),
              publishedAt: new Date(article.published * 1000),
            },
          });
        }),
      // generate stratagem data
      ...Object.keys(stratagems).map(key => {
        return db.stratagemGroup.create({
          data: {
            name: stratagems[key].name,
            stratagems: {
              create: stratagems[key].entries.map(stratagem => ({
                ...stratagem,
                keys: stratagem.keys.join(","),
              })),
            },
          },
        });
      }),
      // generate the sector data
      ...sectors.map(sector => {
        return db.sector.create({
          data: { index: sector.index, name: sector.name },
        });
      }),
      // generate global stats
      ...(() => {
        if (!warStats.galaxy_stats) return [];
        const global = warStats.galaxy_stats;
        return [
          db.stats.create({
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
          }),
        ];
      })(),
      // generate the planet data
      ...planets.map(planet => {
        const { planetsProgress } = warHistory;

        const info = warInfo.planetInfos.find(p => p.index === planet.index)!;
        const lib = planetsProgress.find(p => p.planetIndex === planet.index);
        const status = warStatus.planetStatus.find(
          p => p.index === planet.index,
        )!;

        const planetBiome = biomes.find(b => b.index === planet.biome);

        const planetSector = sectors.find(s => {
          return s.planets.some(p => p.index === planet.index);
        });

        const planetEffects = planet.effects.map(e =>
          effects.find(f => f.index === e),
        );

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

        const stats = warStats.planets_stats.find(p => {
          return p.planetIndex === planet.index;
        });

        return db.planet.create({
          data: {
            name: planet.name,
            index: planet.index,
            health: status.health,
            disabled: info.disabled,
            players: status.players,
            maxHealth: info.maxHealth,
            imageUrl: planet.imageUrl,
            positionX: info.position.x,
            positionY: info.position.y,
            regeneration: status.regenPerSecond,
            owner: { connect: { index: status.owner } },
            biome: { connect: { index: planetBiome?.index } },
            sector: { connect: { index: planetSector?.index } },
            initialOwner: { connect: { index: info.initialOwner } },
            effects: { connect: planetEffects.map(e => ({ index: e?.index })) },
            // liberation data based on history api
            liberationState,
            liberationRate: lib?.liberationChange ?? 0,
            liberation: 100 - (100 / info.maxHealth) * status.health,
            ...(!!stats
              ? {
                  statistic: {
                    create: {
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
                      illuminateKills: BigInt(stats.illuminateKills),
                    },
                  },
                }
              : {}),
          },
        });
      }),
      // generate attack and defense data
      ...warStatus.planetAttacks.map(attack => {
        return db.attack.create({
          data: {
            source: { connect: { index: attack.source } },
            target: { connect: { index: attack.target } },
          },
        });
      }),
      // generate the campaign data
      ...(() => {
        const campaignPlanets = planets.filter(p => {
          return warStatus.campaigns.map(c => c.planetIndex).includes(p.index);
        });

        return warStatus.campaigns.map(campaign => {
          const planet = campaignPlanets.find(
            p => p.index === campaign.planetIndex,
          )!;
          return db.campaign.create({
            data: {
              index: campaign.id,
              type: campaign.type,
              count: campaign.count,
              planet: { connect: { index: planet.index } },
            },
          });
        });
      })(),
      // generate the planet event data (attack/defend orders)
      ...warStatus.planetEvents.map(event => {
        const planet = planets.find(p => p.index === event.planetIndex);
        const faction = factions.find(f => f.index === event.race);
        const jointOp = warStatus.jointOperations.find(j => j.id === event.id);
        return db.order.create({
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
            faction: faction
              ? { connect: { index: faction.index } }
              : undefined,
          },
        });
      }),
      // generate the global event data
      ...warStatus.globalEvents.map(globals => {
        const faction = factions.find(f => f.index === globals.race);
        const targets = planets.filter(p => {
          globals.planetIndices.includes(p.index);
        });
        return db.globalEvent.create({
          data: {
            title: globals.title,
            index: globals.eventId,
            message: globals.message,
            planets: { connect: targets.map(p => ({ index: p.index })) },
            faction: faction
              ? { connect: { index: faction.index } }
              : undefined,
          },
        });
      }),
      // create the home world data
      ...warInfo.homeWorlds
        .filter(world => {
          const owner = factions.find(f => f.index === world.race)!;
          const home = planets.find(p => world.planetIndices?.[0] === p.index)!;
          return !!home && !!owner;
        })
        .map(world => {
          const owner = factions.find(f => f.index === world.race)!;
          const home = planets.find(p => world.planetIndices?.[0] === p.index)!;
          return db.homeWorld.create({
            data: {
              faction: { connect: { index: owner.index } },
              planet: { connect: { index: home.index } },
            },
          });
        }),
    ]);
  } catch (err) {
    Sentry.captureException(err);
  }
}
