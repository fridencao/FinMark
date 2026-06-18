import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState, EmptyData, EmptySearch, EmptyPermission, EmptyNotFound } from '@/components/common/EmptyState';

describe('EmptyState Component', () => {
  describe('EmptyState', () => {
    it('should render with title', () => {
      render(<EmptyState title="No Data" />);
      expect(screen.getByText('No Data')).toBeInTheDocument();
    });

    it('should render with description', () => {
      render(<EmptyState title="No Data" description="This is empty" />);
      expect(screen.getByText('This is empty')).toBeInTheDocument();
    });

    it('should render action button when provided', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          title="No Data"
          action={{ label: 'Add New', onClick }}
        />
      );
      expect(screen.getByRole('button', { name: 'Add New' })).toBeInTheDocument();
    });

    it('should call onClick when action button is clicked', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          title="No Data"
          action={{ label: 'Add New', onClick }}
        />
      );
      screen.getByRole('button', { name: 'Add New' }).click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not render action button when not provided', () => {
      render(<EmptyState title="No Data" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render custom className', () => {
      const { container } = render(
        <EmptyState title="No Data" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render emoji icon when iconEmoji is provided', () => {
      render(<EmptyState title="No Data" iconEmoji="📧" />);
      expect(screen.getByText('📧')).toBeInTheDocument();
    });

    it('should render LucideIcon component when provided', () => {
      const MockIcon = () => null;
      MockIcon.displayName = 'MockIcon';
      render(<EmptyState title="No Data" icon={MockIcon as any} />);
    });

    it('should render action button when provided', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          title="No Data"
          action={{ label: 'Add New', onClick }}
        />
      );
      expect(screen.getByRole('button', { name: 'Add New' })).toBeInTheDocument();
    });

    it('should call onClick when action button is clicked', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          title="No Data"
          action={{ label: 'Add New', onClick }}
        />
      );
      screen.getByRole('button', { name: 'Add New' }).click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not render action button when not provided', () => {
      render(<EmptyState title="No Data" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('EmptyData', () => {
    it('should render with default title', () => {
      render(<EmptyData />);
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<EmptyData title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render with default emoji', () => {
      render(<EmptyData />);
      expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('should render action when provided', () => {
      const onClick = vi.fn();
      render(<EmptyData action={{ label: 'Create', onClick }} />);
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });
  });

  describe('EmptySearch', () => {
    it('should render default title', () => {
      render(<EmptySearch />);
      expect(screen.getByText('未找到结果')).toBeInTheDocument();
    });

    it('should render with search term in description', () => {
      render(<EmptySearch searchTerm="test query" />);
      expect(screen.getByText(/test query/)).toBeInTheDocument();
    });

    it('should render clear button when onClear is provided', () => {
      const onClear = vi.fn();
      render(<EmptySearch onClear={onClear} />);
      expect(screen.getByRole('button', { name: '清除搜索' })).toBeInTheDocument();
    });

    it('should call onClear when clear button is clicked', () => {
      const onClear = vi.fn();
      render(<EmptySearch onClear={onClear} />);
      screen.getByRole('button', { name: '清除搜索' }).click();
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyPermission', () => {
    it('should render with default title and description', () => {
      render(<EmptyPermission />);
      expect(screen.getByText('暂无权限')).toBeInTheDocument();
      expect(screen.getByText('您没有权限查看此内容，请联系管理员')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<EmptyPermission title="Access Denied" />);
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should render lock emoji', () => {
      render(<EmptyPermission />);
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });
  });

  describe('EmptyNotFound', () => {
    it('should render with default title', () => {
      render(<EmptyNotFound />);
      expect(screen.getByText('内容不存在')).toBeInTheDocument();
    });

    it('should render with custom title and description', () => {
      render(<EmptyNotFound title="Not Found" description="Page not found" />);
      expect(screen.getByText('Not Found')).toBeInTheDocument();
      expect(screen.getByText('Page not found')).toBeInTheDocument();
    });

    it('should render question emoji', () => {
      render(<EmptyNotFound />);
      expect(screen.getByText('❓')).toBeInTheDocument();
    });
  });
});
