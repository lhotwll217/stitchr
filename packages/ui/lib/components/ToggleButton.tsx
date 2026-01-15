import { cn } from '../utils';
import { exampleThemeStorage } from '@extension/storage';
import type { ComponentPropsWithoutRef } from 'react';

type ToggleButtonProps = ComponentPropsWithoutRef<'button'>;

export const ToggleButton = ({ className, children, ...props }: ToggleButtonProps) => (
  <button
    className={cn(
      'bg-secondary text-secondary-foreground border-border hover:bg-muted rounded-full border px-6 py-2 font-bold shadow-sm transition-all active:scale-95',
      className,
    )}
    onClick={exampleThemeStorage.toggle}
    {...props}>
    {children}
  </button>
);
