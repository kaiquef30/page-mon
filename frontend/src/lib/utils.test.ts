import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    describe('basic functionality', () => {
      it('should merge single className', () => {
        const result = cn('text-red-500');
        expect(result).toBe('text-red-500');
      });

      it('should merge multiple classNames', () => {
        const result = cn('text-red-500', 'bg-blue-500', 'p-4');
        expect(result).toBe('text-red-500 bg-blue-500 p-4');
      });

      it('should handle empty input', () => {
        const result = cn();
        expect(result).toBe('');
      });

      it('should handle undefined values', () => {
        const result = cn('text-red-500', undefined, 'bg-blue-500');
        expect(result).toBe('text-red-500 bg-blue-500');
      });

      it('should handle null values', () => {
        const result = cn('text-red-500', null, 'bg-blue-500');
        expect(result).toBe('text-red-500 bg-blue-500');
      });

      it('should handle false values', () => {
        const result = cn('text-red-500', false, 'bg-blue-500');
        expect(result).toBe('text-red-500 bg-blue-500');
      });

      it('should handle empty strings', () => {
        const result = cn('text-red-500', '', 'bg-blue-500');
        expect(result).toBe('text-red-500 bg-blue-500');
      });
    });

    describe('conditional classNames', () => {
      it('should handle conditional classNames with boolean', () => {
        const isActive = true;
        const result = cn('base-class', isActive && 'active-class');
        expect(result).toBe('base-class active-class');
      });

      it('should skip false conditional classNames', () => {
        const isActive = false;
        const result = cn('base-class', isActive && 'active-class');
        expect(result).toBe('base-class');
      });

      it('should handle multiple conditionals', () => {
        const isActive = true;
        const isDisabled = false;
        const result = cn(
          'base-class',
          isActive && 'active-class',
          isDisabled && 'disabled-class'
        );
        expect(result).toBe('base-class active-class');
      });

      it('should handle ternary operator', () => {
        const isActive = true;
        const result = cn('base-class', isActive ? 'active-class' : 'inactive-class');
        expect(result).toBe('base-class active-class');
      });
    });

    describe('Tailwind CSS conflict resolution', () => {
      it('should resolve conflicting padding classes', () => {
        const result = cn('p-4', 'p-8');
        expect(result).toBe('p-8');
      });

      it('should resolve conflicting margin classes', () => {
        const result = cn('m-2', 'm-4');
        expect(result).toBe('m-4');
      });

      it('should resolve conflicting text color classes', () => {
        const result = cn('text-red-500', 'text-blue-500');
        expect(result).toBe('text-blue-500');
      });

      it('should resolve conflicting background color classes', () => {
        const result = cn('bg-red-500', 'bg-blue-500');
        expect(result).toBe('bg-blue-500');
      });

      it('should resolve conflicting display classes', () => {
        const result = cn('block', 'flex');
        expect(result).toBe('flex');
      });

      it('should resolve conflicting position classes', () => {
        const result = cn('absolute', 'relative');
        expect(result).toBe('relative');
      });

      it('should keep non-conflicting classes', () => {
        const result = cn('p-4', 'text-red-500', 'p-8', 'bg-blue-500');
        expect(result).toBe('text-red-500 p-8 bg-blue-500');
      });

      it('should handle complex Tailwind utility combinations', () => {
        const result = cn(
          'rounded-lg',
          'p-4',
          'text-sm',
          'font-medium',
          'text-gray-500',
          'hover:text-gray-700',
          'p-6',
          'text-base'
        );
        expect(result).toBe('rounded-lg font-medium text-gray-500 hover:text-gray-700 p-6 text-base');
      });
    });

    describe('object syntax', () => {
      it('should handle object with boolean values', () => {
        const result = cn({
          'text-red-500': true,
          'bg-blue-500': false,
          'p-4': true,
        });
        expect(result).toBe('text-red-500 p-4');
      });

      it('should combine strings and objects', () => {
        const result = cn('base-class', {
          'active-class': true,
          'disabled-class': false,
        });
        expect(result).toBe('base-class active-class');
      });

      it('should handle multiple objects', () => {
        const result = cn(
          { 'text-red-500': true },
          { 'bg-blue-500': true },
          { 'p-4': false }
        );
        expect(result).toBe('text-red-500 bg-blue-500');
      });

      it('should handle empty objects', () => {
        const result = cn('text-red-500', {}, 'bg-blue-500');
        expect(result).toBe('text-red-500 bg-blue-500');
      });
    });

    describe('array syntax', () => {
      it('should handle array of classNames', () => {
        const result = cn(['text-red-500', 'bg-blue-500']);
        expect(result).toBe('text-red-500 bg-blue-500');
      });

      it('should combine arrays with strings', () => {
        const result = cn('base-class', ['text-red-500', 'bg-blue-500']);
        expect(result).toBe('base-class text-red-500 bg-blue-500');
      });

      it('should handle nested arrays', () => {
        const result = cn(['text-red-500', ['bg-blue-500', 'p-4']]);
        expect(result).toBe('text-red-500 bg-blue-500 p-4');
      });

      it('should handle arrays with conditionals', () => {
        const isActive = true;
        const result = cn(['base-class', isActive && 'active-class']);
        expect(result).toBe('base-class active-class');
      });

      it('should handle empty arrays', () => {
        const result = cn('text-red-500', [], 'bg-blue-500');
        expect(result).toBe('text-red-500 bg-blue-500');
      });
    });

    describe('complex combinations', () => {
      it('should handle mix of strings, objects, and arrays', () => {
        const result = cn(
          'base-class',
          ['text-red-500', 'bg-blue-500'],
          { 'p-4': true, 'm-4': false },
          'hover:bg-blue-700'
        );
        expect(result).toBe('base-class text-red-500 bg-blue-500 p-4 hover:bg-blue-700');
      });

      it('should handle deeply nested structures', () => {
        const result = cn(
          'base',
          [
            'level1',
            ['level2', { 'level3': true }],
            false && 'conditional',
          ],
          { 'object-class': true }
        );
        expect(result).toBe('base level1 level2 level3 object-class');
      });

      it('should resolve conflicts in complex structures', () => {
        const result = cn(
          'p-4',
          ['text-red-500', 'text-blue-500'],
          { 'p-8': true },
          'text-green-500'
        );
        expect(result).toBe('p-8 text-green-500');
      });
    });

    describe('whitespace handling', () => {
      it('should trim whitespace from classNames', () => {
        const result = cn('  text-red-500  ', '  bg-blue-500  ');
        expect(result).toBe('text-red-500 bg-blue-500');
      });

      it('should handle multiple spaces between classes', () => {
        const result = cn('text-red-500    bg-blue-500');
        expect(result).toBe('text-red-500 bg-blue-500');
      });

      it('should handle newlines and tabs', () => {
        const result = cn('text-red-500\n\tbg-blue-500');
        expect(result).toBe('text-red-500 bg-blue-500');
      });
    });

    describe('special characters', () => {
      it('should handle classes with special characters', () => {
        const result = cn('hover:text-red-500', 'focus:bg-blue-500');
        expect(result).toBe('hover:text-red-500 focus:bg-blue-500');
      });

      it('should handle responsive prefixes', () => {
        const result = cn('sm:text-lg', 'md:text-xl', 'lg:text-2xl');
        expect(result).toBe('sm:text-lg md:text-xl lg:text-2xl');
      });

      it('should handle dark mode classes', () => {
        const result = cn('text-gray-900', 'dark:text-gray-100');
        expect(result).toBe('text-gray-900 dark:text-gray-100');
      });

      it('should handle arbitrary values', () => {
        const result = cn('text-[#ff0000]', 'p-[20px]');
        expect(result).toBe('text-[#ff0000] p-[20px]');
      });

      it('should handle group and peer modifiers', () => {
        const result = cn('group-hover:text-red-500', 'peer-checked:bg-blue-500');
        expect(result).toBe('group-hover:text-red-500 peer-checked:bg-blue-500');
      });
    });

    describe('edge cases', () => {
      it('should handle very long className strings', () => {
        const longClassName = Array.from({ length: 100 }, (_, i) => `class-${i}`).join(' ');
        const result = cn(longClassName);
        expect(result).toBe(longClassName);
      });

      it('should handle many arguments', () => {
        const args = Array.from({ length: 50 }, (_, i) => `class-${i}`);
        const result = cn(...args);
        expect(result).toBe(args.join(' '));
      });

      it('should handle duplicate classes', () => {
        const result = cn('text-red-500', 'text-red-500', 'text-red-500');
        expect(result).toBe('text-red-500');
      });

      it('should handle classes with numbers', () => {
        const result = cn('z-10', 'z-20', 'opacity-50', 'opacity-100');
        expect(result).toBe('z-20 opacity-100');
      });

      it('should preserve order for non-conflicting classes', () => {
        const result = cn('z-10', 'text-red-500', 'bg-blue-500', 'p-4');
        expect(result).toBe('z-10 text-red-500 bg-blue-500 p-4');
      });
    });

    describe('real-world usage patterns', () => {
      it('should handle button component classes', () => {
        const variant = 'primary';
        const size = 'lg';
        const disabled = false;

        const result = cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          {
            'opacity-50 cursor-not-allowed': disabled,
          }
        );

        expect(result).toContain('bg-blue-600');
        expect(result).toContain('h-12');
        expect(result).not.toContain('opacity-50');
      });

      it('should handle card component classes', () => {
        const isHovered = true;
        const isSelected = false;

        const result = cn(
          'rounded-lg border bg-white shadow-sm',
          'transition-all duration-200',
          {
            'border-gray-200': !isSelected,
            'border-blue-500 ring-2 ring-blue-200': isSelected,
          },
          isHovered && 'shadow-md scale-105'
        );

        expect(result).toContain('shadow-md');
        expect(result).toContain('scale-105');
        expect(result).toContain('border-gray-200');
        expect(result).not.toContain('border-blue-500');
      });

      it('should handle form input classes', () => {
        const hasError = true;
        const isDisabled = false;

        const result = cn(
          'w-full px-3 py-2 border rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          {
            'border-gray-300 focus:border-blue-500 focus:ring-blue-500': !hasError,
            'border-red-500 focus:border-red-500 focus:ring-red-500': hasError,
            'bg-gray-100 cursor-not-allowed': isDisabled,
          }
        );

        expect(result).toContain('border-red-500');
        expect(result).not.toContain('border-gray-300');
        expect(result).not.toContain('bg-gray-100');
      });

      it('should handle responsive layout classes', () => {
        const result = cn(
          'grid gap-4',
          'grid-cols-1',
          'sm:grid-cols-2',
          'md:grid-cols-3',
          'lg:grid-cols-4',
          'xl:grid-cols-5'
        );

        expect(result).toBe('grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5');
      });

      it('should handle animation classes', () => {
        const isLoading = true;

        const result = cn(
          'transition-all duration-300 ease-in-out',
          isLoading && 'animate-pulse',
          !isLoading && 'animate-none'
        );

        expect(result).toContain('animate-pulse');
        expect(result).not.toContain('animate-none');
      });
    });

    describe('performance considerations', () => {
      it('should handle rapid successive calls', () => {
        const results = [];
        for (let i = 0; i < 1000; i++) {
          results.push(cn('text-red-500', 'bg-blue-500'));
        }
        expect(results.every(r => r === 'text-red-500 bg-blue-500')).toBe(true);
      });

      it('should handle complex conditional logic efficiently', () => {
        const conditions = Array.from({ length: 20 }, (_, i) => i % 2 === 0);
        const result = cn(
          'base',
          ...conditions.map((c, i) => c && `class-${i}`)
        );
        expect(result).toContain('base');
      });
    });

    describe('type safety', () => {
      it('should accept string literals', () => {
        const result = cn('text-red-500');
        expect(typeof result).toBe('string');
      });

      it('should accept template literals', () => {
        const color = 'red';
        const result = cn(`text-${color}-500`);
        expect(result).toBe('text-red-500');
      });

      it('should accept computed classNames', () => {
        const getClassName = () => 'dynamic-class';
        const result = cn(getClassName());
        expect(result).toBe('dynamic-class');
      });
    });

    describe('integration scenarios', () => {
      it('should work with component props spreading', () => {
        const baseClasses = 'text-base font-normal';
        const additionalClasses = 'text-red-500 font-bold';

        const result = cn(baseClasses, additionalClasses);
        expect(result).toBe('text-base text-red-500 font-bold');
      });

      it('should work with className prop override pattern', () => {
        const defaultClasses = 'p-4 bg-gray-100';
        const userClasses = 'p-8 bg-blue-100';

        const result = cn(defaultClasses, userClasses);
        expect(result).toBe('p-8 bg-blue-100');
      });

      it('should work with variants and slots pattern', () => {
        const base = 'flex items-center';
        const variants = {
          size: {
            sm: 'text-sm gap-1',
            md: 'text-base gap-2',
            lg: 'text-lg gap-3',
          },
          color: {
            primary: 'text-blue-600',
            secondary: 'text-gray-600',
          },
        };

        const size = 'lg';
        const color = 'primary';

        const result = cn(base, variants.size[size], variants.color[color]);
        expect(result).toBe('flex items-center text-lg gap-3 text-blue-600');
      });
    });
  });
});
