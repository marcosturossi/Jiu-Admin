import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly STORAGE_KEY = 'jiu-admin-theme';
  private readonly DEFAULT_THEME: Theme = 'light';

  readonly currentTheme = signal<Theme>(this.DEFAULT_THEME);

  constructor() {
    this.initializeTheme();

    // Apply theme whenever it changes
    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  private initializeTheme(): void {
    const saved = this.getSavedTheme();
    const theme = saved || this.getPreferredTheme();
    this.currentTheme.set(theme);
  }

  private getSavedTheme(): Theme | null {
    if (typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return (saved === 'light' || saved === 'dark') ? saved : null;
  }

  private getPreferredTheme(): Theme {
    if (typeof window === 'undefined') return this.DEFAULT_THEME;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    const html = this.document.documentElement;

    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      html.classList.add('dark-mode');
      html.classList.remove('light-mode');
    } else {
      html.setAttribute('data-theme', 'light');
      html.classList.add('light-mode');
      html.classList.remove('dark-mode');
    }

    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  /**
   * Get ECharts options for current theme
   */
  getChartTheme(): any {
    const isDark = this.currentTheme() === 'dark';
    return {
      color: isDark
        ? ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#06b6d4']
        : ['#2f80ed', '#34c38f', '#f6c343', '#f66d9b', '#8B5CF6', '#06b6d4'],
      backgroundColor: isDark ? '#1a202c' : '#ffffff',
      textStyle: {
        color: isDark ? '#e5e7eb' : '#101434'
      },
      axisLine: {
        lineStyle: {
          color: isDark ? '#374151' : '#e6e9ef'
        }
      },
      splitLine: {
        lineStyle: {
          color: isDark ? '#374151' : '#f1f5f9'
        }
      },
      itemStyle: {
        borderColor: isDark ? '#374151' : '#e9ecef'
      },
      label: {
        color: isDark ? '#e5e7eb' : '#101434'
      },
      legend: {
        textStyle: {
          color: isDark ? '#e5e7eb' : '#101434'
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#252d3d' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e9ecef',
        textStyle: {
          color: isDark ? '#e5e7eb' : '#101434'
        }
      }
    };
  }
}
