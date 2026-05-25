/** Points per Hub action — must match Hub.sol constants */
export const POINTS_RULES = {
  freeGm: 10,
  paidGm: 20,
  freeDeploy: 20,
  paidDeploy: 40,
} as const;

export type PointsAction = keyof typeof POINTS_RULES;

export function pointsForGm(isPaid: boolean): number {
  return isPaid ? POINTS_RULES.paidGm : POINTS_RULES.freeGm;
}

export function pointsForDeploy(isPaid: boolean): number {
  return isPaid ? POINTS_RULES.paidDeploy : POINTS_RULES.freeDeploy;
}
