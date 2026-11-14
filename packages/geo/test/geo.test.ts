import { describe, expect, it } from 'vitest';
import { AGENCY_SEED, agencyCountByProvince, PROVINCE_CODES, PROVINCES } from '../src';
import { PROVINCE_SHAPES } from '../src/provinces-map';

describe('référentiel géographique', () => {
  it('décrit et dessine les 26 provinces', () => {
    expect(PROVINCE_CODES).toHaveLength(26);
    expect(Object.keys(PROVINCES).sort()).toEqual([...PROVINCE_CODES].sort());
    expect(Object.keys(PROVINCE_SHAPES).sort()).toEqual([...PROVINCE_CODES].sort());
    for (const shape of Object.values(PROVINCE_SHAPES)) expect(shape.path).toMatch(/^M[\d.,L]+Z/);
  });

  it('contient 59 agences uniques réparties sur 20 provinces', () => {
    expect(AGENCY_SEED).toHaveLength(59);
    expect(new Set(AGENCY_SEED.map((a) => a.slug)).size).toBe(59);
    const covered = Object.keys(agencyCountByProvince());
    expect(covered).toHaveLength(20);
    expect(covered).not.toContain('tshopo');
  });

  it('place chaque agence à l’intérieur de la RDC', () => {
    for (const { location } of AGENCY_SEED) {
      const [lat, lng] = location;
      expect(lat).toBeGreaterThan(-14);
      expect(lat).toBeLessThan(6);
      expect(lng).toBeGreaterThan(12);
      expect(lng).toBeLessThan(32);
    }
  });
});
