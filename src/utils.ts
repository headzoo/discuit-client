/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms The number of milliseconds to sleep.
 */
export const sleep = (ms): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
