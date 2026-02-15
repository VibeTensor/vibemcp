"""Generate VMCP geometric logo - Paperdish grid style, 11x11 grid.

Layout: 5x5 cells per letter, 1-cell cross divider = 11x11 grid.
Each letter is clearly readable at this resolution.

     0  1  2  3  4  5  6  7  8  9  10
 0   X  .  .  .  X  .  X  .  .  .  X     V . M
 1   X  .  .  .  X  .  X  X  .  X  X     V . M
 2   .  X  .  X  .  .  X  .  X  .  X     V . M
 3   .  X  .  X  .  .  X  .  .  .  X     V . M
 4   .  .  X  .  .  .  X  .  .  .  X     V . M
 5   .  .  .  .  .  .  .  .  .  .  .     (divider)
 6   X  X  X  X  .  .  X  X  X  X  .     C . P
 7   X  .  .  .  .  .  X  .  .  .  X     C . P
 8   X  .  .  .  .  .  X  X  X  X  .     C . P
 9   X  .  .  .  .  .  X  .  .  .  .     C . P
10   X  X  X  X  .  .  X  .  .  .  .     C . P
"""
import os
from PIL import Image, ImageDraw

U = 180 / 11  # Grid unit = 16.364
SIZE = 512
SCALE = SIZE / 180

BG = (35, 44, 48)       # #232c30
GOLD = (225, 163, 44)   # #e1a32c
WHITE = (255, 255, 255)
TEAL = (14, 165, 233)   # #0ea5e9  (sky-500)
TEAL_HEX = '#0ea5e9'


def r(val):
    return round(val, 3)


def s(val):
    return round(val * SCALE)


# ---- SVG Path Helpers ----

def svg_rect(col, row, w_u, h_u):
    x, y = r(col * U), r(row * U)
    w, h = r(w_u * U), r(h_u * U)
    return f"M{x} {y}h{w}v{h}h-{w}z"

def svg_filled(col, row):
    x, y, w = r(col * U), r(row * U), r(U)
    return f"M{x} {y}h{w}v{w}h-{w}z"

def svg_c_polygon(col, row):
    """C as single polygon: top bar, left stem, bottom bar."""
    x = r(col * U)
    y = r(row * U)
    u1 = r(U)
    u3 = r(3 * U)
    u4 = r(4 * U)
    return (
        f"M{x} {y}"
        f"h{u4}v{u1}h-{u3}v{u3}h{u3}v{u1}h-{u4}z"
    )

def svg_wrap(paths_str, fill="#fff", bg=None):
    bg_rect = f'<rect width="180" height="180" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 180 180">'
        f'{bg_rect}'
        f'<g fill="{fill}" fill-rule="evenodd" clip-path="url(#a)">'
        f'<path d="{paths_str}"/>'
        f'</g>'
        f'<defs><clipPath id="a"><path fill="#fff" d="M0 0h180v180H0z"/></clipPath></defs>'
        f'</svg>'
    )


# ---- PNG Drawing Helpers ----

def px_rect(draw, col, row, w_u, h_u, color):
    x1, y1 = s(col * U), s(row * U)
    x2, y2 = s((col + w_u) * U) - 1, s((row + h_u) * U) - 1
    draw.rectangle([x1, y1, x2, y2], fill=color)

def px_filled(draw, col, row, color):
    px_rect(draw, col, row, 1, 1, color)

def new_canvas():
    return Image.new('RGB', (SIZE, SIZE), BG)


# ================================================================
# VMCP Logo - 5x5 letters in 11x11 grid
# ================================================================
#
# V (5x5):       M (5x5):       C (5x5):       P (5x5):
# X . . . X      X . . . X      X X X X .      X X X X .
# X . . . X      X X . X X      X . . . .      X . . . X
# . X . X .      X . X . X      X . . . .      X X X X .
# . X . X .      X . . . X      X . . . .      X . . . .
# . . X . .      X . . . X      X X X X .      X . . . .


def vmcp_svg():
    return " ".join([
        # --- V (cols 0-4, rows 0-4) ---
        svg_rect(0, 0, 1, 2),      # left arm top
        svg_rect(4, 0, 1, 2),      # right arm top
        svg_rect(1, 2, 1, 2),      # left arm mid
        svg_rect(3, 2, 1, 2),      # right arm mid
        svg_filled(2, 4),           # bottom point

        # --- M (cols 6-10, rows 0-4) ---
        svg_rect(6, 0, 1, 5),      # left vertical
        svg_rect(10, 0, 1, 5),     # right vertical
        svg_filled(7, 1),           # left peak
        svg_filled(9, 1),           # right peak
        svg_filled(8, 2),           # valley point

        # --- C (cols 0-4, rows 6-10) ---
        svg_c_polygon(0, 6),        # bracket polygon

        # --- P (cols 6-10, rows 6-10) ---
        svg_rect(6, 6, 1, 5),      # left stem (full height)
        svg_rect(7, 6, 3, 1),      # top of bowl
        svg_filled(10, 7),          # right side of bowl
        svg_rect(7, 8, 3, 1),      # bottom of bowl
    ])


def vmcp_png(color=GOLD):
    img = new_canvas()
    draw = ImageDraw.Draw(img)

    # V (cols 0-4, rows 0-4)
    px_rect(draw, 0, 0, 1, 2, color)    # left arm top
    px_rect(draw, 4, 0, 1, 2, color)    # right arm top
    px_rect(draw, 1, 2, 1, 2, color)    # left arm mid
    px_rect(draw, 3, 2, 1, 2, color)    # right arm mid
    px_filled(draw, 2, 4, color)         # bottom point

    # M (cols 6-10, rows 0-4)
    px_rect(draw, 6, 0, 1, 5, color)    # left vertical
    px_rect(draw, 10, 0, 1, 5, color)   # right vertical
    px_filled(draw, 7, 1, color)         # left peak
    px_filled(draw, 9, 1, color)         # right peak
    px_filled(draw, 8, 2, color)         # valley point

    # C (cols 0-4, rows 6-10)
    px_rect(draw, 0, 6, 4, 1, color)    # top bar
    px_rect(draw, 0, 7, 1, 3, color)    # left side
    px_rect(draw, 0, 10, 4, 1, color)   # bottom bar

    # P (cols 6-10, rows 6-10)
    px_rect(draw, 6, 6, 1, 5, color)    # left stem
    px_rect(draw, 7, 6, 3, 1, color)    # top of bowl
    px_filled(draw, 10, 7, color)        # right side of bowl
    px_rect(draw, 7, 8, 3, 1, color)    # bottom of bowl

    return img


# ================================================================
# App Icon - square with rounded corners + padding
# ================================================================

def vmcp_icon_svg(bg_color=TEAL_HEX, mark_color='#fff', icon_size=512, corner_r=80):
    """App-icon style: rounded-corner square background with centered VMCP mark.

    The 180-unit lettermark grid is scaled and centered inside a padded area.
    """
    pad = 30  # padding around the lettermark (in 512-space, ~6%)
    inner = icon_size - 2 * pad
    scale = inner / 180
    tx, ty = pad, pad  # translate offset

    paths = vmcp_svg()
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {icon_size} {icon_size}">'
        f'<rect width="{icon_size}" height="{icon_size}" rx="{corner_r}" fill="{bg_color}"/>'
        f'<g transform="translate({tx},{ty}) scale({r(scale)})" fill="{mark_color}" fill-rule="evenodd">'
        f'<path d="{paths}"/>'
        f'</g>'
        f'</svg>'
    )


def vmcp_favicon_svg(bg_color=TEAL_HEX, mark_color='#fff'):
    """Tiny favicon (32x32 viewBox) with rounded corners."""
    scale = 22 / 180  # 22px inner area in 32px icon
    tx, ty = 5, 5     # center the 22px area
    paths = vmcp_svg()
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
        f'<rect width="32" height="32" rx="6" fill="{bg_color}"/>'
        f'<g transform="translate({tx},{ty}) scale({r(scale)})" fill="{mark_color}" fill-rule="evenodd">'
        f'<path d="{paths}"/>'
        f'</g>'
        f'</svg>'
    )


def vmcp_icon_png(bg_color=TEAL, mark_color=WHITE):
    """Render app icon as PNG with rounded corners."""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background
    cr = 80  # corner radius in 512-space
    draw.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=cr, fill=bg_color)

    # Draw VMCP lettermark centered with padding
    pad = 30
    inner_scale = (SIZE - 2 * pad) / 180

    def si(val):
        return round(val * inner_scale) + pad

    def icon_rect(col, row, w_u, h_u, color):
        x1, y1 = si(col * U), si(row * U)
        x2, y2 = si((col + w_u) * U) - 1, si((row + h_u) * U) - 1
        draw.rectangle([x1, y1, x2, y2], fill=color)

    def icon_filled(col, row, color):
        icon_rect(col, row, 1, 1, color)

    c = mark_color

    # V
    icon_rect(0, 0, 1, 2, c); icon_rect(4, 0, 1, 2, c)
    icon_rect(1, 2, 1, 2, c); icon_rect(3, 2, 1, 2, c)
    icon_filled(2, 4, c)

    # M
    icon_rect(6, 0, 1, 5, c); icon_rect(10, 0, 1, 5, c)
    icon_filled(7, 1, c); icon_filled(9, 1, c); icon_filled(8, 2, c)

    # C
    icon_rect(0, 6, 4, 1, c); icon_rect(0, 7, 1, 3, c); icon_rect(0, 10, 4, 1, c)

    # P
    icon_rect(6, 6, 1, 5, c); icon_rect(7, 6, 3, 1, c)
    icon_filled(10, 7, c); icon_rect(7, 8, 3, 1, c)

    return img


# ================================================================
# Generate outputs
# ================================================================
if __name__ == '__main__':
    out_dir = os.path.dirname(os.path.abspath(__file__))
    paths = vmcp_svg()

    # SVG variants
    for variant, fill, bg in [
        ('dark', '#fff', None),
        ('light', '#232c30', None),
        ('gold', '#e1a32c', '#232c30'),
    ]:
        svg = svg_wrap(paths, fill=fill, bg=bg)
        fpath = os.path.join(out_dir, f'vmcp_{variant}.svg')
        with open(fpath, 'w') as f:
            f.write(svg)
        print(f'SVG: vmcp_{variant}.svg')

    # PNG variants
    for variant, color in [('gold', GOLD), ('white', WHITE)]:
        img = vmcp_png(color)
        fpath = os.path.join(out_dir, f'vmcp_{variant}.png')
        img.save(fpath)
        print(f'PNG: vmcp_{variant}.png ({SIZE}x{SIZE})')

    # App icon SVG
    icon_svg = vmcp_icon_svg()
    fpath = os.path.join(out_dir, f'vmcp_icon.svg')
    with open(fpath, 'w') as f:
        f.write(icon_svg)
    print(f'SVG: vmcp_icon.svg (app icon)')

    # Favicon SVG
    fav_svg = vmcp_favicon_svg()
    fpath = os.path.join(out_dir, f'favicon.svg')
    with open(fpath, 'w') as f:
        f.write(fav_svg)
    print(f'SVG: favicon.svg (32x32)')

    # App icon PNG
    icon_img = vmcp_icon_png()
    fpath = os.path.join(out_dir, f'vmcp_icon.png')
    icon_img.save(fpath)
    print(f'PNG: vmcp_icon.png ({SIZE}x{SIZE})')

    print('\nDone! 8 files generated.')
