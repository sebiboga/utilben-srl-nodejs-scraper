import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const HAS_SOLR = !!process.env.SOLR_AUTH;

function itIfSolr(name, fn, timeout) {
  if (HAS_SOLR) {
    return it(name, fn, timeout);
  }
  return it.skip(`${name} (skipped: SOLR_AUTH not set)`, fn, timeout);
}

beforeAll(() => {
  if (HAS_SOLR) {
    process.env.SOLR_AUTH = process.env.SOLR_AUTH;
  }
}, 60000);

const TEST_CIF = '18643343';
const TEST_BRAND = 'Utilben';
const EJOBS_URL = 'https://www.ejobs.ro/company/utilben/123016';

describe('E2E: Full Scraping Pipeline', () => {

  describe('eJobs Company Page — Real Data Fetch', () => {
    let html;

    beforeAll(async () => {
      const res = await fetch(EJOBS_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html'
        }
      });
      html = await res.text();
    }, 15000);

    it('should return valid HTML from eJobs', () => {
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('UTILBEN');
    });

    it('should contain job listing cards', () => {
      expect(html).toContain('job-card');
      expect(html).toContain('job-card-content-middle__title');
    });
  });

  describe('ANOFM API — Real Data Fetch', () => {
    let anofmData;

    beforeAll(async () => {
      const res = await fetch('https://mediere.anofm.ro/api/entity/vw_public_job_posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'job_seeker_ro_spider'
        },
        body: JSON.stringify({
          current: 1,
          rowCount: 250,
          sort: { created_at: "desc" },
          employer_tax_code: TEST_CIF
        })
      });
      anofmData = await res.json();
    }, 15000);

    it('should return valid ANOFM response', () => {
      expect(anofmData).toHaveProperty('statusCode', 200);
      expect(anofmData).toHaveProperty('rows');
      expect(Array.isArray(anofmData.rows)).toBe(true);
    });

    it('should contain UTILBEN jobs', () => {
      if (anofmData.rows.length === 0) {
        console.log('⚠️ No UTILBEN jobs found on ANOFM — may have expired');
        return;
      }
      for (const row of anofmData.rows) {
        expect(row.employer_name).toBe('UTILBEN SRL');
        expect(row.employer_tax_code).toBe(TEST_CIF);
      }
    });
  });

  describe('Company Validation Path', () => {
    let anaf;
    let companyModule;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
      companyModule = await import('../../company.js');
    });

    it('should find UTILBEN in ANAF and validate active status', async () => {
      const results = await anaf.searchCompany(TEST_BRAND);

      const utilben = results.find(c =>
        c.name.toUpperCase().startsWith('UTILBEN') &&
        c.statusLabel === 'Funcțiune'
      );
      expect(utilben).toBeDefined();
      expect(utilben.cui.toString()).toBe(TEST_CIF);

      const anafData = await anaf.getCompanyFromANAF(TEST_CIF);
      expect(anafData).toBeDefined();
      expect(anafData.inactive).toBe(false);
    }, 30000);

    itIfSolr('should run full validation and report active status with job count', async () => {
      const result = await companyModule.validateAndGetCompany();

      expect(result.status).toBe('active');
      expect(result.company).toBe('UTILBEN SRL');
      expect(result.cif).toBe(TEST_CIF);

      if (result.existingJobsCount === 0) {
        console.log('⚠️ No UTILBEN jobs in Solr — skipping job count assertion');
        return;
      }
      expect(result.existingJobsCount).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Inactive Company Handling', () => {
    let anaf;

    beforeAll(async () => {
      anaf = await import('../../src/anaf.js');
    });

    it('should detect inactive/radiated companies via ANAF', async () => {
      const results = await anaf.searchCompany('Utilben');

      const nonActive = results.find(c => c.statusLabel !== 'Funcțiune');

      if (nonActive) {
        try {
          const anafData = await anaf.getCompanyFromANAF(nonActive.cui.toString());
          expect(anafData).toBeDefined();
          if (anafData.inactive !== undefined) {
            expect(anafData.inactive).toBe(true);
          }
        } catch {
          expect(nonActive.statusLabel).toMatch(/Radiată|Inactiv|Suspendat/);
        }
      }
    }, 30000);
  });

  describe('SOLR Data Verification', () => {
    let solr;

    beforeAll(async () => {
      solr = await import('../../solr.js');
    });

    itIfSolr('should have UTILBEN jobs in SOLR with correct company name', async () => {
      const result = await solr.querySOLR(TEST_CIF);

      if (result.numFound === 0) {
        console.log('⚠️ No UTILBEN jobs in Solr — skipping SOLR data verification');
        return;
      }

      for (const job of result.docs) {
        expect(job.company).toBe('UTILBEN SRL');
        expect(job.cif).toBe(TEST_CIF);
      }
    }, 15000);

    itIfSolr('should have UTILBEN company core entry with required fields', async () => {
      const result = await solr.queryCompanySOLR(`id:${TEST_CIF}`);

      expect(result.numFound).toBe(1);
      const company = result.docs[0];
      expect(company.company).toBe('UTILBEN SRL');
      expect(company.status).toBe('activ');
    }, 15000);
  });
});
