/**
 * Geotechnical Calculations according to IS 2131
 */

/**
 * Calculates the Raw N-value from the three SPT blow count intervals.
 * SPT consists of 0-15cm (seating drive), 15-30cm, and 30-45cm.
 * Raw N = sum of blows in 15-30cm and 30-45cm.
 */
export function calculateRawN(blow15_30: number, blow30_45: number): number {
  return (blow15_30 || 0) + (blow30_45 || 0);
}

/**
 * Applies Dilatancy Correction (IS 2131)
 * For fine sand and silty sand below water table, if raw N' exceeds 15:
 * N'' = 15 + 0.5 * (N' - 15)
 */
export function applyDilatancyCorrection(rawN: number): number {
  if (rawN <= 15) {
    return rawN;
  }
  return Math.round(15 + 0.5 * (rawN - 15));
}

/**
 * Applies Overburden Pressure Correction (IS 2131 / Peck, Hanson, and Thornburn)
 * Formula: Cn = 0.77 * log10(2000 / sigma_v) where sigma_v is effective overburden pressure in kN/m2.
 * Cn should lie between 0.45 and 2.0 (IS 2131 guidelines).
 * 
 * Approximate effective overburden pressure:
 * - Above water table: depth * 18.0 kN/m3
 * - Below water table: depth * (18.0 - 9.81) kN/m3 (buoyant unit weight)
 */
export function calculateOverburdenCorrection(
  depth: number,
  rawN: number,
  waterTableDepth?: number
): { correctedN: number; correctionFactor: number } {
  if (depth <= 0) {
    return { correctedN: rawN, correctionFactor: 1.0 };
  }

  const unitWeightAboveWT = 18.0; // kN/m3
  const unitWeightSubmerged = 9.81; // kN/m3 (buoyant effect)
  
  let effectivePressure = 0;

  if (waterTableDepth === undefined || depth <= waterTableDepth) {
    // Entire depth is above water table
    effectivePressure = depth * unitWeightAboveWT;
  } else {
    // Partially below water table
    const dryDepth = waterTableDepth;
    const submergedDepth = depth - waterTableDepth;
    effectivePressure = (dryDepth * unitWeightAboveWT) + (submergedDepth * unitWeightSubmerged);
  }

  // Prevent division by zero or negative log values
  if (effectivePressure <= 0) {
    effectivePressure = 1.0;
  }

  // Cn = 0.77 * log10(1900 / effectivePressure) or 2000 / effectivePressure
  const correctionFactor = 0.77 * Math.log10(2000 / effectivePressure);

  // Clamp correction factor between 0.45 and 2.0 as per IS 2131
  const clampedFactor = Math.max(0.45, Math.min(2.0, correctionFactor));
  const correctedN = Math.round(rawN * clampedFactor);

  return {
    correctedN,
    correctionFactor: parseFloat(clampedFactor.toFixed(2)),
  };
}

/**
 * Interprets SPT N-value to density description for cohesionless soil (IS 2131)
 */
export function getDensityInterpretation(nValue: number): string {
  if (nValue < 4) {
    return 'Very loose (बहुत ढीला)';
  } else if (nValue <= 10) {
    return 'Loose (ढीला)';
  } else if (nValue <= 30) {
    return 'Medium dense (मध्यम)';
  } else if (nValue <= 50) {
    return 'Dense (घना)';
  } else {
    return 'Very dense (बहुत घना/रिफ्यूजल)';
  }
}
