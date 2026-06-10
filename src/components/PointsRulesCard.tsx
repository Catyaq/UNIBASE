import { POINTS_RULES } from "@/config/points";

export function PointsRulesCard() {
  return (
    <div className="uni-card-inset px-3 py-2">
      <p className="uni-label text-[0.6875rem]">Points per tx</p>
      <ul className="uni-caption mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[0.75rem]">
        <li>Free GM · +{POINTS_RULES.freeGm} pts</li>
        <li>Paid GM · +{POINTS_RULES.paidGm} pts</li>
        <li>Free deploy · +{POINTS_RULES.freeDeploy} pts</li>
        <li>Paid deploy · +{POINTS_RULES.paidDeploy} pts</li>
      </ul>
    </div>
  );
}
