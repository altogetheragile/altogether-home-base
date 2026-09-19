import type { Config } from "tailwindcss";

export default {
	// Dark mode is a class on the page - EXCEPT inside the zoo game, which is a light surface on
	// purpose and stays one in both themes (see `.zoo-theme` in index.css: it is a page on a
	// marketing site, and the park is drawn in daylight).
	//
	// Without this exclusion every `dark:text-*` inside the game lightens its text for a dark ground
	// that never arrives. Measured on the board in dark mode: "Needs Lion Enclosure built first" went
	// from 5.02:1 to 1.67:1, and "Hand it back to the Product Backlog" from 4.84:1 to 1.39:1 - both
	// amber text on a card that is white in both themes. There are about seventy more of them.
	//
	// Said once here rather than stripped from seventy places, and it says the true thing: there is
	// no dark inside the zoo.
	darkMode: ["variant", ["&:where(.dark, .dark *):not(:where(.zoo-theme, .zoo-theme *))"]],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		// Scan the shared design system so its component classes aren't purged.
		"./node_modules/@altogether/ui/dist/**/*.js",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				serif: ['Merriweather', 'Georgia', 'serif'],
				mono: ['ui-monospace', 'monospace'],
				inter: ['Inter', 'sans-serif'],
				roboto: ['Roboto', 'sans-serif'],
				'open-sans': ['Open Sans', 'sans-serif'],
				lato: ['Lato', 'sans-serif'],
				montserrat: ['Montserrat', 'sans-serif'],
				playfair: ['Playfair Display', 'serif'],
				merriweather: ['Merriweather', 'serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				'bmc-orange': {
					DEFAULT: 'hsl(var(--bmc-orange))',
					light: 'hsl(var(--bmc-orange-light))',
					dark: 'hsl(var(--bmc-orange-dark))'
				},
				'bmc-accent': 'hsl(var(--bmc-accent))',
				'bmc-text': 'hsl(var(--bmc-text))',
				'bmc-muted': 'hsl(var(--bmc-muted))',
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			},
			boxShadow: {
				'xs': 'var(--shadow-xs)',
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'card': 'var(--card-shadow)',
				'card-hover': 'var(--card-shadow-hover)',
				'card-focus': 'var(--card-shadow-focus)',
			},
			spacing: {
				'1': 'var(--space-1)',
				'2': 'var(--space-2)',
				'3': 'var(--space-3)',
				'4': 'var(--space-4)',
				'6': 'var(--space-6)',
				'8': 'var(--space-8)',
				'12': 'var(--space-12)',
				'16': 'var(--space-16)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
