import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

/** Status bar + splash — no-op on web. */
export async function initCapacitorShell() {
  if (!isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#8B0000' });
  } catch {
    // StatusBar plugin unavailable on some simulators
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Splash may already be hidden
  }
}
