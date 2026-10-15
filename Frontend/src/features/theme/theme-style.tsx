import { type StorefrontTheme, themeToCss } from "@/constants/storefront";

export function ThemeStyle({ theme }: { theme: StorefrontTheme }) {
  return <style dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />;
}
