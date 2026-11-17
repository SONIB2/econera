import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ECONERA — Construction Intelligence",
    short_name: "ECONERA",
    start_url: "/",
    display: "standalone",
    theme_color: "#101a16",
    background_color: "#101a16",
    icons: [192, 512].map((size) => ({ src: `/brand/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png" })),
  };
}
