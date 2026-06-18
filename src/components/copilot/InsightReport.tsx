import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  AlertTriangle,
  Sparkles,
  List,
  Clock,
  Tag,
  Lightbulb,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightItem {
  label: string;
  value: string;
}

interface InsightSection {
  heading: string;
  items: InsightItem[];
  preamble?: string;
}

/**
 * Parse insight-style markdown into structured sections.
 * Recognizes:
 *   ## heading          — section heading
 *   - **label**: value  — bullet item with bold label and value
 *   - **label**：value  — accepts full-width colon
 */
function parseInsightMarkdown(md: string): InsightSection[] {
  const lines = md.split('\n');
  const sections: InsightSection[] = [];
  let current: InsightSection | null = null;
  const preamble: string[] = [];

  for (const line of lines) {
    const h = line.match(/^#{2,3}\s+(.+)/);
    if (h) {
      if (current) sections.push(current);
      current = { heading: h[1].trim(), items: [] };
      continue;
    }
    if (!current) {
      if (line.trim()) preamble.push(line.trim());
      continue;
    }
    const m = line.match(/^\s*[\*-]?\s*\*\*(.+?)\*\*\s*[:：]\s*(.+)/);
    if (m) {
      current.items.push({ label: m[1].trim(), value: m[2].trim() });
    } else if (line.trim()) {
      // Non-empty unparsed line: append to last item's value (preserves wrapped text)
      if (current.items.length > 0) {
        const last = current.items[current.items.length - 1];
        last.value += '\n' + line.trim();
      } else {
        current.heading && (current.heading += ' ' + line.trim());
      }
    }
  }
  if (current) sections.push(current);

  if (preamble.length > 0) {
    const text = preamble.join('\n').trim();
    if (text) {
      if (sections.length > 0) {
        sections[0].preamble = text;
      } else {
        sections.unshift({ heading: '', items: [], preamble: text });
      }
    }
  }

  return sections.filter((s) => s.items.length > 0 || !!s.preamble);
}

function sectionIcon(heading: string): React.ReactNode {
  const h = heading.toLowerCase();
  if (/客户|客群|洞察|特征|分析|insight|customer|audience/.test(h))
    return <Users className="w-3.5 h-3.5 text-indigo-600" />;
  if (/风险|合规|预警|流失|risk|compliance|warning|churn/.test(h))
    return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
  if (/行动|建议|步骤|策略|action|step|plan|strategy/.test(h))
    return <List className="w-3.5 h-3.5 text-emerald-600" />;
  if (/时机|机会|window|timing|opportunity/.test(h))
    return <Clock className="w-3.5 h-3.5 text-blue-600" />;
  if (/标签|tag/.test(h))
    return <Tag className="w-3.5 h-3.5 text-purple-600" />;
  if (/见解|发现|深度|finding/.test(h))
    return <Lightbulb className="w-3.5 h-3.5 text-amber-500" />;
  return <FileText className="w-3.5 h-3.5 text-slate-400" />;
}

/** Split a value by 第N步 / Step N markers or punctuation, return ordered steps. */
function splitSteps(value: string): string[] {
  const parts = value
    .split(/(?:第[一二三四五六七八九十]+步[,，:：]\s*|Step\s*\d+\s*[:：]\s*|[;；])/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : [];
}

/** Split a value by Chinese/English comma-separated tags, return chips. */
function splitTags(value: string): string[] {
  const parts = value
    .split(/[、,,]\s*/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : [];
}

function ItemRow({ label, value }: InsightItem) {
  // Special rendering for "推荐客户标签" — render as inline chips
  if (/标签/i.test(label)) {
    const chips = splitTags(value);
    if (chips.length > 1) {
      return (
        <div className="py-1.5 first:pt-0 last:pb-0">
          <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md mb-1.5">
            {label}
          </span>
          <div className="flex flex-wrap gap-1">
            {chips.map((chip, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-purple-50/50 border border-purple-100 text-purple-700 text-[10px] rounded-full"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      );
    }
  }

  // Special rendering for "行动建议" — render as ordered steps
  if (/行动|建议|步骤/i.test(label)) {
    const steps = splitSteps(value);
    if (steps.length > 1) {
      return (
        <div className="py-1.5 first:pt-0 last:pb-0">
          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md mb-1.5">
            {label}
          </span>
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-700 leading-relaxed">
                <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="flex-1">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    }
  }

  // Default: label tag + value text
  return (
    <div className="flex gap-2.5 py-1.5 first:pt-0 last:pb-0">
      <span className="shrink-0 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md self-start mt-0.5 whitespace-nowrap">
        {label}
      </span>
      <span className="text-xs text-slate-700 leading-relaxed flex-1 whitespace-pre-wrap">
        {value}
      </span>
    </div>
  );
}

function SectionCard({ section }: { section: InsightSection }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {section.heading && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50/80 to-white border-b border-slate-100">
          {sectionIcon(section.heading)}
          <h4 className="text-xs font-bold text-slate-800">{section.heading}</h4>
        </div>
      )}
      <div className="px-3 py-2 divide-y divide-slate-50">
        {section.preamble && (
          <p className="text-xs text-slate-600 leading-relaxed pb-2 mb-1 border-b border-slate-100">
            {section.preamble}
          </p>
        )}
        {section.items.map((item, i) => (
          <ItemRow key={i} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}

/**
 * Render insight-style markdown as structured visual cards.
 * Falls back to plain text rendering if content doesn't match the expected structure.
 */
export function InsightReport({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const sections = parseInsightMarkdown(content);
  if (sections.length === 0) {
    return (
      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('space-y-2', className)}
    >
      {sections.map((section, i) => (
        <SectionCard key={i} section={section} />
      ))}
    </motion.div>
  );
}

/**
 * Detect whether the content is structured insight-style markdown
 * (has ## headings AND **label**: value bullets).
 */
export function isInsightMarkdown(content: string): boolean {
  return /^#{2,3}\s+.+/m.test(content) && /\*\*[^*]+\*\*\s*[:：]/.test(content);
}