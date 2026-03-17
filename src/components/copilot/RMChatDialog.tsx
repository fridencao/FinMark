import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

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

  const t = language === 'zh' ? {
    title: 'RM Copilot 话术对练',
    placeholder: '输入您的问题或场景描述...',
    send: '发送',
    suggestions: '推荐问题',
  } : {
    title: 'RM Copilot Roleplay',
    placeholder: 'Enter your question or scenario...',
    send: 'Send',
    suggestions: 'Suggestions',
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    // 模拟 AI 响应
    setTimeout(() => {
      const responses = language === 'zh' ? [
        '理解您的需求。针对向客户推荐ESG基金，我建议采用"价值投资+社会责任"的沟通方式。首先强调ESG基金的长期稳健收益，其次突出其对环境和社会贡献的社会价值。',
        '客户抗拒推销是常见问题。建议采用"需求挖掘"而非"产品推荐"的方式开场。例如："王总，您最近有没有关注到市场动向？"先建立对话，再逐步引入产品。',
        '高净值客户挽留关键是情感+专业双重维护。建议：1）定期财富检视服务；2）专属理财顾问1对1沟通；3）定制化资产配置方案；4）增值服务（如高端沙龙、子女教育规划）。',
        '基金定投推广话术要点：1）强调复利效应 - "每月定投3000，20年后可能积累百万"；2）降低门槛 - "每天少喝一杯咖啡的钱"；3）淡化择时 - "无需关注涨跌，自动平摊成本"。',
      ] : [
        'I understand. For promoting ESG funds, I recommend using "value investment + social responsibility" communication. Emphasize long-term stable returns and social value.',
        'Customer resistance is common. Use "need discovery" instead of "product recommendation". Start with "Mr. Wang, have you been following market trends?"',
        'Key for high-net-worth retention: emotion + professional. Regular wealth review, dedicated advisor, customized asset allocation, value-added services.',
        'Key points for fund AIP: 1) compound effect, 2) lower threshold, 3) ignore timing.',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: 'ai', content: randomResponse }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] p-0 gap-0">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t.title}</h3>
              <p className="text-xs text-slate-400">
                {language === 'zh' ? 'AI助手辅助客户经理进行话术对练' : 'AI assistant for RM role-play training'}
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
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
                  <p className="text-sm">{language === 'zh' ? '思考中...' : 'Thinking...'}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

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