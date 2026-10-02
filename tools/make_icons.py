"""Tegner app-ikonerne til PWA'en (synkende skib på mørk baggrund) i spillets farver.
Kør fra saenk-skibet/:  py tools/make_icons.py   ->  icons/*.png"""
import math, os
from PIL import Image, ImageDraw, ImageFilter

BG_TOP, BG_BOT = (19, 32, 44), (12, 21, 30)
SEA_TOP, SEA_BOT = (61, 154, 214), (14, 52, 86)
ACCENT = (255, 178, 31)
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'icons')

def vgrad(w, h, a, b):
    im = Image.new('RGB', (w, h)); px = im.load()
    for y in range(h):
        t = y / (h - 1); c = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
        for x in range(w): px[x, y] = c
    return im

def icon(size, scale=1.0):
    S = 1024                                   # tegnes stort og skaleres ned (blød kant)
    im = vgrad(S, S, BG_TOP, BG_BOT).convert('RGBA')
    k = scale; cx, cy = S / 2, S / 2
    P = lambda x, y: (cx + (x - 512) * k, cy + (y - 512) * k)

    # skibet tegnes vandret på sit eget lag og drejes, så stævnen peger op af vandet
    ship = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(ship)
    hull = [(250, 520), (800, 520), (740, 640), (300, 640)]
    d.polygon(hull, fill=(32, 44, 60))
    d.polygon([(268, 585), (770, 585), (740, 640), (300, 640)], fill=(196, 58, 40))   # bundmaling
    d.rectangle([250, 506, 800, 520], fill=(236, 236, 230))                            # ræling
    d.rectangle([330, 420, 520, 506], fill=(240, 240, 234))                            # overbygning
    for i in range(5): d.rectangle([348 + i * 34, 444, 368 + i * 34, 464], fill=(60, 92, 124))
    d.rectangle([380, 330, 450, 420], fill=ACCENT); d.rectangle([380, 330, 450, 350], fill=(30, 30, 30))  # skorsten
    d.rectangle([600, 300, 612, 506], fill=(200, 190, 60))                             # mast
    ship = ship.rotate(24, resample=Image.BICUBIC, center=(512, 520))
    ks = k * 1.35; ship = ship.resize((int(S * ks), int(S * ks)), Image.LANCZOS)
    im.alpha_composite(ship, (int(cx - S * ks / 2) + int(20 * k), int(cy - S * ks / 2) + int(40 * k)))

    # havet over den nederste del af skibet (halvgennemsigtigt, så det sunkne ses svagt)
    sea = Image.new('RGBA', (S, S), (0, 0, 0, 0)); sd = ImageDraw.Draw(sea)
    wl = cy + 80 * k
    top = [(x, wl + math.sin(x / S * math.pi * 6) * 16 * k) for x in range(0, S + 8, 8)]
    sd.polygon(top + [(S, S), (0, S)], fill=(255, 255, 255, 255))
    grad = vgrad(S, S, SEA_TOP, SEA_BOT).convert('RGBA'); grad.putalpha(215)
    im.paste(grad, (0, 0), sea.split()[3].point(lambda v: 215 if v else 0))
    ImageDraw.Draw(im).line(top, fill=(235, 248, 255, 255), width=int(10 * k) or 1)    # skum på vandlinjen
    bd = ImageDraw.Draw(im)
    for bx, by, br in [(430, 690, 16), (470, 760, 11), (400, 820, 8), (520, 720, 9)]:   # bobler
        x, y = P(bx, by + 40); r = br * k
        bd.ellipse([x - r, y - r, x + r, y + r], outline=(220, 240, 255, 230), width=max(2, int(5 * k)))
    return im.convert('RGB').resize((size, size), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
for name, size, scale in [('apple-touch-icon.png', 180, 1.0), ('icon-192.png', 192, 1.0),
                          ('icon-512.png', 512, 1.0), ('icon-512-maskable.png', 512, .78)]:
    icon(size, scale).save(os.path.join(OUT, name)); print('gemt', name)
