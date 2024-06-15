import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'act',
  webDir: 'www',

  plugins: {
    LocalNotifications: {
      iconColor: "#000e76",
    }
  }
};



export default config;
