import { Lora_400Regular } from '@expo-google-fonts/lora';
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';

/** Loads every font the design system uses. Returns [loaded, error]. */
export function useAppFonts() {
  return useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Lora_400Regular,
  });
}
