"""Generate pixel art logos for VibeMCP using the avatar color palette."""
from PIL import Image, ImageDraw
import math
import os

# Color palette extracted from avatar (66913595.jpg)
P = {
    'bg_dark': (35, 44, 48),
    'bg_mid': (44, 57, 66),
    'gold': (225, 163, 44),
    'gold_light': (211, 165, 81),
    'gold_dim': (174, 143, 84),
    'orange': (195, 97, 42),
    'brown': (165, 82, 39),
    'brown_dark': (142, 59, 31),
    'brown_shadow': (86, 49, 32),
    'gray': (102, 97, 84),
    'skin': (145, 106, 79),
    'white': (240, 235, 220),
    'black': (20, 25, 28),
}

PIXEL = 8  # Each logical pixel = 8x8 actual pixels
_ = None


def set_pixel(grid, x, y, color):
    if 0 <= x < 32 and 0 <= y < 32:
        grid[y][x] = color


def create_logo(grid, filename, size=32):
    img = Image.new('RGB', (size * PIXEL, size * PIXEL), P['bg_dark'])
    draw = ImageDraw.Draw(img)
    for y, row in enumerate(grid):
        for x, color_key in enumerate(row):
            if color_key and color_key in P:
                draw.rectangle(
                    [x * PIXEL, y * PIXEL, (x + 1) * PIXEL - 1, (y + 1) * PIXEL - 1],
                    fill=P[color_key]
                )
    img_large = img.resize((size * PIXEL * 4, size * PIXEL * 4), Image.NEAREST)
    img.save(filename)
    large_name = filename.replace('.png', '_large.png')
    img_large.save(large_name)
    print(f"  Saved: {filename} ({size * PIXEL}x{size * PIXEL})")
    print(f"  Saved: {large_name} ({size * PIXEL * 4}x{size * PIXEL * 4})")


def logo_v_bold():
    """Logo 1: Bold stylized V with energy glow."""
    g = [[None] * 32 for _ in range(32)]

    # Golden halo background (subtle)
    cx, cy = 16, 14
    for angle in range(360):
        for r in [13, 13.5, 14]:
            x = int(cx + r * math.cos(math.radians(angle)))
            y = int(cy + r * math.sin(math.radians(angle)))
            set_pixel(g, x, y, 'gold_dim')

    # V shape - thick 3px strokes
    for i in range(18):
        # Left arm going down-right
        lx = 5 + i
        ly = 4 + i
        for dx in range(3):
            set_pixel(g, lx + dx, ly, 'gold')
            if i % 3 == 0:
                set_pixel(g, lx + dx, ly, 'orange')

        # Right arm going down-left
        rx = 27 - i - 2
        ry = 4 + i
        for dx in range(3):
            set_pixel(g, rx + dx, ry, 'gold')
            if i % 3 == 0:
                set_pixel(g, rx + dx, ry, 'orange')

    # Bottom point merge
    for dx in range(4):
        set_pixel(g, 14 + dx, 22, 'gold')
        set_pixel(g, 14 + dx, 23, 'orange')
    set_pixel(g, 15, 24, 'gold_light')
    set_pixel(g, 16, 24, 'gold_light')

    # Lightning accent (bottom-left)
    bolt = [(10, 25), (11, 25), (12, 26), (10, 26), (11, 26),
            (11, 27), (12, 27), (10, 28)]
    for bx, by in bolt:
        set_pixel(g, bx, by, 'gold_light')

    return g


def logo_v_circle():
    """Logo 2: V inside golden halo circle (matching avatar style)."""
    g = [[None] * 32 for _ in range(32)]

    cx, cy = 16, 16

    # Outer golden ring
    for angle in range(360):
        for r_off in [12.5, 13, 13.5, 14]:
            x = int(cx + r_off * math.cos(math.radians(angle)))
            y = int(cy + r_off * math.sin(math.radians(angle)))
            set_pixel(g, x, y, 'gold')

    # Inner fill with dark bg
    for y in range(32):
        for x in range(32):
            dx, dy = x - cx, y - cy
            if math.sqrt(dx * dx + dy * dy) < 12 and g[y][x] is None:
                set_pixel(g, x, y, 'bg_mid')

    # V letterform inside circle
    for i in range(14):
        t = i / 13.0
        # Left arm
        lx = int(9 + i * 0.5)
        ly = 7 + i
        color = 'gold' if i % 2 == 0 else 'orange'
        set_pixel(g, lx, ly, color)
        set_pixel(g, lx + 1, ly, color)

        # Right arm
        rx = int(22 - i * 0.5)
        ry = 7 + i
        set_pixel(g, rx, ry, color)
        set_pixel(g, rx - 1, ry, color)

    # Bottom merge
    set_pixel(g, 15, 21, 'gold')
    set_pixel(g, 16, 21, 'gold')
    set_pixel(g, 15, 22, 'gold_light')
    set_pixel(g, 16, 22, 'gold_light')

    # Glow dots around circle
    for angle in range(0, 360, 30):
        x = int(cx + 15 * math.cos(math.radians(angle)))
        y = int(cy + 15 * math.sin(math.radians(angle)))
        set_pixel(g, x, y, 'gold_dim')

    return g


def logo_robot():
    """Logo 3: Robot mascot with headphones (matching avatar style)."""
    g = [[None] * 32 for _ in range(32)]

    # Golden halo behind robot
    cx, cy = 16, 14
    for angle in range(360):
        for r in [13, 13.5, 14, 14.5]:
            x = int(cx + r * math.cos(math.radians(angle)))
            y = int(cy + r * math.sin(math.radians(angle)))
            if 0 <= x < 32 and 0 <= y < 32:
                set_pixel(g, x, y, 'gold_dim')

    # Antenna
    set_pixel(g, 15, 1, 'gold')
    set_pixel(g, 16, 1, 'gold')
    set_pixel(g, 15, 2, 'gold_light')
    set_pixel(g, 16, 2, 'gold_light')

    # Headphone band
    for x in range(9, 23):
        set_pixel(g, x, 3, 'gray')

    # Head (rounded rectangle)
    for x in range(11, 21):
        set_pixel(g, x, 3, 'gold')
        set_pixel(g, x, 15, 'gold')
    for y in range(4, 15):
        set_pixel(g, 10, y, 'gold')
        set_pixel(g, 21, y, 'gold')
    # Fill head
    for x in range(11, 21):
        for y in range(4, 15):
            set_pixel(g, x, y, 'bg_mid')
    # Corners
    set_pixel(g, 10, 3, 'gold')
    set_pixel(g, 21, 3, 'gold')
    set_pixel(g, 10, 15, 'gold')
    set_pixel(g, 21, 15, 'gold')

    # Eyes (glowing golden)
    for x in range(13, 15):
        for y in range(7, 10):
            set_pixel(g, x, y, 'gold')
    for x in range(17, 19):
        for y in range(7, 10):
            set_pixel(g, x, y, 'gold')
    # Pupils
    set_pixel(g, 14, 8, 'white')
    set_pixel(g, 17, 8, 'white')

    # Mouth
    for x in range(13, 19):
        set_pixel(g, x, 12, 'orange')
    set_pixel(g, 13, 11, 'orange')
    set_pixel(g, 18, 11, 'orange')

    # Headphones (like avatar!)
    for y in range(5, 13):
        set_pixel(g, 8, y, 'gray')
        set_pixel(g, 9, y, 'gray')
        set_pixel(g, 22, y, 'gray')
        set_pixel(g, 23, y, 'gray')

    # Body
    for x in range(12, 20):
        set_pixel(g, x, 17, 'gold')
        set_pixel(g, x, 24, 'gold')
    for y in range(17, 25):
        set_pixel(g, 11, y, 'gold')
        set_pixel(g, 20, y, 'gold')
    for x in range(12, 20):
        for y in range(18, 24):
            set_pixel(g, x, y, 'bg_mid')
    # Neck
    set_pixel(g, 15, 16, 'gray')
    set_pixel(g, 16, 16, 'gray')

    # "V" emblem on chest
    set_pixel(g, 14, 19, 'gold')
    set_pixel(g, 17, 19, 'gold')
    set_pixel(g, 14, 20, 'orange')
    set_pixel(g, 17, 20, 'orange')
    set_pixel(g, 15, 21, 'gold')
    set_pixel(g, 16, 21, 'gold')
    set_pixel(g, 15, 22, 'gold_light')
    set_pixel(g, 16, 22, 'gold_light')

    # Arms
    for y in range(18, 24):
        set_pixel(g, 9, y, 'orange')
        set_pixel(g, 10, y, 'orange')
        set_pixel(g, 21, y, 'orange')
        set_pixel(g, 22, y, 'orange')
    # Hands
    set_pixel(g, 8, 23, 'gold')
    set_pixel(g, 9, 24, 'gold')
    set_pixel(g, 23, 23, 'gold')
    set_pixel(g, 22, 24, 'gold')

    # Legs
    for y in range(25, 29):
        set_pixel(g, 13, y, 'gold')
        set_pixel(g, 14, y, 'gold')
        set_pixel(g, 17, y, 'gold')
        set_pixel(g, 18, y, 'gold')
    # Feet
    for x in range(12, 15):
        set_pixel(g, x, 29, 'orange')
    for x in range(17, 20):
        set_pixel(g, x, 29, 'orange')

    return g


if __name__ == '__main__':
    out_dir = os.path.dirname(os.path.abspath(__file__))

    print("Generating VibeMCP logos...")
    print()
    print("Logo 1: Bold V with Lightning")
    create_logo(logo_v_bold(), os.path.join(out_dir, 'logo_v_bolt.png'))
    print()
    print("Logo 2: V in Golden Halo Circle")
    create_logo(logo_v_circle(), os.path.join(out_dir, 'logo_v_circle.png'))
    print()
    print("Logo 3: Robot Mascot (avatar style)")
    create_logo(logo_robot(), os.path.join(out_dir, 'logo_robot.png'))
    print()
    print("Done! All logos saved to:", out_dir)
