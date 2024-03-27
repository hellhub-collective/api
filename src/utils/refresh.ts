import { PrismaClient } from "@prisma/client";

import { fetchSourceData, prepareForSourceData } from "utils/generate";

const prisma = new PrismaClient();

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
    warAssignments,
  } = await fetchSourceData();

  await prisma.war.update({
    where: { index: warId },
    data: {
      index: warId,
      time: new Date(warTime.time),
      endDate: new Date(warInfo.endDate),
      startDate: new Date(warInfo.startDate),
    },
  });

  // generate the assignment data
  await prisma.assignment.deleteMany();
  await prisma.reward.deleteMany();
  for (const assignment of warAssignments) {
    const now = Date.now();
    const expiresAt = now + assignment.expiresIn * 1000;

    await prisma.reward.create({
      data: {
        type: assignment.setting.reward.type,
        index: assignment.setting.reward.id32,
        amount: assignment.setting.reward.amount,
      },
    });

    await prisma.assignment.create({
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
  await prisma.news.deleteMany();
  for (const article of warNews) {
    await prisma.news.create({
      data: {
        index: article.id,
        type: article.type,
        message: article.message,
        tagIds: article.tagIds.join(","),
        publishedAt: new Date(article.published),
      },
    });
  }

  // generate the sector data
  for (const sector of sectors) {
    await prisma.sector.update({
      where: { index: sector.index },
      data: { index: sector.index, name: sector.name },
    });
  }

  // generate the faction data
  for (const faction of factions) {
    await prisma.faction.update({
      where: { index: faction.index },
      data: faction,
    });
  }

  // generate global stats
  await prisma.stats.deleteMany();
  if (warStats.galaxy_stats) {
    const global = warStats.galaxy_stats;
    await prisma.stats.create({
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
    const status = warStatus.planetStatus.find(p => p.index === planet.index);
    const info = warInfo.planetInfos.find(p => p.index === planet.index);

    if (!status || !info) {
      console.warn(`No data for planet ${planet.name}`, { status, info });
      continue;
    }

    const planetSector = sectors.find(s => {
      return s.planets.some(p => p.index === planet.index);
    });

    await prisma.planet.update({
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
      },
    });

    const stats = warStats.planets_stats.find(p => {
      return p.planetIndex === planet.index;
    });

    if (!stats) continue;

    // create planetary stats
    await prisma.stats.create({
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
  await prisma.attack.deleteMany();
  for (const attack of warStatus.planetAttacks) {
    await prisma.attack.create({
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

  await prisma.campaign.deleteMany();
  for (const campaign of warStatus.campaigns) {
    const planet = campaignPlanets.find(p => p.index === campaign.planetIndex);

    if (!planet) {
      console.warn(`No planet found for campaign`, {
        campaign,
      });
      continue;
    }

    await prisma.campaign.create({
      data: {
        index: campaign.id,
        type: campaign.type,
        count: campaign.count,
        planet: { connect: { index: planet.index } },
      },
    });
  }

  // generate the planet event data (attack/defend orders)
  await prisma.order.deleteMany();
  for (const event of warStatus.planetEvents) {
    const planet = planets.find(p => p.index === event.planetIndex);
    const faction = factions.find(f => f.index === event.race);
    const jointOp = warStatus.jointOperations.find(j => j.id === event.id);

    await prisma.order.create({
      data: {
        index: event.id,
        eventType: event.eventType === 1 ? "DEFEND" : "ATTACK",
        health: event.health,
        maxHealth: event.maxHealth,
        hqNodeIndex: jointOp?.hqNodeIndex,
        startTime: new Date(event.startTime),
        expireTime: new Date(event.expireTime),
        campaign: { connect: { index: event.campaignId } },
        planet: planet ? { connect: { index: planet.index } } : undefined,
        faction: faction ? { connect: { index: faction.index } } : undefined,
      },
    });
  }

  // generate the global event data
  await prisma.globalEvent.deleteMany();
  for (const globals of warStatus.globalEvents) {
    const faction = factions.find(f => f.index === globals.race);

    const targets = planets.filter(p => {
      globals.planetIndices.includes(p.index);
    });

    await prisma.globalEvent.create({
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
  await prisma.homeWorld.deleteMany();
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

    await prisma.homeWorld.create({
      data: {
        faction: { connect: { index: owner.index } },
        planet: { connect: { index: homeWorldPlanet.index } },
      },
    });
  }
}
