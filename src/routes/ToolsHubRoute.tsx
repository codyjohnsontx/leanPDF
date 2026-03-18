import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, Scissors, RotateCw, Image,
  Hash, Type, AlignLeft, Eraser, WrapText,
  ArrowDownAZ, Repeat, Link as LinkIcon, BarChart2,
} from 'lucide-react';
import { TOOLS, type ToolCategory } from '../features/tools/toolRegistry';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const ICON_MAP: Record<string, React.ReactNode> = {
  Layers: <Layers size={26} />,
  Scissors: <Scissors size={26} />,
  RotateCw: <RotateCw size={26} />,
  Image: <Image size={26} />,
  Hash: <Hash size={26} />,
  Type: <Type size={26} />,
  AlignLeft: <AlignLeft size={26} />,
  Eraser: <Eraser size={26} />,
  WrapText: <WrapText size={26} />,
  ArrowDownAZ: <ArrowDownAZ size={26} />,
  Repeat: <Repeat size={26} />,
  Link: <LinkIcon size={26} />,
  BarChart2: <BarChart2 size={26} />,
};

type FilterTab = 'all' | ToolCategory;

const TABS: Array<{ id: FilterTab; label: string }> = [
  { id: 'all', label: 'All Tools' },
  { id: 'pdf', label: 'PDF Tools' },
  { id: 'text', label: 'Text Tools' },
];

export function ToolsHubRoute() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const filtered = useMemo(() =>
    activeTab === 'all' ? TOOLS : TOOLS.filter((t) => t.category === activeTab),
    [activeTab]
  );

  return (
    <main className="landing-shell">
      <div className="landing-backdrop" />
      <div className="page-shell tools-hub-shell">
        <div className="tools-hub-hero">
          <h1 className="tools-hub-title">Free Browser-Based Tools.</h1>
          <p className="landing-copy">Fast, private, and local — no installation, no uploads, no watermarks.</p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as FilterTab)}
          className="tools-hub-tabs"
        >
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="tool-card-grid">
          {filtered.map((tool) => (
            <Link key={tool.id} to={tool.href} className="tool-card">
              <div className="tool-card-icon">{ICON_MAP[tool.icon]}</div>
              <strong className="tool-card-title">{tool.title}</strong>
              <p className="helper-copy tool-card-desc">{tool.description}</p>
              <span className="chip-button tool-card-cta">Open tool</span>
            </Link>
          ))}
        </div>

        <div className="tools-hub-pdf-cta">
          <p className="helper-copy">Need the full PDF editor with annotations and signatures?</p>
          <Button asChild variant="ghost">
            <Link to="/open">Open PDF workspace →</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
