import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const t = language === 'zh' ? {
    title: 'RM Copilot 话术对练',
    placeholder: '输入您的问题或场景描述...',
    send: '发送',
    suggestions: '推荐问题',
    thinking: '思考中...',
    fallback: '抱歉，服务暂时不可用，请稍后重试。',
  } : {
    title: 'RM Copilot Roleplay',
    placeholder: 'Enter your question or scenario...',
    send: 'Send',
    suggestions: 'Suggestions',
    thinking: 'Thinking...',
    fallback: 'Sorry, service is temporarily unavailable.',
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userContent = input;
    setMessages(prev => [...prev, { role: 'user', content: userContent }]);
    setInput('');
    setIsLoading(true);

    timeoutRef.current = window.setTimeout(async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
        const response = await fetch(`${apiBase}/agents/insight`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ goal: userContent, lang: language }),
        });
        const data = await response.json();
        const aiContent = data?.data || t.fallback;
        setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);
      } catch {
        setMessages(prev => [...prev, { role: 'ai', content: t.fallback }]);
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] p-0 gap-0 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t.title}</h3>
              <p className="text-[11px] text-slate-400">
                {language === 'zh' ? 'AI助手辅助客户经理进行话术对练' : 'AI assistant for RM role-play training'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={msg.role === 'user'
                  ? 'bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]'
                  : 'bg-slate-100 text-slate-800 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%]'
                }>
                  <p className="text-sm">{msg.content}</p>
                </div>
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

        <div className="p-4 border-t border-slate-100 space-y-3">
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
      </DialogContent>
    </Dialog>
  );
}
