# CSdiversity

A web application for visualizing and analyzing academic conference data from top-tier systems and networks conferences (OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC, and others).

## What is this?

This tool helps you explore patterns and trends in academic research conferences. You can:

- **View geographic distribution** of papers across continents
- **Track Asian academic contributions** over time
- **Compare Big Tech vs Academia** participation
- **Analyze committee representation** vs accepted papers
- **Explore diversity metrics** across conferences

## Features

### Continent Distribution
See how papers are distributed across North America, Europe, Asia, and other regions. Filter by conference and year to explore specific trends.

### Asian Trends
Track the evolution of Asian academic contributions from 2000 to 2024. View trends by individual conference or aggregate across all conferences.

### Big Tech vs Academia
Compare contributions from major technology companies (Google, Microsoft, Meta, Amazon, Apple) versus academic institutions.

### Committee vs Papers
Analyze the gap between program committee composition and accepted papers. Identify over-representation and under-representation patterns.

### Diversity Metrics
Explore geographic diversity using the Gini-Simpson Index. Higher values indicate more balanced distribution across continents.

## Data Sources

The dataset includes:
- Approximately 9,712 accepted papers
- 14,996 program committee members (6,917 unique individuals)
- Data from 2000-2024
- Conferences: OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC

Data is collected from DBLP, Semantic Scholar APIs, and official conference websites. The dataset is publicly available at [github.com/Marina-LA/ConferenceData](https://github.com/Marina-LA/ConferenceData).

## Methodology

### Continental Classification
Papers and committee members are mapped to continents based on author affiliations. If most authors belong to the same continent, the paper is assigned accordingly. Over 90% of papers were assigned unambiguously to a single continent.

### Diversity Index
The Gini-Simpson Index measures diversity from 0 (homogeneous) to 1 (highly diverse). It's calculated as D = 1 - Σ(p_i²), where p_i is the proportion of each continent category.

### Committee vs Papers Gap
The representation gap is calculated as Committee % minus Papers % for each continent. A positive gap indicates committee over-representation.

## Analytics & Instrumentation

The live deployment wires Google Analytics 4 (`gtag.js`, ID provided via `NEXT_PUBLIC_GA_MEASUREMENT_ID`). Beyond page views, the UI emits rich interaction events so we can understand how each dashboard is used:

- **Global navigation:** every client-side route change triggers a pageview.
- **Filters:** conference multi-select, year dropdowns and quick actions fire events when options are toggled, cleared, or set to “all”.
- **Geo toggles:** continent/country switches on dashboards (Accepted Papers, Program Committee, main overview) log the chosen mode and active filters.
- **Big Tech vs Academia:** records sort order, top-N selection, conference/year filters, and aggregate vs all-series mode.
- **Asian Trends:** tracks conference search queries (on blur), top-k buttons, view mode switches, reset actions, and manual conference selection/removal.
- **Country Ranking & Country Analysis:** search input, tab/mode changes, country filters, visibility toggles, focus changes, and year-range adjustments generate events with context (selection size, mode, etc.).
- **Committee vs Papers & Diversity views:** log continent selection, year-range presets/custom ranges, and aggregate-vs-all switches.

Events are only sent when `window.gtag` exists (i.e., GA is correctly initialised), preventing errors during local development. Check GA4 Realtime to verify instrumentation after deploying with the measurement ID.

## Development

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production
```bash
npm run build
```

The static export will be generated in the `out/` directory.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy automatically

### GitHub Pages
1. Set environment variables:
   ```
   GITHUB_PAGES=true
   GITHUB_REPOSITORY=username/repo-name
   ```
2. Build:
   ```bash
   npm run build:gh-pages
   ```
3. Deploy the `out/` directory to GitHub Pages

### Static Hosting (Netlify, Cloudflare Pages, etc.)
1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy the `out/` directory

## Environment Variables

Create a `.env.local` file based on `env.example`:
```
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## About

This visualization tool was created to help understand trends and patterns in academic conference participation. For questions or feedback, visit the [GitHub repository](https://github.com/Marina-LA/ConferenceData).
