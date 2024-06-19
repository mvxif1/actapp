import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Orden de servicio',
  webDir: 'www',

  plugins: {
    LocalNotifications: {
      iconColor: "#000e76",
    }
  }
};



export default config;
