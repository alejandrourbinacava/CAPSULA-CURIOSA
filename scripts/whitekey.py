# whitekey.py <in.png> <out.png>: fondo blanco -> transparente (relleno desde los bordes) para los doodles generados en ai33.pro
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
im = Image.open(sys.argv[1]).convert("RGB"); w, h = im.size
mark = (255, 0, 255); m = im.copy()
for pt in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
    p = m.getpixel(pt)
    if p != mark and min(p) >= 225:
        ImageDraw.floodfill(m, pt, mark, thresh=26)
bg = ImageChops.difference(m, Image.new("RGB", (w, h), mark)).convert("L").point(lambda v: 255 if v == 0 else 0)  # 255 = fondo
bg = bg.filter(ImageFilter.MaxFilter(3))  # come 1px de borde blanquecino
alpha = bg.point(lambda v: 0 if v else 255).filter(ImageFilter.GaussianBlur(0.6))
out = im.convert("RGBA"); out.putalpha(alpha); out.save(sys.argv[2])
