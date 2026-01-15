import { cn } from '../../utils';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'focus-visible:ring-ring focus-visible:ring-offset-background peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      // Unchecked: light gray track with dark border in light mode, dark track with light border in dark mode
      'data-[state=unchecked]:border-zinc-400 data-[state=unchecked]:bg-zinc-200 dark:data-[state=unchecked]:border-zinc-500 dark:data-[state=unchecked]:bg-zinc-700',
      // Checked: primary color with matching border
      'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
      className,
    )}
    {...props}
    ref={ref}>
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full shadow-md ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        // Thumb: white with visible border
        'border-2 border-zinc-300 bg-white dark:border-zinc-400',
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
