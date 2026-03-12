import type { NormalizedTopicCandidate } from "@/lib/domain";

export function scoreCandidate(candidate: NormalizedTopicCandidate) {
  const ageHours = candidate.publishedAt ? Math.max(0, (Date.now() - new Date(candidate.publishedAt).getTime()) / 36e5) : 72;
  const freshnessBase = candidate.providerKey === "mock_fixture" ? 78 : 88;
  const freshness = clamp(Math.round(freshnessBase - Math.min(ageHours, 96) * 0.42), 52, 94);
  const viral =
    candidate.rawCategory === "animals"
      ? 90
      : candidate.rawCategory === "weather"
        ? 88
        : candidate.rawCategory === "celebrity"
          ? 92
          : candidate.rawCategory === "running"
            ? 84
            : candidate.rawCategory === "sports"
              ? 86
              : candidate.rawCategory === "health"
                ? 74
          : 79;
  const brandFit =
    candidate.rawCategory === "animals"
      ? 93
      : candidate.rawCategory === "running"
        ? 90
        : candidate.rawCategory === "sports"
          ? 88
          : candidate.rawCategory === "lifting"
            ? 91
            : candidate.rawCategory === "celebrity"
              ? 82
              : 85;
  const rightsRisk =
    candidate.rightsConfidence === "high"
      ? 16
      : candidate.rightsConfidence === "medium"
        ? 26
        : candidate.rightsConfidence === "low"
          ? 38
          : 32;
  const tragedyRisk = candidate.rawCategory === "animals" ? 8 : candidate.rawCategory === "celebrity" ? 6 : 4;
  const politicalRisk = candidate.rawCategory === "politics" ? 90 : 0;
  const duplicateRisk = candidate.domain ? (candidate.domain.includes("google") ? 24 : 14) : 18;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
