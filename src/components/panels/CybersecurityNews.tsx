import { useState, useMemo } from 'react';
import type { ThreatSeverity } from '@/types';
import { sanitiseUrl, truncate } from '@/utils/sanitise';
import { LiveChannelsPanel } from '@/components/panels/LiveChannelsPanel';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewsAlert {
  id: string;
  title: string;
  description: string;
  severity: ThreatSeverity;
  category: string;
  source: string;
  publishedAt: string;
  link: string;
  cve?: string;
}

interface NewsChannel {
  id: string;
  name: string;
  description: string;
  updateLabel: string;
  categories: string[];
  headlines: string[];
  color: string;
}

interface Podcast {
  id: string;
  name: string;
  episodeTitle: string;
  date: string;
  duration: string;
  description: string;
  icon: string;
}

interface TickerItem {
  label: string;
  text: string;
  severity: ThreatSeverity;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ALERTS: NewsAlert[] = [
  {
    id: 'a1',
    title: 'Critical Zero-Day Exploited in Fortinet FortiOS — Active Exploitation Confirmed',
    description: 'A critical zero-day vulnerability (CVSSv3: 9.8) in Fortinet FortiOS SSL-VPN is being actively exploited by nation-state threat actors. Unauthenticated RCE allows full network compromise. Patch immediately or disable SSL-VPN.',
    severity: 'critical',
    category: 'Zero-Day',
    source: 'CISA / Fortinet PSIRT',
    publishedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    link: 'https://www.cisa.gov',
    cve: 'CVE-2025-0211',
  },
  {
    id: 'a2',
    title: 'APT29 (Cozy Bear) Resumes Spear-Phishing Campaign Targeting EU Diplomatic Entities',
    description: 'Russian state-sponsored group APT29 has resumed targeted phishing operations against European foreign ministries and NATO-affiliated organizations. Custom WINELOADER malware variant deployed via compromised wine-tasting event invitations.',
    severity: 'high',
    category: 'APT',
    source: 'Mandiant Threat Intelligence',
    publishedAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    link: 'https://www.mandiant.com',
  },
  {
    id: 'a3',
    title: 'BlackBasta Ransomware Gang Claims Attack on Critical Infrastructure Operator',
    description: 'The BlackBasta ransomware group has claimed responsibility for an attack on a major European energy infrastructure operator, exfiltrating 500GB of operational data. Ransom demand reportedly exceeds $15M.',
    severity: 'critical',
    category: 'Ransomware',
    source: 'BleepingComputer',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    link: 'https://www.bleepingcomputer.com',
  },
  {
    id: 'a4',
    title: 'CVSS 9.1 Vulnerability in Ivanti Connect Secure — Patch Available',
    description: 'Ivanti has patched a critical authentication bypass vulnerability in Connect Secure VPN appliances. Exploitation requires no credentials and enables arbitrary code execution. Over 30,000 appliances internet-exposed.',
    severity: 'high',
    category: 'Vulnerability',
    source: 'Dark Reading',
    publishedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    link: 'https://www.darkreading.com',
    cve: 'CVE-2025-2299',
  },
  {
    id: 'a5',
    title: 'MedusaLocker Operators Shift to Healthcare Targets in Q1 2025',
    description: 'Threat intelligence analysts report a marked increase in MedusaLocker ransomware campaigns against hospital networks and healthcare providers. Average ransom demand has risen to $2.3M.',
    severity: 'high',
    category: 'Ransomware',
    source: 'Security Affairs',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    link: 'https://securityaffairs.com',
  },
  {
    id: 'a6',
    title: 'Phishing Campaign Impersonating Microsoft 365 Harvests Credentials at Scale',
    description: 'Large-scale AiTM (Adversary-in-the-Middle) phishing campaign bypasses MFA by intercepting session tokens. Over 10,000 corporate accounts compromised across financial and legal sectors.',
    severity: 'medium',
    category: 'Phishing',
    source: 'TheHackerNews',
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    link: 'https://thehackernews.com',
  },
  {
    id: 'a7',
    title: 'Lazarus Group Deploys New macOS Backdoor via Fake Job Offer PDFs',
    description: 'North Korean APT Lazarus Group is delivering a novel macOS backdoor targeting cryptocurrency and fintech employees through LinkedIn job offers. The malware establishes persistence via LaunchAgent.',
    severity: 'high',
    category: 'APT',
    source: 'Cisco Talos',
    publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    link: 'https://blog.talosintelligence.com',
  },
  {
    id: 'a8',
    title: 'SANS Internet Stormcast: Port 22 Scanning Spike — Credential Stuffing Wave',
    description: 'SANS Internet Storm Center reports a 340% increase in SSH port 22 scan attempts over the past 48 hours. Correlated with leaked credential database from recent data broker breach.',
    severity: 'medium',
    category: 'Threat Intelligence',
    source: 'SANS ISC',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    link: 'https://isc.sans.edu',
  },
];

const MOCK_CHANNELS: NewsChannel[] = [
  {
    id: 'sans',
    name: 'SANS Institute',
    description: 'Internet Storm Center daily threat briefings and handlers diary.',
    updateLabel: 'LIVE',
    categories: ['Threat Intel', 'Handlers Diary', 'Education'],
    headlines: [
      'Port 22 scanning spike — credential stuffing wave continues',
      'ISC Stormcast: New Golang malware targeting Linux servers',
      'SANS FOR508 updated — DFIR course now covers cloud forensics',
    ],
    color: '#00e5ff',
  },
  {
    id: 'krebs',
    name: 'KrebsOnSecurity',
    description: 'In-depth investigative journalism on cybercrime and security.',
    updateLabel: '1h ago',
    categories: ['Cybercrime', 'Investigation', 'Breaches'],
    headlines: [
      'Identity thieves bypass Experian security to access credit reports',
      'Feds charge man with stealing $65M via SIM swapping',
      'Fake browser updates push Lumma Stealer infostealer',
    ],
    color: '#ff9800',
  },
  {
    id: 'darkreading',
    name: 'Dark Reading',
    description: 'Enterprise security news, analysis, and vulnerability coverage.',
    updateLabel: '23m ago',
    categories: ['Enterprise', 'Vulnerability', 'Analysis'],
    headlines: [
      'Ivanti patches critical auth bypass in Connect Secure VPN',
      'Why the CISO role is becoming impossible to fill',
      'AI-generated phishing attacks are 40% more effective',
    ],
    color: '#7c4dff',
  },
  {
    id: 'secaffairs',
    name: 'Security Affairs',
    description: 'Global security intelligence, APT reports, and ICS/SCADA threats.',
    updateLabel: '42m ago',
    categories: ['APT', 'ICS/SCADA', 'Ransomware'],
    headlines: [
      'MedusaLocker shifts focus to healthcare providers in Q1 2025',
      'China-linked Salt Typhoon found in additional US telcos',
      'New ICS malware targets European water treatment facilities',
    ],
    color: '#ff5722',
  },
  {
    id: 'bleeping',
    name: 'BleepingComputer',
    description: 'Breaking security news, ransomware tracker, and malware analysis.',
    updateLabel: '8m ago',
    categories: ['Ransomware', 'Malware', 'Breaking'],
    headlines: [
      'BlackBasta claims attack on critical infrastructure operator',
      'LockBit 4.0 builder leaked — new variants expected',
      'Windows SmartScreen bypass exploited as zero-day',
    ],
    color: '#ff1744',
  },
  {
    id: 'thhn',
    name: 'TheHackerNews',
    description: 'Trusted source for cybersecurity news for the tech community.',
    updateLabel: '15m ago',
    categories: ['Vulnerabilities', 'Privacy', 'Cloud Security'],
    headlines: [
      'Microsoft 365 AiTM phishing bypasses MFA — 10K accounts hit',
      'Critical flaw in Apache Struts actively exploited in the wild',
      'GitHub Actions poisoning attack targets open-source CI/CD',
    ],
    color: '#2196f3',
  },
  {
    id: 'talos',
    name: 'Cisco Talos',
    description: "World-class threat intelligence from Cisco's research division.",
    updateLabel: '3h ago',
    categories: ['Malware', 'APT', 'Threat Research'],
    headlines: [
      'Lazarus Group deploys new macOS backdoor via fake job PDFs',
      'TinyTurla-NG: New Turla campaign targets European NGOs',
      'Talos discovers novel DNS-over-HTTPS C2 beaconing technique',
    ],
    color: '#00e676',
  },
  {
    id: 'mandiant',
    name: 'Mandiant Intelligence',
    description: 'Google-backed threat intelligence, incident response, and APT tracking.',
    updateLabel: '5h ago',
    categories: ['APT', 'Nation-State', 'Incident Response'],
    headlines: [
      'APT29 resumes spear-phishing targeting EU diplomatic corps',
      'UNC4841 expands Barracuda ESG exploitation to new regions',
      'M-Trends 2025: Dwell time drops to 10 days — detection improving',
    ],
    color: '#ff6d00',
  },
];

const MOCK_PODCASTS: Podcast[] = [
  {
    id: 'dd',
    name: 'Darknet Diaries',
    episodeTitle: 'Ep 163: The Dark Caracal',
    date: 'Mar 11, 2025',
    duration: '1h 08m',
    description: 'Jack Rhysider investigates a nation-state mobile espionage campaign targeting journalists and activists across 21 countries.',
    icon: '🎙️',
  },
  {
    id: 'mm',
    name: 'Malware Monday',
    episodeTitle: 'Lumma Stealer: The New Default',
    date: 'Mar 10, 2025',
    duration: '42m',
    description: 'Malwarebytes researchers break down how Lumma Stealer became the most-deployed infostealer of 2025 via YouTube and fake CAPTCHA sites.',
    icon: '🦠',
  },
  {
    id: 'sn',
    name: 'Security Now',
    episodeTitle: 'Ep 1012: Post-Quantum TLS',
    date: 'Mar 12, 2025',
    duration: '1h 52m',
    description: 'Steve Gibson and Leo Laporte deep-dive into NIST\'s newly standardised post-quantum cryptography algorithms and what enterprises need to do now.',
    icon: '🔐',
  },
  {
    id: 'cw',
    name: 'The CyberWire',
    episodeTitle: 'Daily Briefing — Mar 13, 2025',
    date: 'Mar 13, 2025',
    duration: '21m',
    description: 'Dave Bittner\'s daily intel briefing covers BlackBasta infrastructure operations, EU NIS2 compliance deadlines, and the latest CISA KEV additions.',
    icon: '📻',
  },
  {
    id: 'cc',
    name: 'CISO Craft',
    episodeTitle: 'Building a Threat-Informed Defense',
    date: 'Mar 9, 2025',
    duration: '58m',
    description: 'CISO roundtable discussion on operationalising MITRE ATT&CK, measuring security ROI, and surviving board-level security conversations.',
    icon: '🛡️',
  },
];

const MOCK_TICKER_ITEMS: TickerItem[] = [
  { label: 'CVE-2025-0211', text: 'Critical RCE in Fortinet FortiOS — CVSS 9.8 — patch now', severity: 'critical' },
  { label: 'APT29', text: 'Cozy Bear resumes EU diplomatic phishing campaign — WINELOADER variant', severity: 'high' },
  { label: 'ZERO-DAY', text: 'Windows SmartScreen bypass exploited in the wild — no patch yet', severity: 'critical' },
  { label: 'RANSOMWARE', text: 'BlackBasta claims attack on critical infrastructure operator', severity: 'critical' },
  { label: 'CVE-2025-2299', text: 'Ivanti Connect Secure auth bypass — 30K appliances exposed', severity: 'high' },
  { label: 'APT41', text: 'Winnti-linked group targets semiconductor supply chain in Asia', severity: 'high' },
  { label: 'MALWARE', text: 'Lazarus Group deploys macOS backdoor via fake LinkedIn job PDFs', severity: 'high' },
  { label: 'PHISHING', text: 'AiTM Microsoft 365 campaign bypasses MFA — 10,000+ accounts compromised', severity: 'medium' },
  { label: 'KEV', text: 'CISA adds 3 new vulnerabilities to Known Exploited Vulnerabilities catalog', severity: 'medium' },
  { label: 'BREACH', text: 'Identity thieves bypass Experian security — credit report data exposed', severity: 'medium' },
  { label: 'ICS', text: 'New malware variant targets European water treatment SCADA systems', severity: 'high' },
  { label: 'INTEL', text: 'SANS ISC: SSH port scanning up 340% in past 48 hours', severity: 'low' },
];

// ─── Severity Config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<ThreatSeverity, { label: string; colour: string; bg: string; border: string }> = {
  critical: { label: 'CRITICAL', colour: '#ff1744', bg: 'rgba(255,23,68,0.12)', border: 'rgba(255,23,68,0.35)' },
  high:     { label: 'HIGH',     colour: '#ff5722', bg: 'rgba(255,87,34,0.12)', border: 'rgba(255,87,34,0.35)' },
  medium:   { label: 'MEDIUM',   colour: '#ff9800', bg: 'rgba(255,152,0,0.12)', border: 'rgba(255,152,0,0.35)' },
  low:      { label: 'LOW',      colour: '#ffc107', bg: 'rgba(255,193,7,0.12)', border: 'rgba(255,193,7,0.35)' },
  info:     { label: 'INFO',     colour: '#00bcd4', bg: 'rgba(0,188,212,0.12)', border: 'rgba(0,188,212,0.35)' },
};

const SEV_ORDER: Record<ThreatSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

// ─── Helper ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type Tab = 'news' | 'podcasts' | 'channels' | 'alerts' | 'analysis';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

function NewsHeader({ activeTab, onTabChange, searchQuery, onSearchChange }: HeaderProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'news', label: 'Live News' },
    { id: 'channels', label: 'Channels' },
    { id: 'podcasts', label: 'Podcasts' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'analysis', label: 'Analysis' },
  ];

  const searchPlaceholder =
    activeTab === 'channels' ? 'Search channels...' : 'Search alerts...';

  return (
    <div className="sticky top-0 z-10 bg-cyber-panel border-b border-cyber-border">
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg">🛡️</span>
          <div>
            <div className="text-[11px] font-display font-bold tracking-widest text-accent-cyan uppercase">
              Cyber Intel
            </div>
            <div className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">
              Intelligence Feed
            </div>
          </div>
        </div>

        {/* Live badge */}
        <span className="flex items-center gap-1 bg-threat-critical/15 border border-threat-critical/40 text-threat-critical text-[8px] font-mono font-bold px-2 py-0.5 rounded-sm flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-threat-critical animate-pulse inline-block" />
          LIVE
        </span>

        {/* Tabs */}
        <nav className="flex items-center gap-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-cyber-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Search */}
        <div className="relative flex-shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 text-[10px]">⌕</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-cyber-card border border-cyber-border text-gray-300 text-[10px] font-mono pl-6 pr-3 py-1.5 rounded-sm w-48 focus:outline-none focus:border-accent-cyan/50 placeholder-gray-700"
          />
        </div>

        {/* Settings */}
        <button className="text-gray-600 hover:text-gray-400 transition-colors text-base flex-shrink-0" title="Settings">
          ⚙
        </button>
      </div>
    </div>
  );
}

function FeaturedAlert({ alert }: { alert: NewsAlert }) {
  const cfg = SEVERITY_CONFIG[alert.severity];
  const url = sanitiseUrl(alert.link);

  return (
    <div
      className="rounded border flex flex-col gap-3 p-5 h-full"
      style={{
        background: 'linear-gradient(135deg, #0d1035 0%, #1a0a2e 60%, #0f1420 100%)',
        borderColor: cfg.border,
        boxShadow: `0 0 30px ${cfg.colour}10`,
      }}
    >
      {/* Top badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm"
          style={{ color: cfg.colour, background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          {cfg.label}
        </span>
        <span className="text-[9px] font-mono text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-2 py-0.5 rounded-sm">
          {alert.category}
        </span>
        {alert.cve && (
          <span className="text-[9px] font-mono text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 px-2 py-0.5 rounded-sm">
            {alert.cve}
          </span>
        )}
        <span className="text-[9px] font-mono text-gray-500 ml-auto">{timeAgo(alert.publishedAt)}</span>
      </div>

      {/* Headline */}
      <h2
        className="text-sm font-sans font-semibold leading-snug"
        style={{ color: cfg.colour, textShadow: `0 0 20px ${cfg.colour}40` }}
      >
        {alert.title}
      </h2>

      {/* Description */}
      <p className="text-[11px] font-mono text-gray-400 leading-relaxed flex-1">
        {alert.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-[9px] font-mono text-gray-600">
          Source: <span className="text-gray-400">{alert.source}</span>
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono text-accent-cyan hover:text-white transition-colors border border-accent-cyan/30 hover:border-accent-cyan/60 px-2 py-0.5 rounded-sm"
          >
            Read More →
          </a>
        )}
      </div>
    </div>
  );
}

interface StatBoxProps { value: number | string; label: string; colour: string; icon: string }

function StatBox({ value, label, colour, icon }: StatBoxProps) {
  return (
    <div
      className="bg-cyber-card rounded border p-3 flex flex-col gap-1"
      style={{ borderColor: `${colour}30` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[18px] font-display font-bold" style={{ color: colour }}>
          {value}
        </span>
        <span className="text-base opacity-70">{icon}</span>
      </div>
      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StatsSidebar({ alerts }: { alerts: NewsAlert[] }) {
  const critical = alerts.filter((a) => a.severity === 'critical').length;
  const apts = alerts.filter((a) => a.category === 'APT').length;
  const zeroDays = alerts.filter((a) => a.category === 'Zero-Day').length;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest pb-1 border-b border-cyber-border">
        Today's Intelligence
      </div>
      <StatBox value={alerts.length} label="Total Alerts Today" colour="#00e5ff" icon="📡" />
      <StatBox value={critical} label="Critical Severity" colour="#ff1744" icon="🔴" />
      <StatBox value={apts} label="APT Groups Active" colour="#ff5722" icon="🎯" />
      <StatBox value={zeroDays} label="Zero-Days Detected" colour="#7c4dff" icon="⚡" />
      <div className="mt-auto pt-3 border-t border-cyber-border">
        <div className="text-[8px] font-mono text-gray-700 leading-relaxed">
          Data reflects mock intelligence feed. Connect live APIs for real-time data.
        </div>
      </div>
    </div>
  );
}

interface FilterBarProps {
  threatFilter: ThreatSeverity | 'all';
  onThreatFilter: (f: ThreatSeverity | 'all') => void;
  sortBy: 'date' | 'severity' | 'category';
  onSortBy: (s: 'date' | 'severity' | 'category') => void;
  resultCount: number;
}

function FilterBar({ threatFilter, onThreatFilter, sortBy, onSortBy, resultCount }: FilterBarProps) {
  const levels: (ThreatSeverity | 'all')[] = ['all', 'critical', 'high', 'medium', 'low', 'info'];

  return (
    <div className="flex items-center gap-3 py-3 flex-wrap">
      <span className="text-[9px] font-mono text-gray-600 uppercase tracking-wider flex-shrink-0">Filter:</span>
      <div className="flex gap-1 flex-wrap">
        {levels.map((lvl) => {
          const isActive = threatFilter === lvl;
          const colour = lvl === 'all' ? '#9e9e9e' : SEVERITY_CONFIG[lvl].colour;
          return (
            <button
              key={lvl}
              onClick={() => onThreatFilter(lvl)}
              className="px-2 py-0.5 text-[8px] font-mono uppercase rounded-sm border transition-colors"
              style={{
                color: isActive ? colour : '#555',
                borderColor: isActive ? colour : '#1e2a3a',
                background: isActive ? `${colour}15` : 'transparent',
              }}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-[9px] font-mono text-gray-600">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>
        <span className="text-[9px] font-mono text-gray-600 uppercase tracking-wider">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortBy(e.target.value as 'date' | 'severity' | 'category')}
          className="bg-cyber-card border border-cyber-border text-gray-400 text-[9px] font-mono px-2 py-1 rounded-sm focus:outline-none focus:border-accent-cyan/50"
        >
          <option value="date">Date</option>
          <option value="severity">Severity</option>
          <option value="category">Category</option>
        </select>
      </div>
    </div>
  );
}

function ChannelCard({ channel, expanded, onToggle }: { channel: NewsChannel; expanded: boolean; onToggle: () => void }) {
  return (
    <div
      className="hud-panel cursor-pointer transition-all duration-200 hover:bg-cyber-hover/40"
      style={{ borderColor: expanded ? channel.color : undefined }}
      onClick={onToggle}
    >
      <div className="p-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className="text-[11px] font-sans font-semibold leading-tight"
            style={{ color: channel.color }}
          >
            {channel.name}
          </span>
          <span
            className={`text-[7px] font-mono font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
              channel.updateLabel === 'LIVE'
                ? 'text-threat-critical bg-threat-critical/10 border border-threat-critical/30'
                : 'text-gray-500 bg-cyber-card border border-cyber-border'
            }`}
          >
            {channel.updateLabel === 'LIVE' && (
              <span className="inline-block w-1 h-1 rounded-full bg-threat-critical animate-pulse mr-1" />
            )}
            {channel.updateLabel}
          </span>
        </div>

        <p className="text-[9px] font-mono text-gray-500 leading-snug mb-2">
          {channel.description}
        </p>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1 mb-2">
          {channel.categories.map((cat) => (
            <span
              key={cat}
              className="text-[7px] font-mono px-1.5 py-0.5 rounded-sm border border-cyber-border text-gray-600"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Expand indicator */}
        <div className="text-[8px] font-mono text-gray-700 text-right">
          {expanded ? '▲ hide' : '▼ headlines'}
        </div>
      </div>

      {/* Expanded headlines */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? '160px' : '0px' }}
      >
        <div className="border-t border-cyber-border px-3 py-2 space-y-1.5">
          {channel.headlines.map((headline, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[8px] text-gray-700 flex-shrink-0 mt-0.5">›</span>
              <span className="text-[9px] font-mono text-gray-400 leading-snug">
                {truncate(headline, 80)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChannelsGrid({ expandedChannel, onToggle }: { expandedChannel: string | null; onToggle: (id: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-mono font-semibold text-accent-cyan uppercase tracking-widest">
          📺 Intelligence Channels
        </span>
        <div className="flex-1 h-px bg-cyber-border" />
        <span className="text-[8px] font-mono text-gray-600">{MOCK_CHANNELS.length} sources</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {MOCK_CHANNELS.map((ch) => (
          <ChannelCard
            key={ch.id}
            channel={ch}
            expanded={expandedChannel === ch.id}
            onToggle={() => onToggle(ch.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <div className="hud-panel flex-shrink-0 w-56 p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{podcast.icon}</span>
        <div>
          <div className="text-[10px] font-sans font-semibold text-gray-300">{podcast.name}</div>
          <div className="text-[8px] font-mono text-gray-600">{podcast.date}</div>
        </div>
      </div>
      <div className="text-[9px] font-mono text-accent-cyan leading-snug">
        {truncate(podcast.episodeTitle, 50)}
      </div>
      <p className="text-[8px] font-mono text-gray-500 leading-relaxed flex-1">
        {truncate(podcast.description, 100)}
      </p>
      <div className="flex items-center justify-between pt-1 border-t border-cyber-border">
        <span className="text-[8px] font-mono text-gray-600">⏱ {podcast.duration}</span>
        <button className="text-[8px] font-mono text-accent-cyan hover:text-white border border-accent-cyan/30 hover:border-accent-cyan/60 px-2 py-0.5 rounded-sm transition-colors">
          ▶ Play
        </button>
      </div>
    </div>
  );
}

function PodcastsRow() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-mono font-semibold text-accent-cyan uppercase tracking-widest">
          🎙️ Top Podcasts
        </span>
        <div className="flex-1 h-px bg-cyber-border" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {MOCK_PODCASTS.map((p) => (
          <PodcastCard key={p.id} podcast={p} />
        ))}
      </div>
    </div>
  );
}

function LiveTicker() {
  const doubled = [...MOCK_TICKER_ITEMS, ...MOCK_TICKER_ITEMS];

  return (
    <div className="flex-shrink-0 border-t border-threat-critical/30 bg-[rgba(255,23,68,0.06)] overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-threat-critical/15 border-r border-threat-critical/30">
          <span className="w-1.5 h-1.5 rounded-full bg-threat-critical animate-pulse" />
          <span className="text-[8px] font-mono font-bold text-threat-critical uppercase tracking-widest">
            Alerts
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="flex animate-ticker-scroll whitespace-nowrap"
            style={{ animationDuration: '40s' }}
          >
            {doubled.map((item, i) => {
              const cfg = SEVERITY_CONFIG[item.severity];
              return (
                <span key={i} className="inline-flex items-center gap-2 px-4 py-2">
                  <span
                    className="text-[7px] font-mono font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0"
                    style={{ color: cfg.colour, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    {item.label}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400">{item.text}</span>
                  <span className="text-gray-700 mx-2">·</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="text-center">
        <div className="text-3xl mb-3">🔧</div>
        <div className="text-[11px] font-mono text-gray-500">{label} — coming soon</div>
        <div className="text-[9px] font-mono text-gray-700 mt-1">Connect real APIs to enable this view</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CybersecurityNews() {
  const [activeTab, setActiveTab] = useState<Tab>('news');
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<ThreatSeverity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'category'>('date');
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const filteredAlerts = useMemo(() => {
    let result = MOCK_ALERTS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }

    if (threatFilter !== 'all') {
      result = result.filter((a) => a.severity === threatFilter);
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sortBy === 'severity') return SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
      return a.category.localeCompare(b.category);
    });
  }, [searchQuery, threatFilter, sortBy]);

  const featuredAlert = filteredAlerts[0] ?? MOCK_ALERTS[0];

  function handleChannelToggle(id: string) {
    setExpandedChannel((prev) => (prev === id ? null : id));
  }

  return (
    <div className="bg-cyber-bg min-h-screen flex flex-col font-sans">
      <NewsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 flex flex-col overflow-auto">
        {activeTab === 'news' && (
          <div className="flex-1 flex flex-col p-4 gap-4">
            {/* Featured + Stats */}
            <div className="grid grid-cols-12 gap-4" style={{ minHeight: '220px' }}>
              <div className="col-span-12 lg:col-span-8">
                <FeaturedAlert alert={featuredAlert} />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <StatsSidebar alerts={filteredAlerts} />
              </div>
            </div>

            {/* Filter bar */}
            <FilterBar
              threatFilter={threatFilter}
              onThreatFilter={setThreatFilter}
              sortBy={sortBy}
              onSortBy={setSortBy}
              resultCount={filteredAlerts.length}
            />

            {/* Channels grid */}
            <ChannelsGrid expandedChannel={expandedChannel} onToggle={handleChannelToggle} />

            {/* Podcasts */}
            <PodcastsRow />
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="flex-1 p-4">
            <LiveChannelsPanel searchQuery={searchQuery} showSearchInput={false} />
          </div>
        )}

        {activeTab === 'podcasts' && (
          <div className="flex-1 p-4">
            <PodcastsRow />
          </div>
        )}

        {activeTab === 'alerts' && <ComingSoon label="Alerts" />}
        {activeTab === 'analysis' && <ComingSoon label="Analysis" />}
      </div>

      <LiveTicker />
    </div>
  );
}
