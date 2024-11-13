// theme.ts

// Define the structure of the theme object using TypeScript types
interface ButtonTheme {
    backgroundColor: string;
    color: string;
  }
  
  interface Theme {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    textSecondaryColor: string;
    textDarkColor: string;
    backgroundColor: string;
    button: ButtonTheme;
  }
  
  // Define the light and dark theme structures
  export const theme: { light: Theme; dark: Theme } = {
    light: {
      primaryColor: '#3a5665',   // สีหลัก
      secondaryColor: '#e6edf0', // สีรอง
      textColor: '#3c5867',      // สีข้อความ
      textSecondaryColor: '#9ba7ad',
      textDarkColor: '#263c48',
      backgroundColor: '#f3f7f9', // สีพื้นหลัง
      button: {
        backgroundColor: '#3a5565',
        color: '#fbfcfc',
      },
    },
    dark: {
      primaryColor: '#1abc9c',
      secondaryColor: '#16a085',
      textColor: '#ecf0f1',
      textSecondaryColor: '#ecf0f1',
      textDarkColor: '#ecf0f1',
      backgroundColor: '#2c3e50',
      button: {
        backgroundColor: '#1abc9c',
        color: '#ffffff',
      },
    },
  };
  