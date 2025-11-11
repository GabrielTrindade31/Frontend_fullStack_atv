import type { ReactNode } from 'react';
import GradientBackground from './background/GradientBackground';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      <GradientBackground />
      <div className="flex w-full flex-1 items-center justify-center relative z-20 p-4 min-h-screen">
        {children}
      </div>
    </div>
  );
}

