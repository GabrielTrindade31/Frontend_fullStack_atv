import React from 'react';
import GradientBackground from './background/GradientBackground';

function AppHeader() {
  return (
    <header className="w-full bg-gray-900 p-4 shadow-lg relative z-20 flex items-center justify-center h-16">
      <h1 className="text-2xl font-extrabold text-white">
        <img src="/logo.png" alt="Logo" className="inline-block w-13 h-13 mr-2 mb-1" />
        Aplicação
      </h1>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[100vh] min-h-screen">
      <GradientBackground />
      <div className="flex w-full flex-grow items-center justify-center relative z-10 p-4">
        {children}
      </div>
    </div>
  );
}

