/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				lepax: {
					charcoal: '#0b0c10',
					charcoalSoft: '#161720',
					gold: '#f0c674',
					silver: '#dfe3ea',
					rose: '#f7b1c3',
					accent: '#6c5ce7',
				},
			},
			fontFamily: {
				display: ['system-ui', 'ui-sans-serif', 'sans-serif'],
			},
			boxShadow: {
				card: '0 18px 45px rgba(0,0,0,0.35)',
			},
		},
	},
	plugins: [],
};
