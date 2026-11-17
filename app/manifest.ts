import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ECONERA — Construction Intelligence",
    short_name: "ECONERA",
    start_url: "/",
    display: "standalone",
    theme_color: "#0b110e",
    background_color: "#0b110e",
    icons: [192, 512].map((size) => ({ src: `/brand/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png" })),
  };
}
