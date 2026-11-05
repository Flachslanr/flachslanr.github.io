"""Genera los íconos y pantallas de inicio de Estoico (columna arena sobre fondo oscuro).

Uso (desde la raíz del repo, requiere Pillow):  python herramientas/generar_iconos.py .
"""
import sys, os
from PIL import Image, ImageDraw

OUT = sys.argv[1]
BG_TOP, BG_BOT = (28, 31, 40), (17, 19, 24)
FLAT_BG = (18, 20, 26)  # #12141A
SAND = (232, 201, 160)
SS = 4  # supersampling


def gradient(w, h):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        c = tuple(round(BG_TOP[i] + (BG_BOT[i] - BG_TOP[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = c
    return img


def column(draw, cx, cy, s, color=SAND):
    """Columna dórica estilizada. s = altura total en px; centrada en (cx, cy)."""
    u = s / 300.0
    top = cy - 150 * u

    def rect(x0, y0, x1, y1, r):
        draw.rounded_rectangle([cx + x0 * u, top + y0 * u, cx + x1 * u, top + y1 * u], radius=r * u, fill=color)

    rect(-110, 0, 110, 26, 4)          # ábaco
    draw.polygon([(cx - 100 * u, top + 26 * u), (cx + 100 * u, top + 26 * u),
                  (cx + 84 * u, top + 48 * u), (cx - 84 * u, top + 48 * u)], fill=color)  # equino
    for i in range(5):                  # fuste con estrías
        x0 = -76 + i * 32
        rect(x0, 56, x0 + 24, 244, 3)
    rect(-90, 250, 90, 268, 4)          # toro
    rect(-110, 274, 110, 300, 4)        # plinto


def render(size, glyph_ratio, flat=False, rounded=0):
    W = H = size * SS
    img = Image.new("RGB", (W, H), FLAT_BG) if flat else gradient(W, H)
    column(ImageDraw.Draw(img), W / 2, H / 2, H * glyph_ratio)
    img = img.resize((size, size), Image.LANCZOS)
    if rounded:
        mask = Image.new("L", (size * SS, size * SS), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size * SS - 1, size * SS - 1], radius=rounded * SS, fill=255)
        rgba = img.convert("RGBA")
        rgba.putalpha(mask.resize((size, size), Image.LANCZOS))
        return rgba
    return img


def splash(w, h):
    W, H = w * 2, h * 2  # supersampling moderado (imágenes grandes)
    img = Image.new("RGB", (W, H), FLAT_BG)
    column(ImageDraw.Draw(img), W / 2, H * 0.46, min(W, H) * 0.26)
    return img.resize((w, h), Image.LANCZOS)


os.makedirs(OUT, exist_ok=True)
# iOS: opaco y sin esquinas (iOS las redondea). Glifo al 56 %.
render(180, 0.56).save(os.path.join(OUT, "apple-touch-icon.png"), optimize=True)
render(192, 0.56).save(os.path.join(OUT, "icon-192.png"), optimize=True)
render(512, 0.56).save(os.path.join(OUT, "icon-512.png"), optimize=True)
# Maskable: glifo dentro de la zona segura central (40 % del alto)
render(512, 0.40).save(os.path.join(OUT, "icon-maskable-512.png"), optimize=True)
# Favicon: esquinas redondeadas, glifo más grande para que se lea a 16-32 px
fav32 = render(32, 0.70, flat=True, rounded=7)
fav16 = render(16, 0.72, flat=True, rounded=4)
fav32.save(os.path.join(OUT, "favicon.ico"), sizes=[(16, 16), (32, 32)], append_images=[fav16])

SPLASH = [  # (ancho, alto) en px físicos, retrato
    (1320, 2868), (1290, 2796), (1206, 2622), (1179, 2556), (1170, 2532),
    (1284, 2778), (1125, 2436), (828, 1792), (750, 1334)]
sp = os.path.join(OUT, "splash")
os.makedirs(sp, exist_ok=True)
for w, h in SPLASH:
    splash(w, h).save(os.path.join(sp, f"splash-{w}x{h}.png"), optimize=True)
print("ok")
