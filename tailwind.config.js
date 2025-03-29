// tailwind.config.js
module.exports = {
    content: [
      "./App.{js,jsx,ts,tsx}",
      "./src/**/*.{js,jsx,ts,tsx}", // Update path if you're using a src folder
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['GoogleSans-Regular', 'sans-serif'], // ใช้ GoogleSans เป็นฟอนต์หลัก
          bold: ['Kanit-Bold', 'sans-serif'], // ใช้ Kanit-Bold สำหรับข้อความหนา
        },
      },
    },
    plugins: [],
  };
  