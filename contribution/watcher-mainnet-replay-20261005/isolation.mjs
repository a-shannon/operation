/** Keeps Avalanche scanner initialization while isolating ten unrelated jobs. */
export const resolve = async (specifier, context, nextResolve) => {
  if (context.parentURL?.endsWith('/src/init.ts') && specifier.startsWith('./jobs/') && specifier !== './jobs/initScanner') {
    return { url: import.meta.url, shortCircuit: true };
  }
  return nextResolve(specifier, context);
};
const isolated = () => console.log('WATCHER_UNRELATED_JOB_ISOLATED');
export { isolated as creation, isolated as reveal, isolated as transactionQueueJob,
  isolated as redeem, isolated as revenueJob, isolated as healthCheckJob,
  isolated as tokenNameJob, isolated as widStatusJob, isolated as minimumFeeUpdateJob,
  isolated as rewardCollection };
