const epoch_value = new Date(0).getTime();

const epoch = {
  add: (milliseconds: number) => {
    return new Date(epoch_value + milliseconds).getTime();
  },

  addSeconds: (seconds: number) => {
    return new Date(epoch_value + seconds * 1000).getTime();
  },
};

/**
 * This utility is used to calculate the strange in-game time for
 * dispatches, orders and other game events.
 */
export default function GameDate(time: number, start: number) {
  const gameTime = epoch.addSeconds(start + time);
  const gameTimeDeviation = Date.now() - gameTime;
  const relativeGameStart =
    epoch.add(gameTimeDeviation) + epoch.addSeconds(start);

  return {
    add: (milliseconds: number) => {
      return new Date(relativeGameStart + milliseconds).getTime();
    },

    addSeconds: (seconds: number) => {
      return new Date(relativeGameStart + seconds * 1000).getTime();
    },
  };
}
