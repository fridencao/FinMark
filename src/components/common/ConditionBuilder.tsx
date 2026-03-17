import React, { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
  unit?: string;
  duration?: string;
}

interface ConditionBuilderProps {
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
  fields: { value: string; label: string }[];
  className?: string;
}

const operators = [
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: 'in', label: '包含' },
  { value: 'not_in', label: '不包含' },
];

export function ConditionBuilder({ conditions, onChange, fields, className }: ConditionBuilderProps) {
  const addCondition = () => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      field: fields[0]?.value || '',
      operator: '=',
      value: '',
    };
    onChange([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    onChange(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    onChange(conditions.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {conditions.map((condition, index) => (
        <div key={condition.id} className="flex items-center gap-2">
          {index > 0 && (
            <Badge variant="outline" className="shrink-0">
              且
            </Badge>
          )}
          <Select
            value={condition.field}
            onValueChange={(value) => updateCondition(condition.id, { field: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择字段" />
            </SelectTrigger>
            <SelectContent>
              {fields.map(field => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={condition.operator}
            onValueChange={(value) => updateCondition(condition.id, { operator: value })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map(op => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={condition.value}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            placeholder="输入值"
            className="flex-1"
          />

          {condition.unit && (
            <Badge variant="secondary">{condition.unit}</Badge>
          )}

          {condition.duration && (
            <Input
              value={condition.duration}
              onChange={(e) => updateCondition(condition.id, { duration: e.target.value })}
              placeholder="时间范围"
              className="w-24"
            />
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeCondition(condition.id)}
            className="text-slate-400 hover:text-rose-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addCondition}
        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
      >
        <Plus className="w-4 h-4 mr-1" />
        添加条件
      </Button>
    </div>
  );
}

interface ConditionPreviewProps {
  conditions: Condition[];
  className?: string;
}

export function ConditionPreview({ conditions, className }: ConditionPreviewProps) {
  if (conditions.length === 0) {
    return (
      <div className={cn('text-sm text-slate-400 italic', className)}>
        暂无筛选条件
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {conditions.map((condition, index) => (
        <React.Fragment key={condition.id}>
          {index > 0 && <span className="text-slate-400">且</span>}
          <Badge variant="outline" className="bg-white">
            {condition.field} {condition.operator} {condition.value}
            {condition.unit && <span className="text-slate-400 ml-1">{condition.unit}</span>}
            {condition.duration && <span className="text-slate-400 ml-1">{condition.duration}</span>}
          </Badge>
        </React.Fragment>
      ))}
    </div>
  );
}

export default ConditionBuilder;
