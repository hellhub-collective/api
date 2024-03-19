import path from "path";
import fs from "fs/promises";
import { PrismaClient } from "@prisma/client";

import type { StratagemMap } from "types/stratagem";
import type { WarInfo, WarStatus } from "types/source";

export interface NameEntry {
  index: number;
  name: string;
}

export interface SectorEntry {
  index: number;
  name: string;
  planets: NameEntry[];
}

const prisma = new PrismaClient();

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
      fs.readFile(
        path.join(process.cwd(), "src", "static/stratagems.json"),
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
  const { warInfo, warStatus } = await fetchSourceData();
  const { factions, planets, sectors, stratagems } =
    await prepareForSourceData();

  // index all stratagems
  await Promise.all([
    prisma.stratagem.deleteMany(),
    prisma.stratagemGroup.deleteMany(),
  ]);

  for (const key in stratagems) {
    const group = await prisma.stratagemGroup.create({
      data: { name: stratagems[key].name },
    });

    for (const stratagem of stratagems[key].entries) {
      await prisma.stratagem.create({
        data: {
          ...stratagem,
          keys: stratagem.keys.join(","),
          group: { connect: { id: group.id } },
        },
      });
    }
  }

  // create the war data
  await prisma.war.create({
    data: {
      index: warInfo.warId,
      endDate: new Date(warInfo.endDate),
      startDate: new Date(warInfo.startDate),
    },
  });

  // generate the sector data
  for (const sector of sectors) {
    await prisma.sector.create({
      data: { index: sector.index, name: sector.name },
    });
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

    const planetSector = sectors.find(s => {
      return s.planets.some(p => p.index === planet.index);
    });

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
        sector: { connect: { index: planetSector?.index } },
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

  // generate the campaign data
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
