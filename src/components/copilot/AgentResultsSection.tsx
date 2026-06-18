import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Users, BarChart3, PenTool, AlertTriangle, Zap, BarChart3 as AnalystIcon, Sparkles, Loader2, Clock, Maximize2, Hash, List, Code, Table2, ChevronDown, FileText, Braces } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '@/stores/app';
import { useCopilotStore, type AgentType, type AgentStatus } from '@/stores/copilot';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { translations } from '@/i18n';

/* ---------- Agent Definitions ---------- */

interface AgentState {
  type: AgentType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const AGENTS: AgentState[] = [
  { type: 'insight', label: '洞察智能体', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500', description: '分析客户行为，挖掘潜在金融需求' },
  { type: 'segment', label: '客群智能体', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-emerald-500', description: '精准定义目标客群，实现分层营销' },
  { type: 'content', label: '内容智能体', icon: <PenTool className="w-5 h-5" />, color: 'bg-purple-500', description: '生成个性化营销文案' },
  { type: 'compliance', label: '合规智能体', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-500', description: '审查文案禁语，确保金融合规' },
  { type: 'strategy', label: '策略智能体', icon: <Zap className="w-5 h-5" />, color: 'bg-orange-500', description: '制定多渠道触达路径与预算分配' },
  { type: 'analyst', label: '评估智能体', icon: <AnalystIcon className="w-5 h-5" />, color: 'bg-rose-500', description: '实时监控营销效果，提供ROI分析' },
];

type SortKey = 0 | 1 | 2;

function agentSortKey(status: AgentStatus | undefined): SortKey {
  if (status === 'running') return 0;
  if (status === 'pending') return 1;
  return 2;
}

/* ---------- Small shared components ---------- */

function AgentIcon({ agent, isRunning, isPending }: { agent: AgentState; isRunning: boolean; isPending: boolean }) {
  return (
    <div className="relative shrink-0">
      <div className={cn("p-1.5 rounded-lg text-white transition-all", agent.color, isRunning && "animate-pulse", isPending && "opacity-40")}>
        {agent.icon}
      </div>
      {isRunning && <span className="absolute -inset-1 rounded-lg border-2 border-amber-400 animate-ping opacity-60" />}
    </div>
  );
}

function StatusBadge({ status, t }: { status: AgentStatus; t: typeof translations.zh.agentResults }) {
  if (status === 'running') {
    return (
      <Badge className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />{t.running}
      </Badge>
    );
  }
  if (status === 'pending') {
    return (
      <Badge className="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1">
        <Clock className="w-3 h-3" />{t.pending}
      </Badge>
    );
  }
  return (
    <Badge className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600')}>
      {status === 'failed' ? t.failed : t.completed}
    </Badge>
  );
}

/* ---------- Plain text extractor for card preview ---------- */

/** Strip markdown syntax and return plain text (max ~chars) */
function plainPreview(md: string, maxLen = 150): string {
  // Normalize table rows: strip table syntax for readable preview
  let text = md
    // Remove table separator rows (|---| patterns)
    .replace(/^[\s|]*\|[-:\s|]+\|[-:\s|]*(?:\|[-:\s|]*)*$/gm, '')
    // Remove leading/trailing pipes and collapse inline pipes into " | "
    .replace(/^\|(.*)\|$/gm, '$1')
    // remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // remove inline links: [text](url) → text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // remove image: ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // remove heading markers
    .replace(/^#{1,6}\s+/gm, '')
    // remove bold/italic markers
    .replace(/\*{1,3}/g, '')
    // remove backtick code markers
    .replace(/`{1,3}/g, '')
    // remove horizontal rules
    .replace(/^---+\s*$/gm, '')
    // remove blockquote marker
    .replace(/^>\s+/gm, '')
    // collapse whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

/* ---------- Markdown helpers ---------- */

interface MdSection {
  level: number;
  heading: string;
  content: string;
}

/** Split raw markdown into sections at ## / ### headings */
function splitIntoSections(md: string): MdSection[] {
  const lines = md.split('\n');
  const sections: { heading: string; content: string[]; level: number }[] = [];
  let current: { heading: string; content: string[]; level: number } | null = null;
  let preamble: string[] = [];

  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+)/);
    if (m) {
      if (current) sections.push(current);
      current = { heading: m[2].trim(), content: [], level: m[1].length };
    } else if (current) {
      current.content.push(line);
    } else {
      preamble.push(line);
    }
  }
  if (current) sections.push(current);

  // Attach preamble (content before first heading) to the first section
  if (preamble.length > 0) {
    const full = preamble.join('\n').trim();
    if (full) {
      if (sections.length > 0) {
        sections[0].content = [full, ...sections[0].content];
      } else {
        // No headings at all — wrap everything as one section
        return [{ level: 2, heading: '', content: full }];
      }
    }
  } else if (sections.length === 0 && md.trim()) {
    return [{ level: 2, heading: '', content: md.trim() }];
  }

  // Dedup: skip sections whose heading matches the previous one
  const unique: typeof sections = [];
  for (const s of sections) {
    const last = unique[unique.length - 1];
    if (last && last.heading === s.heading) continue;
    unique.push(s);
  }

  // Content dedup: if consecutive sections have the same first substantive line,
  // they're LLM-generated duplicates under different headings — keep first only.
  const contentDedup: typeof unique = [];
  for (const s of unique) {
    const last = contentDedup[contentDedup.length - 1];
    if (last) {
      const a = last.content.join('\n').replace(/^[\s#*-]*/gm, '').split('\n').filter(Boolean)[0];
      const b = s.content.join('\n').replace(/^[\s#*-]*/gm, '').split('\n').filter(Boolean)[0];
      if (a && b && a.length > 10 && a === b) continue;
    }
    contentDedup.push(s);
  }

  // Cross-section metric dedup: if the same **bold label**: value pair appears
  // in multiple sections, keep the first occurrence and strip from the rest.
  interface LabelVal { label: string; value: string }
  const seenPairs = new Set<string>();
  const crossDedup: typeof contentDedup = [];
  for (const s of contentDedup) {
    const keep: string[] = [];
    for (const line of s.content) {
      const m = line.match(/^\s*[\*-]?\s*\*\*(.+?)\*\*\s*[:：]\s*(.+)/);
      if (m) {
        const key = `${m[1].trim()}|||${m[2].trim()}`;
        if (seenPairs.has(key)) continue; // skip duplicate line
        seenPairs.add(key);
      }
      keep.push(line);
    }
    crossDedup.push({ ...s, content: keep });
  }

  return crossDedup.map(s => ({ level: s.level, heading: s.heading, content: s.content.join('\n').trim() }));
}

/** Extract simple metric pairs: **Label**: value  or - **Label**: value */
function extractMetrics(md: string): { label: string; value: string }[] {
  const results: { label: string; value: string }[] = [];
  const regex = /[\*-]?\s*\*\*(.+?)\*\*\s*[:：]\s*(.+?)(?:\n|$)/g;
  let match;
  while ((match = regex.exec(md)) !== null) {
    const val = match[2].trim().replace(/`/g, '');
    if (val.length < 60) results.push({ label: match[1].trim(), value: val });
  }
  return results.slice(0, 6);
}

/** Lightweight section-type icon */
function sectionIcon(heading: string): React.ReactNode {
  const h = heading.toLowerCase();
  if (/数据|指标|预估|分析|roi|metric|data|analytics/.test(h)) return <Hash className="w-3.5 h-3.5 text-rose-500" />;
  if (/策略|触达|计划|步骤|strategy|plan|step/.test(h)) return <List className="w-3.5 h-3.5 text-orange-500" />;
  if (/文案|内容|话术|content|copy/.test(h)) return <FileText className="w-3.5 h-3.5 text-purple-500" />;
  if (/合规|风险|审查|compliance|risk/.test(h)) return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
  if (/代码|配置|json|code|config/.test(h)) return <Code className="w-3.5 h-3.5 text-blue-500" />;
  if (/表格|table/.test(h)) return <Table2 className="w-3.5 h-3.5 text-emerald-500" />;
  return <FileText className="w-3.5 h-3.5 text-slate-400" />;
}

/* ---------- Markdown renderer with better table/code ---------- */

function MarkdownContent({ content, className, detail }: { content: string; className?: string; detail?: boolean }) {
  return (
    <div className={cn(
      detail ? "text-xs leading-relaxed" : "text-sm leading-relaxed",
      detail
        ? "[&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mb-2 [&_h2]:mt-5 [&_h2:first-child]:mt-0"
        : "[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2:first-child]:mt-0",
      detail
        ? "[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:mb-1.5 [&_h3]:mt-3"
        : "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:mb-2 [&_h3]:mt-4",
      "[&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_p]:text-slate-600",
      "[&_strong]:text-slate-800 [&_strong]:font-semibold",
      "[&_a]:text-indigo-600 [&_a]:underline [&_a]:underline-offset-2",
      "[&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5 [&_li]:text-slate-600",
      "[&_li::marker]:text-slate-300",
      "[&_code:not(pre_*)]:text-pink-600 [&_code:not(pre_*)]:bg-pink-50 [&_code:not(pre_*)]:px-1.5 [&_code:not(pre_*)]:py-0.5 [&_code:not(pre_*)]:rounded-md [&_code:not(pre_*)]:text-[11px] [&_code:not(pre_*)]:font-mono",
      "[&_pre]:bg-slate-900 [&_pre]:text-slate-50 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:text-[12px] [&_pre]:leading-relaxed [&_pre]:font-mono",
      "[&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-xs",
      "[&_th]:bg-slate-50 [&_th]:text-slate-700 [&_th]:font-semibold [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:border-b [&_th]:border-slate-200 [&_th]:text-[11px]",
      "[&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-slate-100 [&_td]:text-slate-600",
      "[&_tr:last-child_td]:border-b-0",
      "[&_tr:nth-child(even)_td]:bg-slate-50/50",
      "[&_blockquote]:border-l-3 [&_blockquote]:border-indigo-200 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:my-3 [&_blockquote]:bg-indigo-50/50 [&_blockquote]:rounded-r-lg [&_blockquote]:text-slate-600 [&_blockquote]:text-xs",
      "[&_hr]:my-4 [&_hr]:border-slate-100",
      className
    )}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

/* ---------- Metrics summary bar ---------- */

function MetricsBar({ metrics }: { metrics: { label: string; value: string }[] }) {
  if (metrics.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-slate-100">
      {metrics.map((m, i) => (
        <div key={i} className="flex items-center gap-1 bg-white border border-slate-100 px-2 py-1 rounded-md text-[11px] shadow-xs">
          <span className="text-slate-400 font-medium">{m.label}</span>
          <span className="font-bold text-slate-800">{m.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Collapsible sections (manual, no library) ---------- */

function CollapsibleSections({ sections }: { sections: MdSection[] }) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setOpenSet(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  if (sections.length === 0) return null;

  return (
    <div className="divide-y divide-slate-100">
      {sections.map((sec, i) => {
        const isOpen = openSet.has(i);
        return (
          <div key={i}>
            {sec.heading ? (
              <>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className={cn(
                    "flex items-center gap-2 w-full py-2.5 px-2 -mx-2 rounded-lg text-xs font-bold text-left transition-colors hover:bg-slate-50",
                    isOpen ? "text-slate-900" : "text-slate-500"
                  )}
                >
                  <span className="shrink-0">{sectionIcon(sec.heading)}</span>
                  <span className="truncate flex-1">{sec.heading}</span>
                  <ChevronDown className={cn(
                    "w-3 h-3 shrink-0 text-slate-300 transition-transform duration-200",
                    isOpen && "rotate-180 text-indigo-400"
                  )} />
                </button>
                {isOpen && (
                  <div className="pb-4 pt-1">
                    <MarkdownContent content={sec.content} detail />
                  </div>
                )}
              </>
            ) : (
              <div className="py-1">
                <MarkdownContent content={sec.content} detail />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Agent detail content (inside Sheet) ---------- */

function AgentDetailContent({ agent, content, t }: { agent: AgentState; content: string; t: typeof translations.zh.agentResults }) {
  const sections = useMemo(() => splitIntoSections(content).filter(s => s.content.length > 0), [content]);
  const metrics = useMemo(() => extractMetrics(content), [content]);
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div>
      <div className={cn("h-0.5 rounded-full mb-3 opacity-60", agent.color)} />
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium"
        >
          <Braces className="w-3 h-3" />
          {showRaw ? t.hideRaw : t.showRaw}
        </button>
      </div>
      {showRaw ? (
        <pre className="text-[10px] font-mono leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap text-slate-600 max-h-[60vh] overflow-y-auto">{content}</pre>
      ) : (
        <>
          <MetricsBar metrics={metrics} />
          {sections.length > 0 ? (
            <CollapsibleSections sections={sections} />
          ) : (
            <MarkdownContent content={content} detail />
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Main component ---------- */

export function AgentResultsSection() {
  const { language } = useAppStore();
  const { agentResults, streamingContent, isOrchestrating } = useCopilotStore();
  const [fullscreenAgent, setFullscreenAgent] = useState<AgentState | null>(null);

  const t = translations[language].agentResults;

  const visibleAgents = AGENTS
    .filter(a => agentResults[a.type]?.status === 'completed' || isOrchestrating)
    .sort((a, b) => {
      const sa = agentSortKey(agentResults[a.type]?.status);
      const sb = agentSortKey(agentResults[b.type]?.status);
      return sa - sb;
    });

  // Sheet content uses ONLY the completed snapshot (no streaming fallback for completed agents)
  const fullscreenResult = fullscreenAgent
    ? (agentResults[fullscreenAgent.type]?.content || streamingContent[fullscreenAgent.type] || '') as string
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900">{t.executionDetails}</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs font-bold">{t.exportPdf}</Button>
          <Button variant="outline" size="sm" className="text-xs font-bold">{t.sharePlan}</Button>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleAgents.map((agent) => {
          const raw = (agentResults[agent.type]?.content || streamingContent[agent.type] || '') as string;
          const status = agentResults[agent.type]?.status || (isOrchestrating ? 'running' : 'completed');
          const isRunning = status === 'running';
          const isPending = status === 'pending';

          return (
            <motion.div
              key={agent.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "bg-white p-4 rounded-2xl border shadow-sm transition-shadow flex flex-col",
                isRunning ? "border-amber-200 shadow-amber-100/50" : "border-slate-100"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <AgentIcon agent={agent} isRunning={isRunning} isPending={isPending} />
                  <span className={cn("font-bold text-sm", isPending && "text-slate-400")}>
                    {agent.label}
                  </span>
                  {isRunning && (
                    <span className="hidden sm:inline-flex text-[10px] text-amber-600 font-medium animate-pulse ml-1">●</span>
                  )}
                </div>
                <StatusBadge status={status} t={t} />
              </div>

              {raw ? (
                <div className="relative flex-1 min-h-0">
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {plainPreview(raw)}
                  </p>
                  {raw.length > 120 && (
                    <button
                      type="button"
                      onClick={() => setFullscreenAgent(agent)}
                      className="mt-1.5 text-[10px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Maximize2 className="w-3 h-3" />
                      {t.expand}
                    </button>
                  )}
                </div>
              ) : isRunning ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 flex-1">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  {t.generating}
                </div>
              ) : (
                <div className="text-xs text-slate-300 italic flex-1">
                  {t.noOutput}
                </div>
              )}

              {(status === 'completed' || status === 'failed') && raw && (
                <div className="pt-2 mt-2 border-t border-slate-50 flex justify-between items-center shrink-0">
                  <Button variant="ghost" size="sm" className="text-[10px] font-bold text-indigo-600 hover:underline h-auto px-0">
                    {t.viewMetrics} →
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[10px] font-bold text-slate-400 hover:text-slate-600 h-auto px-0">
                    {t.regenerate}
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Reasoning trace */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h5 className="text-sm font-bold text-slate-900">{t.reasoningTrace}</h5>
          <span className="text-[10px] text-slate-400 font-normal">{t.traceDesc}</span>
        </div>

        <div className="space-y-3">
          {AGENTS.filter(a => agentResults[a.type]?.status === 'completed' || isOrchestrating).map((agent, idx) => {
            const status = agentResults[agent.type]?.status;
            const isCurrent = status === 'running';
            return (
              <div key={agent.type} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold transition-all", agent.color, isCurrent && "ring-2 ring-amber-400 ring-offset-1 animate-pulse")}>
                    {idx + 1}
                  </div>
                  {idx < visibleAgents.length - 1 && (
                    <div className={cn("w-0.5 flex-1 my-1", status === 'completed' ? "bg-emerald-200" : "bg-slate-100")} />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-bold", isCurrent ? "text-amber-700" : "text-slate-800")}>
                      {agent.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />{t.processing}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 bg-white border border-slate-100 p-3 rounded-xl shadow-sm group-hover:border-indigo-100 transition-colors">
                    {language === 'zh'
                      ? `基于"推广新发基金"的上下文，执行了${agent.description}，并输出了核心逻辑。`
                      : `Based on the context of "promoting new fund", executed ${agent.description} and outputted core logic.`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right-side sheet with structured content */}
      <Sheet open={!!fullscreenAgent} onOpenChange={(open) => { if (!open) setFullscreenAgent(null); }}>
        <SheetContent>
          <SheetHeader>
            {fullscreenAgent && (
              <SheetTitle className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg text-white", fullscreenAgent.color)}>
                  {fullscreenAgent.icon}
                </div>
                {fullscreenAgent.label}
              </SheetTitle>
            )}
          </SheetHeader>
          <SheetBody>
            {fullscreenAgent && fullscreenResult && (
              <AgentDetailContent agent={fullscreenAgent} content={fullscreenResult} t={t} />
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}