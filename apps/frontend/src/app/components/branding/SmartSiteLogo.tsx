/**
 * Logo SmartSite servi depuis `/logo.png` (fichier dans `apps/frontend/public/logo.png`).
 */
export const SMARTSITE_LOGO_SRC = "/logo.png";

type SmartSiteLogoProps = {
  className?: string;
  /** Taille visuelle : sm (auth), md (header), lg (hero) */
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-20 w-auto max-w-[240px]",
  md: "h-14 md:h-16 w-auto max-w-[240px]",
  lg: "h-32 md:h-40 w-auto max-w-[380px]",
};

export function SmartSiteLogo({
  className = "",
  size = "sm",
}: SmartSiteLogoProps) {
  return (
    <img
      src={SMARTSITE_LOGO_SRC}
      alt="SmartSite — Intelligent Construction Platform"
      className={`object-contain ${sizeClasses[size]} ${className}`.trim()}
      width={280}
      height={120}
      decoding="async"
    />
  );
}
