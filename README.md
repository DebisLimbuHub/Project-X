# Spectre Intel

A real-time cybersecurity intelligence dashboard for tracking global threats, APT campaigns, CVEs, ransomware activity, and critical infrastructure risk. Built for OSINT analysts and anyone who wants an always-on view of the threat landscape.

Inspired by [World Monitor](https://worldmonitor.app) by Elie Habib, adapted for cybersecurity operations.

---

## What it does

The dashboard has two main views: **Dashboard** and **Cyber Intel**.

The Dashboard centres on an interactive world map with live threat overlays on either side. The Cyber Intel view aggregates cybersecurity news from 40+ sources into a single feed.

### Threat Map

The map pulls from multiple open data sources and renders them as toggleable layers:

- APT group markers with MITRE ATT&CK data (15+ state-sponsored actors)
- Animated attack vector arcs showing origin to target
- Critical infrastructure sites (energy, water, transport, telecom)
- Internet outage overlays via Cloudflare Radar and IODA
- BGP route anomaly detection
- Botnet C2 server locations via Abuse.ch FeodoTracker
- Undersea cable routes via TeleGeography

Time filter controls let you scope the map to the last 1h, 6h, 24h, 48h, or 7d.

### Left Sidebar

- **Live Channels** — embedded security/news streams (YouTube, HLS, iframe)
- **Threat Feed** — clustered RSS stories with Jaccard similarity grouping and velocity analysis
- **Active Threats** — current high-priority threat actors and campaigns
- **Attack Origins** — country-level attribution breakdown

### Right Sidebar

- **Threat Level** — composite 0-10 risk score
- **Infrastructure Risk** — per-sector risk levels
- **CVE Feed** — NVD and CISA KEV vulnerabilities with severity scoring
- **Signal Panel** — correlation engine that detects convergence, triangulation, velocity spikes, APT surges, and patch gaps
- **Ransomware Tracker** — active groups and recent victims
- **Cyber Stocks** — live prices for CRWD, PANW, FTNT, ZS, S

### Other

- Scrolling alert ticker along the bottom
- Global search with Ctrl+K / Cmd+K
- Source ranking across four tiers: Government, Major Press, Vendor, Community

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| Map | Leaflet.js with CartoDB dark tiles |
| Charts | Recharts |
| State | Zustand |
| Styling | Tailwind CSS |
| Workers | Web Workers for clustering |
| Storage | IndexedDB for snapshots |
| Hosting | Vercel |

---

## Quick Start

```bash
npm install
npm run dev
# http://localhost:5173
```

---

## Data Sources

Everything runs on free, open APIs and RSS feeds. No paid subscriptions needed for core functionality.

---

## Acknowledgments

- [World Monitor](https://worldmonitor.app) by Elie Habib
- [MITRE ATT&CK](https://attack.mitre.org)
- [CISA](https://cisa.gov)
- [Abuse.ch](https://abuse.ch)

---

MIT License
