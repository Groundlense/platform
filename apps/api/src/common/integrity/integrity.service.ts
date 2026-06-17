import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/**
 * SHA-256 tamper-evidence chain per the ERD/RBAC spec ("tamper
 * certificates"): every field record (SPT interval, water-table
 * observation) stores a sha256Hash, and SPT intervals additionally chain
 * via prevHash so any after-the-fact edit of a record invalidates every
 * subsequent hash in the borehole.
 *
 * CANONICAL HASH FORM (verification MUST reproduce this exactly):
 *
 *   sha256Hash = SHA256_hex( `${prevHash ?? 'GENESIS'}|${canonicalJson(payload)}` )
 *
 * where canonicalJson(payload) is JSON with:
 *   - object keys sorted ascending (recursively), no whitespace;
 *   - Date values serialized as ISO-8601 UTC strings (Date.toISOString());
 *   - all numeric values (JS numbers AND Prisma Decimal columns) emitted
 *     as String(Number(v)) — i.e. "7.5" for DECIMAL(10,2) 7.50 — so the
 *     same logical value hashes identically regardless of DB scale;
 *   - null and undefined both emitted as null;
 *   - booleans as true/false, strings JSON-escaped.
 *
 * The hashed payload for each record type is the fixed immutable field
 * set selected by hashIntervalPayload / hashWaterTablePayload below.
 * Mutable bookkeeping fields (remarks, isCompleted, updatedAt, ids,
 * GPS hints) are intentionally excluded.
 */
@Injectable()
export class IntegrityService {
  constructor(private readonly db: DatabaseService) {}

  computeRecordHash(prevHash: string | null, record: object): string {
    const material = `${prevHash ?? 'GENESIS'}|${this.canonicalJson(record)}`;

    return createHash('sha256').update(material, 'utf8').digest('hex');
  }

  /**
   * The EXACT immutable field set hashed for an SPT interval record.
   * Changing this set breaks verification of existing chains — never
   * reorder/rename; keys are canonicalized (sorted) at hash time anyway.
   */
  hashIntervalPayload(interval: {
    boreholeId: string;
    intervalNo: number;
    fromDepth: any;
    toDepth: any;
    blow1: number | null;
    blow2: number | null;
    blow3: number | null;
    nValue: number | null;
    nCorrected: number | null;
    isRefusal: boolean;
    penetrationMm: number | null;
    soilDescription: string | null;
    observedAt: Date | string | null;
    recordedByUserId: string | null;
  }): object {
    return {
      boreholeId: interval.boreholeId,
      intervalNo: interval.intervalNo,
      fromDepth: interval.fromDepth,
      toDepth: interval.toDepth,
      blow1: interval.blow1 ?? null,
      blow2: interval.blow2 ?? null,
      blow3: interval.blow3 ?? null,
      nValue: interval.nValue ?? null,
      nCorrected: interval.nCorrected ?? null,
      isRefusal: interval.isRefusal ?? false,
      penetrationMm: interval.penetrationMm ?? null,
      soilDescription: interval.soilDescription ?? null,
      observedAt: this.toIsoOrNull(interval.observedAt),
      recordedByUserId: interval.recordedByUserId ?? null,
    };
  }

  /**
   * Immutable field set for a water-table observation. The model has no
   * prevHash column, so these are hashed standalone with prevHash = null
   * (the 'GENESIS' prefix).
   */
  hashWaterTablePayload(observation: {
    boreholeId: string;
    depth: any;
    observedAt: Date | string;
    readingType: string | null;
    createdByUserId: string;
  }): object {
    return {
      boreholeId: observation.boreholeId,
      depth: observation.depth,
      observedAt: this.toIsoOrNull(observation.observedAt),
      readingType: observation.readingType ?? null,
      createdByUserId: observation.createdByUserId,
    };
  }

  /**
   * Recomputes prevHash/sha256Hash for every interval of the borehole
   * with intervalNo >= fromIntervalNo, re-linking the chain from the
   * stored hash of the nearest preceding interval. Used after a sync
   * upsert lands out of order and after an engineer edits an interval
   * (the edit changes content, so every subsequent link must cascade).
   *
   * Returns the new chain root (last interval's sha256Hash) and the
   * number of rows rewritten.
   */
  async rehashChain(
    boreholeId: string,
    fromIntervalNo: number,
  ): Promise<{
    updated: number;
    chainRoot: string | null;
  }> {
    const previous = await this.db.boreholeInterval.findFirst({
      where: {
        boreholeId,
        intervalNo: { lt: fromIntervalNo },
      },
      orderBy: { intervalNo: 'desc' },
    });

    const tail = await this.db.boreholeInterval.findMany({
      where: {
        boreholeId,
        intervalNo: { gte: fromIntervalNo },
      },
      orderBy: { intervalNo: 'asc' },
    });

    let running: string | null = previous?.sha256Hash ?? null;
    let updated = 0;

    for (const interval of tail) {
      const sha256Hash = this.computeRecordHash(
        running,
        this.hashIntervalPayload(interval),
      );

      if (interval.sha256Hash !== sha256Hash || interval.prevHash !== running) {
        await this.db.boreholeInterval.update({
          where: { id: interval.id },
          data: { prevHash: running, sha256Hash },
        });
        updated += 1;
      }

      running = sha256Hash;
    }

    return { updated, chainRoot: running };
  }

  private toIsoOrNull(value: Date | string | null | undefined): string | null {
    if (value == null) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  /**
   * Deterministic JSON: keys sorted recursively, numbers (including
   * Prisma Decimal) as String(Number(v)), Dates as ISO strings,
   * undefined treated as null. See the canonical-form comment above.
   */
  private canonicalJson(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? String(value) : 'null';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'string') {
      return JSON.stringify(value);
    }

    if (value instanceof Date) {
      return JSON.stringify(value.toISOString());
    }

    // Prisma Decimal (decimal.js) — normalize through Number so the DB
    // scale ("7.50") never changes the hash.
    if (typeof value === 'object' && typeof value.toNumber === 'function') {
      return String(Number(value.toNumber()));
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.canonicalJson(item)).join(',')}]`;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value).sort();
      const entries = keys.map(
        (key) => `${JSON.stringify(key)}:${this.canonicalJson(value[key])}`,
      );
      return `{${entries.join(',')}}`;
    }

    // bigint / anything exotic — stable string fallback.
    return JSON.stringify(String(value));
  }
}
