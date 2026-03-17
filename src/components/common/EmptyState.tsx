import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** 图标组件 */
  icon?: LucideIcon;
  /** 图标 emoji（如无 icon 则使用 emoji） */
  iconEmoji?: string;
  /** 标题 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** 操作按钮 */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    icon?: LucideIcon;
  };
  /** 子内容（可以是 Table、List 等） */
  children?: React.ReactNode;
  /** 自定义className */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  iconEmoji,
  title,
  description,
  action,
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {/* Icon */}
      <div className="mb-6">
        {Icon ? (
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Icon className="w-8 h-8 text-slate-400" />
          </div>
        ) : iconEmoji ? (
          <div className="text-6xl">{iconEmoji}</div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-3xl">📭</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      )}

      {/* Action Button */}
      {action && (
        <Button
          variant={action.variant || 'default'}
          onClick={action.onClick}
          className="px-6 py-2.5"
        >
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      )}

      {/* Children */}
      {children && <div className="w-full mt-8">{children}</div>}
    </div>
  );
}

/**
 * 预定义的空状态组件
 */

// 无数据
export function EmptyData({
  title = '暂无数据',
  description = '当前还没有任何数据，点击上方按钮创建新内容',
  action,
}: Omit<EmptyStateProps, 'icon' | 'iconEmoji'> & { title?: string }) {
  return (
    <EmptyState
      iconEmoji="📊"
      title={title}
      description={description}
      action={action}
    />
  );
}

// 无搜索结果
export function EmptySearch({
  searchTerm,
  onClear,
}: {
  searchTerm?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      iconEmoji="🔍"
      title="未找到结果"
      description={
        searchTerm
          ? `没有找到与"${searchTerm}"相关的结果，请尝试其他关键词`
          : '没有找到相关结果'
      }
      action={
        onClear
          ? { label: '清除搜索', onClick: onClear, variant: 'outline' }
          : undefined
      }
    />
  );
}

// 无权限
export function EmptyPermission({
  title = '暂无权限',
  description = '您没有权限查看此内容，请联系管理员',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      iconEmoji="🔒"
      title={title}
      description={description}
    />
  );
}

// 404 Not Found (小尺寸版本，用于页面内局部 404)
export function EmptyNotFound({
  title = '内容不存在',
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      iconEmoji="❓"
      title={title}
      description={description}
    />
  );
}

export default EmptyState;
