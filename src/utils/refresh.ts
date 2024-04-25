import * as Sentry from "@sentry/bun";

import db from "utils/database";
import GameDate from "utils/game-date";
import { fetchSourceData, prepareForSourceData } from "utils/generate";

/**
 * Refreshes all the database data based on the current war status.
 * If database is empty, it will create not create any data
 */
export async function refreshAndStoreSourceData() {
  try {
    const { factions, planets, sectors } = await prepareForSourceData();

    const {
      warId,
      warNews,
      warTime,
      warInfo,
      warStats,
      warStatus,
      warHistory,
      warAssignments,
    } = await fetchSourceData();

    const result: { trx?: any[] } = { trx: [] };
    const gameDate = GameDate(warTime.time, warInfo.startDate);

    result.trx = await db.$transaction([
      // Delete existing data
      db.assignmentTask.deleteMany(),
      db.assignment.deleteMany(),
      db.reward.deleteMany(),
      db.news.deleteMany(),
      db.stats.deleteMany(),
      db.attack.deleteMany(),
      db.campaign.deleteMany(),
      db.order.deleteMany(),
      db.globalEvent.deleteMany(),
      db.homeWorld.deleteMany(),
      // update war data
      db.war.update({
        where: { index: warId },
        data: {
          index: warId,
          time: new Date(warTime.time * 1000),
          endDate: new Date(warInfo.endDate * 1000),
          startDate: new Date(warInfo.startDate * 1000),
        },
      }),
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
            tasks: {
              create: assignment.setting.tasks.map(task => ({
                type: task.type,
                values: task.values.join(","),
                valueTypes: task.valueTypes.join(","),
              })),
            },
            reward: {
              create: {
                type: assignment.setting.reward.type,
                index: assignment.setting.reward.id32,
                amount: assignment.setting.reward.amount,
              },
            },
          },
        });
      }),
      // generate news data
      ...warNews
        .sort((a, b) => a.id - b.id)
        .map(article => {
          const publishedAt = gameDate.addSeconds(article.published);
          return db.news.create({
            data: {
              index: article.id,
              type: article.type,
              message: article.message ?? "",
              tagIds: article.tagIds.join(","),
              publishedAt: new Date(publishedAt),
            },
          });
        }),
      // generate the sector data
      ...sectors.map(sector => {
        return db.sector.update({
          where: { index: sector.index },
          data: { index: sector.index, name: sector.name },
        });
      }),
      // generate the faction data
      ...factions.map(faction => {
        return db.faction.update({
          where: { index: faction.index },
          data: faction,
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

        const stats = warStats.planets_stats.find(p => {
          return p.planetIndex === planet.index;
        });

        return db.planet.update({
          where: { index: planet.index },
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

        const startTime = gameDate.addSeconds(event.startTime);
        const expireTime = gameDate.addSeconds(event.expireTime);

        return db.order.create({
          data: {
            index: event.id,
            eventType: event.eventType === 1 ? "DEFEND" : "ATTACK",
            health: event.health,
            maxHealth: event.maxHealth,
            hqNodeIndex: jointOp?.hqNodeIndex,
            startTime: new Date(startTime),
            expireTime: new Date(expireTime),
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

    delete result.trx;
  } catch (err) {
    Sentry.captureException(err);
  }
}
