import type { Config } from 'tailwindcss';

// Design tokens from the HOLASKEY design brief. Colours resolve to CSS variables
// (RGB channels) so the dark default and the light theme share one set of classes.
const v = (name: string) => `rgb(var(--hk-${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    screens: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      colors: {
        bg: v('bg'), // onyx
        ink: v('ink'), // bone
        ink2: v('ink2'),
        accent: v('accent'), // terracotta
        s0: v('s0'),
        smoke: v('s1'), // product backdrop, form fields
        s2: v('s2'),
        espresso: v('s3'), // raised sections, cards, footer
        s4: v('s4'),
        line: v('line'),
        muted: v('muted'), // ash
        err: v('err'),
        ok: v('ok'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-archivo)', 'Arial Narrow', 'sans-serif'],
        serif: ['var(--font-bodoni)', 'Georgia', 'serif'],
        mono: ['var(--font-plex)', 'ui-monospace', 'monospace'],
      },
      borderRadius: { none: '0', DEFAULT: '0', sm: '2px' },
      maxWidth: { site: '1320px' },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'none' } },
        sign: { from: { clipPath: 'inset(0 100% 0 0)' }, to: { clipPath: 'inset(0 0 0 0)' } },
        load: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(250%)' } },
      },
      animation: {
        rise: 'rise .4s ease-out backwards',
        sign: 'sign 1.2s ease-out .3s backwards',
        load: 'load 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
