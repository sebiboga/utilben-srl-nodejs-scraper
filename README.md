# job_seeker_ro_spider — UTILBEN SRL Scraper

[![Oportunitati SI Cariere](https://github.com/sebiboga/utilben-srl-nodejs-scraper/actions/workflows/job-seeker-ro-spider.yml/badge.svg)](https://github.com/sebiboga/utilben-srl-nodejs-scraper/actions/workflows/job-seeker-ro-spider.yml)
[![Automation Tests](https://github.com/sebiboga/utilben-srl-nodejs-scraper/actions/workflows/automation-testing.yml/badge.svg)](https://github.com/sebiboga/utilben-srl-nodejs-scraper/actions/workflows/automation-testing.yml)

[![Version](https://img.shields.io/github/package-json/v/sebiboga/utilben-srl-nodejs-scraper?label=version&color=blue)](CHANGELOG.md)
[![Test Results](https://img.shields.io/badge/test--results-HTML-9b59b6)](https://sebiboga.github.io/utilben-srl-nodejs-scraper/test-results/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/javascript-ESM-F7DF1E?logo=javascript&logoColor=black)](https://ecma-international.org/)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fpeviitor.ro&label=peviitor.ro)](https://peviitor.ro)
[![GitHub Pages](https://img.shields.io/github/deployments/sebiboga/utilben-srl-nodejs-scraper/github-pages?label=GitHub%20Pages)](https://sebiboga.github.io/utilben-srl-nodejs-scraper/)

**job_seeker_ro_spider** — un scraper pentru job-urile UTILBEN SRL din România. Extrage anunțurile de pe [eJobs.ro](https://www.ejobs.ro/company/utilben/123016) și [ANOFM](https://www.anofm.ro) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

> **🌱 Derived Scraper.** Acest repo este un scraper derivat din [sebiboga/epam-systems-international-srl-nodejs-scraper](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper).

## Overview

Proiectul automatizează colectarea zilnică a job-urilor UTILBEN din România, menținând board-ul peviitor.ro la zi cu cele mai recente oportunități de carieră.

## Features

- Extrage job-uri de pe eJobs.ro și ANOFM
- Validează compania via ANAF (CIF 18643343, status activ)
- Cache ANAF la 7 zile — committed în repo
- Fallback la cache stale dacă ANAF e indisponibil
- Stochează în SOLR (job core + company core)
- GitHub Actions: scrape zilnic + testare automată

## Project Structure

```
├── index.js                    # Main scraper entry point
├── company.js                  # Company validation via ANAF + SOLR
├── solr.js                     # SOLR operations
├── config/
│   ├── company.json            # Single source of truth
│   └── company.js              # ESM loader
├── src/
│   ├── anaf.js                 # ANAF API module
│   ├── markdown-generator.js   # Generates docs/jobs.md
│   └── job-validator.js        # URL validation
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests (live ANAF + SOLR)
│   ├── e2e/                    # End-to-end tests
│   └── consistency/            # Repo consistency checks
├── .github/workflows/
│   ├── job-seeker-ro-spider.yml
│   └── automation-testing.yml
└── docs/                       # GitHub Pages
```

## Setup

### Prerequisites
- Node.js 24+
- npm

### Installation

```bash
npm install
```

### Configuration

```bash
export SOLR_AUTH="username:password"
```

## Usage

```bash
npm run scrape       # Run scraper
npm test             # All tests
npm run test:unit    # Unit tests
npm run test:e2e     # E2E tests
```

## Workflows

### Daily Scraping

The `job-seeker-ro-spider.yml` workflow runs daily at 6 AM UTC via GitHub Actions.

### Test Automation

The `automation-testing.yml` workflow runs on every push and pull request.

## Acknowledgments

This project was developed with assistance from **AI agents** and is derived from the [EPAM template scraper](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper).

## License

Copyright (c) 2024-2026 BOGA SEBASTIAN-NICOLAE
Licensed under the [MIT License](LICENSE).

## Managed By

This project is managed by [ASOCIATIA OPORTUNITATI SI CARIERE](https://oportunitatisicariere.ro) for the [peviitor.ro](https://peviitor.ro) job board project.
