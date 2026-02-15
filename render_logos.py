"""Render the 4 geometric V logo designs as PNG using Pillow directly."""
from PIL import Image, ImageDraw
import math
import os

U = 180 / 7  # Grid unit
SIZE = 512
SCALE = SIZE / 180

BG = (35, 44, 48)       # #232c30
GOLD = (225, 163, 44)   # #e1a32c
WHITE = (255, 255, 255)


def s(val):
    """Scale from 180-space to pixel-space."""
    return round(val * SCALE)


def draw_rect(draw, x, y, w, h, color):
    draw.rectangle([s(x), s(y), s(x + w) - 1, s(y + h) - 1], fill=color)


def draw_framed(draw, col, row, color, border_frac=0.3):
    """Draw a framed square (filled with cutout)."""
    x, y = col * U, row * U
    draw_rect(draw, x, y, U, U, color)
    t = U * border_frac
    draw_rect(draw, x + t, y + t, U - 2 * t, U - 2 * t, BG)


def draw_filled(draw, col, row, color):
    draw_rect(draw, col * U, row * U, U, U, color)


def design1(color=GOLD):
    """Geometric V - alternating framed and solid blocks."""
    img = Image.new('RGB', (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(img)

    # Left arm
    draw_framed(draw, 0, 0, color)
    draw_filled(draw, 0, 1, color)
    draw_framed(draw, 1, 2, color)
    draw_filled(draw, 1, 3, color)
    draw_framed(draw, 2, 4, color)
    draw_filled(draw, 2, 5, color)

    # Right arm
    draw_framed(draw, 6, 0, color)
    draw_filled(draw, 6, 1, color)
    draw_framed(draw, 5, 2, color)
    draw_filled(draw, 5, 3, color)
    draw_framed(draw, 4, 4, color)
    draw_filled(draw, 4, 5, color)

    # Bottom point
    draw_filled(draw, 3, 6, color)

    return img


def design2(color=GOLD):
    """V with connector bridges."""
    img = Image.new('RGB', (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(img)

    # Left arm
    draw_framed(draw, 0, 0, color)
    draw_filled(draw, 0, 1, color)
    draw_rect(draw, 1 * U, 1 * U, 0.4 * U, 0.3 * U, color)
    draw_framed(draw, 1, 2, color)
    draw_filled(draw, 1, 3, color)
    draw_framed(draw, 2, 4, color)
    draw_filled(draw, 2, 5, color)

    # Right arm
    draw_framed(draw, 6, 0, color)
    draw_filled(draw, 6, 1, color)
    draw_rect(draw, 5.6 * U, 1 * U, 0.4 * U, 0.3 * U, color)
    draw_framed(draw, 5, 2, color)
    draw_filled(draw, 5, 3, color)
    draw_framed(draw, 4, 4, color)
    draw_filled(draw, 4, 5, color)

    # Bottom center
    draw_rect(draw, 3 * U, 5.5 * U, 1 * U, 1.5 * U, color)
    draw_rect(draw, 2.8 * U, 5 * U, 0.4 * U, 0.5 * U, color)
    draw_rect(draw, 3.8 * U, 5 * U, 0.4 * U, 0.5 * U, color)

    return img


def design3(color=GOLD):
    """Asymmetric V with large framed blocks + L-shape connectors."""
    img = Image.new('RGB', (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(img)

    # Top-left framed block (3x3 units)
    draw_rect(draw, 0, 0, 3 * U, 3 * U, color)
    draw_rect(draw, U, U, U, U, BG)

    # Top-right framed block (3x3 units)
    draw_rect(draw, 4 * U, 0, 3 * U, 3 * U, color)
    draw_rect(draw, 5 * U, U, U, U, BG)

    # Left L-connector
    draw_rect(draw, U, 3 * U, U, 2 * U, color)
    draw_rect(draw, 2 * U, 4 * U, U, U, color)

    # Right L-connector
    draw_rect(draw, 5 * U, 3 * U, U, 3 * U, color)
    draw_rect(draw, 4 * U, 5 * U, U, U, color)

    # Bottom center column
    draw_rect(draw, 3 * U, 5 * U, U, 2 * U, color)

    # Accent squares
    draw_filled(draw, 2, 5, color)
    draw_filled(draw, 4, 5, color)

    return img


def design4(color=GOLD):
    """Minimal V with large 2x2 framed blocks + stepping stones."""
    img = Image.new('RGB', (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(img)

    # Top-left framed block (2x2 units)
    draw_rect(draw, 0, 0, 2 * U, 2 * U, color)
    draw_rect(draw, 0.35 * U, 0.35 * U, 1.3 * U, 1.3 * U, BG)

    # Top-right framed block (2x2 units)
    draw_rect(draw, 5 * U, 0, 2 * U, 2 * U, color)
    draw_rect(draw, 5.35 * U, 0.35 * U, 1.3 * U, 1.3 * U, BG)

    # Left descender
    draw_filled(draw, 1, 2, color)
    draw_filled(draw, 2, 3, color)

    # Right descender
    draw_filled(draw, 5, 2, color)
    draw_filled(draw, 4, 3, color)

    # Bottom center framed block (2x2 units)
    cx = 2.5
    draw_rect(draw, cx * U, 4 * U, 2 * U, 2 * U, color)
    draw_rect(draw, (cx + 0.35) * U, 4.35 * U, 1.3 * U, 1.3 * U, BG)

    # Bottom tail
    draw_filled(draw, 3, 6, color)

    return img


if __name__ == '__main__':
    out_dir = os.path.dirname(os.path.abspath(__file__))

    designs = {
        'design1_grid_v': design1,
        'design2_bridge_v': design2,
        'design3_asymmetric_v': design3,
        'design4_minimal_v': design4,
    }

    for name, func in designs.items():
        img = func(GOLD)
        path = os.path.join(out_dir, f'{name}.png')
        img.save(path)
        print(f'Saved: {name}.png ({SIZE}x{SIZE})')

        # White version too
        img_w = func(WHITE)
        path_w = os.path.join(out_dir, f'{name}_white.png')
        img_w.save(path_w)

    print(f'\nDone! {len(designs) * 2} PNGs saved.')
