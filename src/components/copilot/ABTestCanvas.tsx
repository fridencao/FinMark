import React, { useState } from 'react';
import { Network, X } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ABTestConfig {
  branchA: {
    content: string;
    channel: string;
    conversion: number;
  };
  branchB: {
    content: string;
    channel: string;
    conversion: number;
  };
}

interface ABTestCanvasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ABTestCanvas({ open, onOpenChange }: ABTestCanvasProps) {
  const { language } = useAppStore();
  const [config, setConfig] = useState<ABTestConfig>({
    branchA: { content: '温情关怀文案', channel: 'App Push', conversion: 3.2 },
    branchB: { content: '高收益产品推荐', channel: '短信', conversion: 4.5 }
  });
  const [weight, setWeight] = useState(50);

  const t = language === 'zh' ? {
    title: '策略画布 - A/B 测试配置',
    branchA: '分支 A',
    branchB: '分支 B',
    content: '文案内容',
    channel: '触达渠道',
    expectedConversion: '预期转化率',
    weight: '流量权重',
    traffic分配: '流量分配可视化',
    cancel: '取消',
    save: '保存配置',
  } : {
    title: 'Strategy Canvas - A/B Test Config',
    branchA: 'Branch A',
    branchB: 'Branch B',
    content: 'Content',
    channel: 'Channel',
    expectedConversion: 'Expected Conversion',
    weight: 'Traffic Weight',
    trafficDistribution: 'Traffic Distribution',
    cancel: 'Cancel',
    save: 'Save Config',
  };

  const handleSave = () => {
    console.log('AB Test Config:', { ...config, weight });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Network className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg">{t.title}</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 分支对比 */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-4 space-y-4">
              <h4 className="font-bold text-sm text-center">{t.branchA}</h4>
              
              <div className="space-y-2">
                <Label className="text-xs">{t.content}</Label>
                <Input 
                  value={config.branchA.content}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    branchA: { ...prev.branchA, content: e.target.value }
                  }))}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">{t.channel}</Label>
                <Input 
                  value={config.branchA.channel}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    branchA: { ...prev.branchA, channel: e.target.value }
                  }))}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">{t.expectedConversion}</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    value={config.branchA.conversion}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      branchA: { ...prev.branchA, conversion: parseFloat(e.target.value) }
                    }))}
                    className="text-sm w-20"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h4 className="font-bold text-sm text-center">{t.branchB}</h4>
              
              <div className="space-y-2">
                <Label className="text-xs">{t.content}</Label>
                <Input 
                  value={config.branchB.content}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    branchB: { ...prev.branchB, content: e.target.value }
                  }))}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">{t.channel}</Label>
                <Input 
                  value={config.branchB.channel}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    branchB: { ...prev.branchB, channel: e.target.value }
                  }))}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">{t.expectedConversion}</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    value={config.branchB.conversion}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      branchB: { ...prev.branchB, conversion: parseFloat(e.target.value) }
                    }))}
                    className="text-sm w-20"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
            </Card>
          </div>

          {/* 权重配置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t.weight}</Label>
              <div className="flex items-center gap-4 text-sm">
                <span>A: {weight}%</span>
                <span>B: {100 - weight}%</span>
              </div>
            </div>
            <Slider 
              value={[weight]} 
              onValueChange={(v) => setWeight(v[0])}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* 流量分配可视化 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t.traffic分配}</Label>
            <div className="h-8 rounded-lg overflow-hidden flex bg-slate-100">
              <div 
                className="bg-indigo-500 transition-all duration-300" 
                style={{ width: `${weight}%` }}
              />
              <div 
                className="bg-emerald-500 transition-all duration-300" 
                style={{ width: `${100 - weight}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Branch A</span>
              <span>Branch B</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
            {t.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}