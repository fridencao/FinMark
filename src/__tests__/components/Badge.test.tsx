import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  describe('rendering', () => {
    it('should render with default variant', () => {
      render(<Badge>Default Badge</Badge>);
      const badge = screen.getByText('Default Badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render with different variants', () => {
      const variants = [
        'default',
        'secondary',
        'destructive',
        'outline',
        'ghost',
        'link',
        'success',
        'warning',
        'error',
        'info',
        'purple',
        'orange',
      ] as const;

      variants.forEach((variant) => {
        const { container } = render(<Badge variant={variant}>Badge {variant}</Badge>);
        expect(container.firstChild).toBeInTheDocument();
      });
    });

    it('should render with children', () => {
      render(<Badge>Test Content</Badge>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('custom props passthrough', () => {
    it('should render with custom className', () => {
      const { container } = render(<Badge className="custom-class">Custom</Badge>);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
