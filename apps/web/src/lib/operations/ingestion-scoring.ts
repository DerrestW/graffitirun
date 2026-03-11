import type { NormalizedTopicCandidate } from "@/lib/domain";

export function scoreCandidate(candidate: NormalizedTopicCandidate) {
  const freshness = candidate.providerKey === "mock_fixture" ? 82 : 76;
  const viral = candidate.rawCategory === "animals" ? 90 : candidate.rawCategory === "weather" ? 88 : 79;
  const brandFit = candidate.rawCategory === "animals" ? 93 : 85;
  const rightsRisk = candidate.rightsConfidence === "high" ? 18 : 28;
  const tragedyRisk = candidate.rawCategory === "animals" ? 8 : 4;
  const politicalRisk = candidate.rawCategory === "politics" ? 90 : 0;
  const duplicateRisk = 15;
  const final = Math.max(0, Math.round((freshness + viral + brandFit) / 3 - rightsRisk * 0.15 - duplicateRisk * 0.1));

  return {
    freshness,
    viral,
    brandFit,
    rightsRisk,
    tragedyRisk,
    politicalRisk,
    duplicateRisk,
    final,
  };
}
