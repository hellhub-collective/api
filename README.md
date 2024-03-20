<p align="center">
  <img src="./assets/logo.png" width="150px" alt="HellHub Logo" />
</p>

<h3 align="center">The Official API For The Community Driven HellHub App.</h3>
<p align="center">Written 100% in Typescript, running on Bun. Pulls data from the official API and acts as cache/transformer relay.</p>

<br>

## Whats is the HellHub API?

The unofficial API was not explicitly made usable by Arrowhead Game Studios for third parties, may be subject to change at any time. This API will be updated to reflect any changes to the game API.

### How does it work?

The API is written in Typescript and runs on the Bun framework. It pulls data from the Helldivers 2 API and transforms it into a more user-friendly format. It also caches the data so that the app can pull data from the API without having to worry about rate limits or slow response times.

## Rate limit

The HellHub API has a rate limit of 200 requests per minute. To avoid hitting rate limits in your clients check the following headers in your response:

- `X-Rate-Limit`: The maximum number of requests per minute.
- `X-Rate-Count`: The number of requests made in the current minute.
- `X-Rate-Reset`: The time at which the current rate limit resets.
- `X-Rate-Remaining`: The number of requests remaining.

## API Entities and Endpoints

For the full full documentation, check out the [postman collection](./postman.json) inside the repository root.

### Sectors

Sectors contain a number of planets and define a area on the galaxy map. We have manually mapped all planets to their respective sectors, if new planets should start existing (what is highly unlikely) we will add them too.

### Planets

Celestial bodies inside a sector. As the war for democracy rages on, the planets are the main battlegrounds. Planets carry player counts and controlling faction.

### Attacks

Attacks always have a source and a target. The source is the planet that the attack is coming from, and the target is the planet that the attack is going to. You an check the attack progress by having a look on the planet's health properties.

### Factions

Factions are divided in three groups: Terminids, Humans and Automatons. Humans are the only faction that can be controlled by players. The other two are controlled by the game as Non-Player Characters (NPCs).

### War

The current war season is the 1st. The war season is a period of time in which the factions fight for control of the planets. The war season has a start and an end date which of the time of this writing is bugged out and not working properly.

### Events

Events are in game briefings and updates that are sent to the players. They are used to inform the players about the current state of the game and the war.
