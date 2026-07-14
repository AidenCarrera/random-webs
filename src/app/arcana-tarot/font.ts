import localFont from "next/font/local";

export const cinzel = localFont({
  src: [
    {
      path: "../../../public/fonts/cinzel-decorative-400-latin.woff2",
      weight: "400",
    },
    {
      path: "../../../public/fonts/cinzel-decorative-700-latin.woff2",
      weight: "700",
    },
    {
      path: "../../../public/fonts/cinzel-decorative-900-latin.woff2",
      weight: "900",
    },
  ],
  display: "swap",
});
