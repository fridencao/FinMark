import React, { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InsightReport, isInsightMarkdown } from './InsightReport';
import api from '@/services/api';
import { translations } from '@/i18n';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface RMChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultMessages: Message[] = [
  { role: 'ai', content: '您好！我是RM Copilot，您的营销话术助手。请问有什么可以帮您？' },
];

const suggestions = (language: 'zh' | 'en') => language === 'zh' ? [
  '我想向客户推荐ESG基金，但不太会沟通',
  '客户抗拒理财产品的推销',
  '如何挽留即将流失的高净值客户',
  '基金定投推广话术怎么写',
] : [
  'I want to promote ESG funds but need help',
  'Customer is resistant to product pitches',
  'How to retain high-net-worth customers',
  'Help me write fund AIP pitch',
];

export function RMChatDialog({ open, onOpenChange }: RMChatDialogProps) {
  const { language } = useAppStore();
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[language].rmChat;

  const handleSend = async () => {
    if (!input.trim()) return;

    const userContent = input;
    setMessages(prev => [...prev, { role: 'user', content: userContent }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/agents/insight', { goal: userContent, lang: language }) as {
        success: boolean;
        data?: { content?: string };
      };
      const aiContent = response?.data?.content || t.fallback;
      setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: t.fallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <SheetTitle>{t.title}</SheetTitle>
              <p className="text-[11px] text-slate-400">
                {t.subtitle}
              </p>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="p-0">
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  {msg.role === 'user' ? (
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : isInsightMarkdown(msg.content) ? (
                    <InsightReport content={msg.content} className="max-w-[95%]" />
                  ) : (
                    <div className="bg-slate-100 text-slate-800 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%]">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-2xl rounded-tl-sm">
                    <p className="text-sm">{t.thinking}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetBody>

        <div className="px-4 py-4 border-t border-slate-100 space-y-3 shrink-0">
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">{t.suggestions}:</span>
            {suggestions(language).slice(0, 2).map((s, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-6"
                onClick={() => setInput(s)}
              >
                {s.length > 20 ? s.substring(0, 20) + '...' : s}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.placeholder}
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}