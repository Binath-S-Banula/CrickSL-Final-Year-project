import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('cricksl_theme') || 'dark'
  );

  useEffect(() => {
    localStorage.setItem('cricksl_theme', theme);
    // Apply CSS variables to root so every page is affected
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--bg-primary',   '#f1f5f9');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-card',      '#ffffff');
      root.style.setProperty('--border-color', '#e2e8f0');
      root.style.setProperty('--text-primary',  '#0f172a');
      root.style.setProperty('--text-secondary','#475569');
      root.style.setProperty('--text-muted',   '#94a3b8');
      root.setAttribute('data-theme', 'light');
      document.body.style.background = '#f1f5f9';
      document.body.style.color = '#0f172a';
    } else {
      root.style.setProperty('--bg-primary',   '#0f172a');
      root.style.setProperty('--bg-secondary', '#1e293b');
      root.style.setProperty('--bg-card',      '#1e293b');
      root.style.setProperty('--border-color', '#334155');
      root.style.setProperty('--text-primary',  '#e2e8f0');
      root.style.setProperty('--text-secondary','#94a3b8');
      root.style.setProperty('--text-muted',   '#64748b');
      root.setAttribute('data-theme', 'dark');
      document.body.style.background = '#0f172a';
      document.body.style.color = '#e2e8f0';
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
