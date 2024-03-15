import { PrismaClient } from "@prisma/client";

import { fetchSourceData, prepareForSourceData } from "utils/generate";

const prisma = new PrismaClient();

/**
 * Refreshes all the database data based on the current war status.
 * If database is empty, it will create not create any data
 */
export async function refreshAndStoreSourceData() {
  const { factions, planets, sectors } = await prepareForSourceData();
  const { warInfo, warStatus } = await fetchSourceData();

  await prisma.war.update({
    where: { index: warInfo.warId },
    data: {
      index: warInfo.warId,
      endDate: new Date(warInfo.endDate),
      startDate: new Date(warInfo.startDate),
    },
  });

  // generate the sector data
  for (const sector of sectors) {
    await prisma.sector.update({
      where: { index: sector.index },
      data: sector,
    });
  }

  // generate the faction data
  for (const faction of factions) {
    await prisma.faction.update({
      where: { index: faction.index },
      data: faction,
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

    const planetSector = sectors.filter(s => s.index === info.sector).length
      ? info.sector
      : -1;

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
        sector: { connect: { index: planetSector } },
        initialOwner: { connect: { index: info.initialOwner } },
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

  // generate the global event data
  await prisma.globalEvent.deleteMany();
  for (const globals of warStatus.globalEvents) {
    const faction = factions.find(f => f.index === globals.race);

    const targets = planets.filter(p => {
      globals.planetIndices.includes(p.index);
    });

    if (!faction?.index) {
      console.warn(`No faction found for global event`, {
        faction: globals.race,
      });
      continue;
    }

    await prisma.globalEvent.create({
      data: {
        title: globals.title,
        index: globals.eventId,
        message: globals.message,
        faction: { connect: { index: faction.index } },
        planets: { connect: targets.map(p => ({ index: p.index })) },
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
