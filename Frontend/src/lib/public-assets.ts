import { MENSWEAR } from "@/constants/menswear-assets";

/** Map retired / legacy asset paths onto current menswear cutouts. */
const PUBLIC_ASSET_ALIASES: Record<string, string> = {
  "/assets/images/women.jpg": MENSWEAR.storyPrimary,
  "/assets/images/women.png": MENSWEAR.storyPrimary,
  "/assets/images/aminoAcidGelCleanser.png": MENSWEAR.coatsBlazers,
  "/assets/images/lumieNightCream.png": MENSWEAR.shirts,
  "/assets/images/cocoVelvetBodyPolish.png": MENSWEAR.trousers,
  "/assets/images/pdrnSerum.png": MENSWEAR.shoes,
  "/assets/images/clgnCollagenPeelOffMask.png": MENSWEAR.newArrivals,
  "/assets/images/vitaminCRadianceSerum.png": MENSWEAR.highlights,
  "/assets/images/newArrival.jpg": MENSWEAR.newArrivals,
  "/assets/images/zermaeWordmark.png": "/assets/images/musafir-mark.webp",
  "/assets/images/zermaeWordmarkOnLight.png": "/assets/images/musafir-mark.webp",
  "/assets/images/zermaeCaps.png": "/assets/images/musafir-mark.webp",
  "/assets/images/zermaeCapsOnLight.png": "/assets/images/musafir-mark.webp",
  "/assets/images/saddlera_wordmark.jpg": "/assets/images/musafir-mark.webp",
  "/assets/images/saddlera_caps.jpg": "/assets/images/musafir-mark.webp",
  "/assets/images/western_floral_saddle.png": MENSWEAR.coatsBlazers,
  "/assets/images/western_floral_bridle.png": MENSWEAR.shirts,
  "/assets/images/western_floral_halter.png": MENSWEAR.trousers,
  "/assets/images/western_floral_new_arrivals.png": MENSWEAR.newArrivals,
  "/assets/images/premium_saddle.jpg": MENSWEAR.coatsBlazers,
  "/assets/images/premium_saddle.png": MENSWEAR.coatsBlazers,
  "/assets/images/leather_bridle.jpg": MENSWEAR.shirts,
  "/assets/images/leather_bridle.png": MENSWEAR.shirts,
  "/assets/images/premium_halter.jpg": MENSWEAR.trousers,
  "/assets/images/premium_halter.png": MENSWEAR.trousers,
  "/assets/images/leather_care.jpg": MENSWEAR.faq,
  "/assets/images/leather_care.png": MENSWEAR.faq,
  "/assets/images/saddle_hero.jpg": MENSWEAR.storyPrimary,
  "/assets/images/saddlera_leather_care.png": MENSWEAR.faq,
  "/assets/images/hourse_shoe.png": MENSWEAR.shoes,
  "/assets/images/hero-horse-alpha-poster.webp": MENSWEAR.hero,
  "/assets/images/hero-horse-poster.webp": MENSWEAR.hero,
  "/assets/images/hero-poster.webp": MENSWEAR.hero,
  "/assets/images/hero-poster.png": MENSWEAR.hero,
  "/assets/videos/heroVideo.mp4": "",
  "/assets/videos/hero-horse-720.mp4": "",
  "/assets/videos/hero-horse-480.mp4": "",
  "/assets/videos/hero-horse-alpha-hd.mp4": "",
  "/assets/videos/hero-horse-alpha-sd.mp4": "",
};

export function resolvePublicAssetSrc(src: string): string {
  const trimmed = String(src ?? "").trim();
  if (!trimmed) {
    return trimmed;
  }
  const pathOnly = trimmed.split(/[?#]/)[0] ?? trimmed;
  return PUBLIC_ASSET_ALIASES[pathOnly] ?? PUBLIC_ASSET_ALIASES[trimmed] ?? trimmed;
}
