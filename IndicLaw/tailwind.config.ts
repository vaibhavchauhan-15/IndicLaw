import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
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
			colors: {
				// Using CSS variables for colors to match our global.css
				primary: {
					DEFAULT: 'var(--primary-color)',
					foreground: 'var(--primary-foreground-color)'
				},
				secondary: {
					DEFAULT: 'var(--secondary-color)',
					foreground: 'var(--secondary-foreground-color)'
				},
				background: 'var(--background-color)',
				foreground: 'var(--foreground-color)',
				card: {
					DEFAULT: 'var(--card-color)',
					foreground: 'var(--card-foreground-color)'
				},
				muted: {
					DEFAULT: 'var(--muted-color)',
					foreground: 'var(--muted-foreground-color)'
				},
				accent: {
					DEFAULT: 'var(--accent-color)',
					foreground: 'var(--accent-foreground-color)'
				},
				border: 'var(--border-color)',
				ring: 'var(--ring-color)',
				input: 'var(--input-color)',
				destructive: {
					DEFAULT: 'var(--destructive-color)',
					foreground: 'var(--destructive-foreground-color)'
				},
				success: {
					DEFAULT: 'var(--success-color)',
					foreground: 'var(--success-foreground-color)'
				},
				warning: {
					DEFAULT: 'var(--warning-color)',
					foreground: 'var(--warning-foreground-color)'
				},
				info: {
					DEFAULT: 'var(--info-color)',
					foreground: 'var(--info-foreground-color)'
				},
				sidebar: {
					DEFAULT: 'var(--sidebar-background-color)',
					foreground: 'var(--sidebar-foreground-color)',
					primary: 'var(--sidebar-primary-color)',
					'primary-foreground': 'var(--sidebar-primary-foreground-color)',
					border: 'var(--sidebar-border-color)'
				}
			},
			borderRadius: {
				lg: 'var(--border-radius)',
				md: 'calc(var(--border-radius) - 2px)',
				sm: 'calc(var(--border-radius) - 4px)'
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
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
