import db from "utils/database";
import { fetchSourceData, prepareForSourceData } from "utils/generate";

/**
 * Refreshes all the database data based on the current war status.
 * If database is empty, it will create not create any data
 */
export async function refreshAndStoreSourceData() {
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

  await db.war.update({
    where: { index: warId },
    data: {
      index: warId,
      time: new Date(warTime.time * 1000),
      endDate: new Date(warInfo.endDate * 1000),
      startDate: new Date(warInfo.startDate * 1000),
    },
  });

  // generate the assignment data
  await db.assignmentTask.deleteMany();
  await db.assignment.deleteMany();
  await db.reward.deleteMany();
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

    const created = await db.assignment.create({
      data: {
        index: assignment.id32,
        type: assignment.setting.type,
        expiresAt: new Date(expiresAt),
        progress: assignment.progress.join(","),
        title: assignment.setting.overrideTitle,
        briefing: assignment.setting.overrideBrief,
        description: assignment.setting.taskDescription,
        reward: { connect: { index: assignment.setting.reward.id32 } },
      },
    });

    for (const task of assignment.setting.tasks) {
      await db.assignmentTask.create({
        data: {
          type: task.type,
          values: task.values.join(","),
          valueTypes: task.valueTypes.join(","),
          assignment: { connect: { id: created.id } },
        },
      });
    }
  }

  // generate news data
  await db.news.deleteMany();
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

  // generate the sector data
  for (const sector of sectors) {
    await db.sector.update({
      where: { index: sector.index },
      data: { index: sector.index, name: sector.name },
    });
  }

  // generate the faction data
  for (const faction of factions) {
    await db.faction.update({
      where: { index: faction.index },
      data: faction,
    });
  }

  // generate global stats
  await db.stats.deleteMany();
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

    await db.planet.update({
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
  await db.attack.deleteMany();
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

  await db.campaign.deleteMany();
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
  await db.order.deleteMany();
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
  await db.globalEvent.deleteMany();
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
  await db.homeWorld.deleteMany();
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
