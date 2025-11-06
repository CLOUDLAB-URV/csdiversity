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

## About

This visualization tool was created to help understand trends and patterns in academic conference participation. For questions or feedback, visit the [GitHub repository](https://github.com/Marina-LA/ConferenceData).
