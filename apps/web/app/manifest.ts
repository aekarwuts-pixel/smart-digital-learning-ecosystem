import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smart Digital Learning Ecosystem",
    short_name: "SDLE",
    description: "ระบบเดียวจบสำหรับครู นักเรียน ผู้ปกครอง และหลักฐาน ว PA",
    start_url: "/",
    display: "standalone",
    background_color: "#eef3f9",
    theme_color: "#1f6feb",
    lang: "th",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  };
}
