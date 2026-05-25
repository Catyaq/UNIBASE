import { POINTS_RULES } from "@/config/points";

export function PointsRulesCard() {
  return (
    <div className="uni-card-inset px-4 py-3">
      <p className="uni-label">Points per transaction</p>
      <ul className="uni-caption mt-2 space-y-1">
        <li>Free GM · +{POINTS_RULES.freeGm} pts</li>
        <li>Paid GM · +{POINTS_RULES.paidGm} pts</li>
        <li>Free deploy · +{POINTS_RULES.freeDeploy} pts</li>
        <li>Paid deploy · +{POINTS_RULES.paidDeploy} pts</li>
      </ul>
    </div>
  );
}
