import { useEffect, useRef } from "react";

export function useMatrixRain(isMatrixMode: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isMatrixMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const characters =
      "ï½¦ï½§ï½¨ï½©ï½ªï½«ï½¬ï½­ï½®ï½¯ï½°ï½±ï½²ï½³ï½´ï½µï½¶ï½·ï½¸ï½¹ï½ºï½»ï½¼ï½½ï½¾ï½¿ï¾€ï¾ï¾‚ï¾ƒï¾„ï¾…ï¾†ï¾‡ï¾ˆï¾‰ï¾Šï¾‹ï¾Œï¾ï¾Žï¾ï¾ï¾‘ï¾’ï¾“ï¾”ï¾•ï¾–ï¾—ï¾˜ï¾™ï¾šï¾›ï¾œï¾1234567890THEMATRIX";
    const fontSize = 16;
    const columns = Math.floor(width / fontSize) + 1;
    const drops = Array(columns)
      .fill(0)
      .map(() => Math.floor(Math.random() * -30));

    let animationId: number;
    let lastTime = 0;
    const frameInterval = 1000 / 15;

    const draw = (timestamp: number) => {
      animationId = requestAnimationFrame(draw);
      const elapsed = timestamp - lastTime;
      if (elapsed < frameInterval) return;
      lastTime = timestamp - (elapsed % frameInterval);

      context.fillStyle = "rgba(0, 0, 0, 0.05)";
      context.fillRect(0, 0, width, height);
      context.font = `${fontSize}px monospace`;

      for (let index = 0; index < drops.length; index++) {
        const character =
          characters[Math.floor(Math.random() * characters.length)];
        const x = index * fontSize;
        const y = drops[index] * fontSize;

        if (y >= 0) {
          context.fillStyle = "rgba(255, 255, 255, 0.9)";
          context.fillText(character, x, y);
          context.fillStyle = "#00ff41";
          context.fillText(character, x, y - fontSize);
          context.fillStyle = "#008f11";
          context.fillText(character, x, y - fontSize * 2);
        }

        if (y > height && Math.random() > 0.975) {
          drops[index] = 0;
        } else {
          drops[index]++;
        }
      }
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMatrixMode]);

  return canvasRef;
}
