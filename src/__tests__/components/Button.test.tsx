import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  describe('rendering', () => {
    it('should render with default variant', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button', { name: 'Default Button' });
      expect(button).toBeInTheDocument();
    });

    it('should render with different variants', () => {
      const variants = [
        'default',
        'outline',
        'secondary',
        'ghost',
        'destructive',
        'link',
      ] as const;

      variants.forEach((variant) => {
        const { container } = render(
          <Button variant={variant}>Button {variant}</Button>
        );
        expect(container.firstChild).toBeInTheDocument();
      });
    });

    it('should render with different sizes', () => {
      const sizes = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const;

      sizes.forEach((size) => {
        const { container } = render(
          <Button size={size}>Button {size}</Button>
        );
        expect(container.firstChild).toBeInTheDocument();
      });
    });

    it('should render children', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should render disabled button', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button', { name: 'Disabled Button' });
      expect(button).toBeDisabled();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Button className="custom-class">Custom</Button>
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
