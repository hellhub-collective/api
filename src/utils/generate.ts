import path from "path";
import fs from "fs/promises";
import { PrismaClient } from "@prisma/client";

import type { WarInfo, WarStatus } from "types/source";

export interface NameEntry {
  index: number;
  name: string;
}

const prisma = new PrismaClient();

/**
 * Populate the database with names from static JSON files, this needs to be
 * executed before the helldiver's 2 server is contacted.
 */
export async function prepareForSourceData() {
  const [factions, planets, sectors]: NameEntry[][] = [[], [], []];

  const [planetsData, sectorsData, factionsData] = await Promise.all([
    fs.readFile(
      path.join(process.cwd(), "src", "static/planets.json"),
      "utf-8",
    ),
    fs.readFile(
      path.join(process.cwd(), "src", "static/sectors.json"),
      "utf-8",
    ),
    fs.readFile(
      path.join(process.cwd(), "src", "static/factions.json"),
      "utf-8",
    ),
  ]);

  const planetsJSON: Record<string, string> = JSON.parse(planetsData);
  const sectorsJSON: Record<string, string> = JSON.parse(sectorsData);
  const factionsJSON: Record<string, string> = JSON.parse(factionsData);

  // populate planets
  for (const key in planetsJSON) {
    const name = planetsJSON[key];
    planets.push({ index: parseInt(key), name });
  }

  // populate sectors
  for (const key in sectorsJSON) {
    const name = sectorsJSON[key];
    sectors.push({ index: parseInt(key), name });
  }

  // populate factions
  for (const key in factionsJSON) {
    const name = factionsJSON[key];
    factions.push({ index: parseInt(key), name });
  }

  return { factions, planets, sectors };
}

/**
 * Get the data from the helldiver's 2 server, this does only fetch the data
 * and not transform, or store it in the database.
 */
export async function fetchSourceData() {
  const WAR_ID = process.env.WAR_ID!;
  const API_URL = process.env.API_URL!;

  const responses = await Promise.all([
    fetch(`${API_URL}/WarSeason/${WAR_ID}/Status`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "en-US",
      },
    }),
    fetch(`${API_URL}/WarSeason/${WAR_ID}/WarInfo`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "en-US",
      },
    }),
  ]);

  const data = await Promise.all(responses.map(res => res.json()));
  return { warStatus: data[0] as WarStatus, warInfo: data[1] as WarInfo };
}

/**
 * Transform the data from the helldiver's 2 server, and store it in the
 * database.
 */
export async function transformAndStoreSourceData() {
  const { factions, planets, sectors } = await prepareForSourceData();
  const { warInfo, warStatus } = await fetchSourceData();

  await prisma.war.create({
    data: {
      index: warInfo.warId,
      endDate: new Date(warInfo.endDate),
      startDate: new Date(warInfo.startDate),
    },
  });

  // generate the sector data
  for (const sector of sectors) {
    await prisma.sector.create({ data: sector });
  }

  // generate the faction data
  for (const faction of factions) {
    await prisma.faction.create({ data: faction });
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

    await prisma.planet.create({
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
