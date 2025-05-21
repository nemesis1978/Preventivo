// frontend/src/components/ui/ThemeToggle.tsx
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null to avoid hydration mismatch
    return <div style={{ width: '24px', height: '24px' }} />; // Placeholder for SSR
  }

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme('light')}
        aria-label="Switch to light theme"
        className={theme === 'light' ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme('dark')}
        aria-label="Switch to dark theme"
        className={theme === 'dark' ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme('system')}
        aria-label="Switch to system theme"
        className={theme === 'system' ? 'bg-gray-200 dark:bg-gray-700' : ''}
      >
        <Laptop className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    </div>
  );
}