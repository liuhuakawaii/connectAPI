/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      zIndex: {
        '500': 500,
        '1000': 1000,
        '5000': 5000,
      },
      colors: {
        'tag-purple': '#E0D9EF',
        'theme-color': "#4A00E0",
        'theme-gray': "#373737"
      },
      screens: {
        'xs': "1024px",
        'sm': '1280px',
        'md': '1400px',
        'lg': '1600px',
        'xl': '1920px',
        '2xl': '2560px',
        '3xl': '3200px',
      },

      fontFamily: {
        "primary": "['Helvetica_Neue',_Helvetica,_Arial,_Roboto,_ui-sans-serif,_-apple-system,_system-ui,_BlinkMacSystemFont,_sans-serif]"
      },
      fontSize: {
        'xxs': '0.625rem',
        'xs': '0.75rem',
        'sm': '0.875rem',
        'md': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '4rem',
        '7xl': '5rem',
        '8xl': '6rem',
        '9xl': '7rem',
        '10xl': '8rem',
        '11xl': '9rem',
        '12xl': '10rem',
        '13xl': '11rem',
        '14xl': '12rem',
        '15xl': '13rem',
      },
      lineHeight: {
        'xxs': '0.625rem',
        'xs': '0.75rem',
        'sm': '0.875rem',
        'md': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '4rem',
        '7xl': '5rem',
        '8xl': '6rem',
        '9xl': '7rem',
        '10xl': '8rem',
        '11xl': '9rem',
        '12xl': '10rem',
        '13xl': '11rem',
        '14xl': '12rem',
        '15xl': '13rem',
      }
    },
  },
  plugins: [
  ],
}

