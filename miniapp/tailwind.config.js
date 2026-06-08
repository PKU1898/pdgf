/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#07C160",
        "primary-light": "#8CE7B8",
        bg: "#F6F6F6",
        card: "#FFFFFF",
        "text-main": "#333333",
        "text-sub": "#999999",
        "border-light": "#ECECEC",
        success: "#07C160",
        error: "#FA5151",
      },
      borderRadius: {
        btn: "8px",
        card: "12px",
        panel: "16px",
      },
      spacing: {
        "page-x": "16px",
        "block-y": "24px",
      },
      fontFamily: {
        mono: ["Menlo", "Monaco", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
