import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-purple': '#A855F7',
        'neon-cyan': '#06B6D4',
        'bg-base': '#0A0A1E',
        'bg-card': '#0F0F2A',
        'bg-elevated': '#161632',
        'border-neon': 'rgba(168, 85, 247, 0.2)',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted': '#4B5563',
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, #A855F7 0%, #06B6D4 100%)',
        'neon-gradient-subtle': 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(6,182,212,0.15) 100%)',
      },
      boxShadow: {
        'neon-purple': '0 0 24px rgba(168, 85, 247, 0.45)',
        'neon-cyan': '0 0 24px rgba(6, 182, 212, 0.45)',
        'neon-sm': '0 0 12px rgba(168, 85, 247, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}
export default config
