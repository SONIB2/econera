import Image from "next/image";
import Link from "next/link";

export function BrandArtwork({ dark = false, className }: { dark?: boolean; className?: string }) {
  return <Image src={dark ? "/brand/logo-dark.svg" : "/brand/logo-light.svg"} width={481} height={66} alt="" className={className} />;
}

export function Brand({ label = "ECONERA, kryefaqja", href = "/" }: { label?: string; href?: string }) {
  return <Link className="brand" href={href} aria-label={label}><BrandArtwork /></Link>;
}
