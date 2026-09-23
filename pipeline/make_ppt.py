# OceanSight 3D - SIH26067 Presentation Generator
# Run: .venv\Scripts\python.exe pipeline\make_ppt.py

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import copy

# ── Colour palette ──────────────────────────────────────────
NAVY      = RGBColor(0x0D, 0x1B, 0x2A)   # deep navy bg
TEAL      = RGBColor(0x1A, 0x6B, 0x8A)   # ocean teal
CYAN      = RGBColor(0x38, 0xBD, 0xF8)   # bright cyan accent
LTBLUE    = RGBColor(0xE8, 0xF4, 0xFD)   # very light blue bg
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
AMBER     = RGBColor(0xF5, 0x9E, 0x0B)
CORAL     = RGBColor(0xF4, 0x3F, 0x5E)
GREEN     = RGBColor(0x10, 0xB9, 0x81)
DARKTEXT  = RGBColor(0x0D, 0x1B, 0x2A)
MIDGRAY   = RGBColor(0x64, 0x74, 0x8B)
PANEL     = RGBColor(0xD0, 0xE8, 0xF5)   # soft panel fill

W = Inches(13.33)   # widescreen 16:9
H = Inches(7.5)

prs = Presentation()
prs.slide_width  = W
prs.slide_height = H

blank_layout = prs.slide_layouts[6]   # completely blank

# ── Helper utilities ─────────────────────────────────────────

def add_rect(slide, x, y, w, h, fill=None, line=None, line_w=None):
    shape = slide.shapes.add_shape(1, x, y, w, h)   # MSO_SHAPE_TYPE.RECTANGLE
    shape.line.fill.background()
    if fill:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill
    else:
        shape.fill.background()
    if line:
        shape.line.color.rgb = line
        if line_w:
            shape.line.width = line_w
    else:
        shape.line.fill.background()
    return shape

def add_text(slide, text, x, y, w, h,
             size=18, bold=False, color=DARKTEXT,
             align=PP_ALIGN.LEFT, italic=False, wrap=True):
    txb = slide.shapes.add_textbox(x, y, w, h)
    txb.word_wrap = wrap
    tf = txb.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return txb

def add_para(tf, text, size=12, bold=False, color=DARKTEXT,
             align=PP_ALIGN.LEFT, space_before=6, bullet=False):
    p = tf.add_paragraph()
    p.alignment = align
    p.space_before = Pt(space_before)
    if bullet:
        p.text = text
    else:
        run = p.add_run()
        run.text = text
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = color
    if not bullet:
        for run in p.runs:
            run.font.size = Pt(size)
            run.font.bold = bold
            run.font.color.rgb = color
    return p

def add_oval(slide, x, y, w, h, fill):
    shape = slide.shapes.add_shape(9, x, y, w, h)   # oval
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    return shape

# ── SIH Logo badge (drawn with shapes — appears every slide) ──
def add_sih_logo(slide):
    # Badge pill background
    bx, by, bw, bh = Inches(11.8), Inches(0.12), Inches(1.42), Inches(0.45)
    badge = slide.shapes.add_shape(5, bx, by, bw, bh)  # rounded rect
    badge.fill.solid()
    badge.fill.fore_color.rgb = TEAL
    badge.line.fill.background()
    badge.adjustments[0] = 0.5
    # Badge text
    tf = badge.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = "SIH 2024  |  SIH26067"
    r.font.size = Pt(8.5)
    r.font.bold = True
    r.font.color.rgb = WHITE

# ── Ocean decorative corner shapes ───────────────────────────
def add_corner_decor(slide, bottom=True, top_right=True):
    # Top-left dark corner blob
    s1 = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(0.95), Inches(0.85))
    s1.fill.solid(); s1.fill.fore_color.rgb = TEAL; s1.line.fill.background()

    if top_right:
        s2 = slide.shapes.add_shape(1, Inches(12.38), Inches(0), Inches(0.95), Inches(0.85))
        s2.fill.solid(); s2.fill.fore_color.rgb = NAVY; s2.line.fill.background()

    if bottom:
        # Bottom-left wave blob
        s3 = slide.shapes.add_shape(9, Inches(-0.3), Inches(6.3), Inches(2.2), Inches(1.5))
        s3.fill.solid(); s3.fill.fore_color.rgb = TEAL; s3.fill.fore_color.rgb = RGBColor(0x1A,0x6B,0x8A)
        s3.line.fill.background()
        # Bottom-right wave
        s4 = slide.shapes.add_shape(9, Inches(11.5), Inches(6.6), Inches(2.2), Inches(1.2))
        s4.fill.solid(); s4.fill.fore_color.rgb = NAVY; s4.line.fill.background()

def add_fish_dots(slide):
    """Small decorative cyan dot-fish accents"""
    positions = [(1.2,0.25),(2.8,0.18),(9.5,0.22),(11.0,0.3),(0.4,6.8),(3.0,6.9),(10.5,6.7)]
    for fx,fy in positions:
        o = slide.shapes.add_shape(9, Inches(fx), Inches(fy), Inches(0.18), Inches(0.10))
        o.fill.solid(); o.fill.fore_color.rgb = CYAN; o.line.fill.background()

def slide_bg(slide, color=None):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color if color else WHITE

def add_teal_header_bar(slide, title_text, subtitle=None):
    bar = add_rect(slide, Inches(0), Inches(0), W, Inches(1.1), fill=NAVY)
    add_text(slide, title_text,
             Inches(0.3), Inches(0.1), Inches(10), Inches(0.9),
             size=26, bold=True, color=WHITE, align=PP_ALIGN.LEFT)
    if subtitle:
        add_text(slide, subtitle,
                 Inches(0.3), Inches(0.82), Inches(10), Inches(0.35),
                 size=11, bold=False, color=CYAN, align=PP_ALIGN.LEFT)

# ═══════════════════════════════════════════════════════════════
#  SLIDE 1 — TITLE
# ═══════════════════════════════════════════════════════════════
s1 = prs.slides.add_slide(blank_layout)
slide_bg(s1, WHITE)

# Left navy panel
add_rect(s1, Inches(0), Inches(0), Inches(6.4), H, fill=NAVY)

# Top teal accent strip
add_rect(s1, Inches(0), Inches(0), Inches(6.4), Inches(0.18), fill=TEAL)

# Decorative seaweed left panel circles
add_oval(s1, Inches(0.2), Inches(5.8), Inches(0.55), Inches(0.55), TEAL)
add_oval(s1, Inches(0.5), Inches(6.1), Inches(0.35), Inches(0.35), RGBColor(0x38,0xBD,0xF8))

# Right image area rounded rect (simulating arched photo frame)
arch = s1.shapes.add_shape(5, Inches(7.0), Inches(0.35), Inches(5.8), Inches(4.6))
arch.fill.solid(); arch.fill.fore_color.rgb = RGBColor(0x1A,0x5F,0x7A)
arch.line.color.rgb = CYAN; arch.line.width = Pt(2)
arch.adjustments[0] = 0.18

# Circle accent bottom right
c1 = s1.shapes.add_shape(9, Inches(9.2), Inches(4.7), Inches(2.5), Inches(2.5))
c1.fill.solid(); c1.fill.fore_color.rgb = TEAL
c1.line.color.rgb = WHITE; c1.line.width = Pt(1.5)

# Arch label inside
add_text(s1, "🌊  3D Ocean Visualization Engine",
         Inches(7.15), Inches(2.5), Inches(5.5), Inches(0.6),
         size=13, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_text(s1, "Arabian Sea · Bay of Bengal · INCOIS-ROMS",
         Inches(7.15), Inches(3.1), Inches(5.5), Inches(0.45),
         size=10, color=CYAN, align=PP_ALIGN.CENTER)

# Circle label
add_text(s1, "NetCDF → Zarr\nFull 3D Volume\nARGO + In-Situ",
         Inches(9.3), Inches(5.2), Inches(2.3), Inches(1.0),
         size=9, color=WHITE, align=PP_ALIGN.CENTER)

# Fish decorations
add_fish_dots(s1)

# Coral/teal corner blobs on white side
add_oval(s1, Inches(6.5), Inches(0), Inches(1.2), Inches(0.6), RGBColor(0x38,0xBD,0xF8))
add_oval(s1, Inches(11.8), Inches(6.6), Inches(1.5), Inches(0.9), TEAL)

# ── Main left-panel text ──
add_text(s1, "OCEANSIGHT 3D",
         Inches(0.3), Inches(0.8), Inches(5.8), Inches(1.0),
         size=34, bold=True, color=CYAN, align=PP_ALIGN.LEFT)

add_text(s1, "Interactive 3D Ocean Model\nVisualization Platform",
         Inches(0.3), Inches(1.75), Inches(5.8), Inches(1.0),
         size=17, bold=False, color=WHITE, align=PP_ALIGN.LEFT)

# Teal info pill
info = s1.shapes.add_shape(5, Inches(0.28), Inches(2.95), Inches(5.5), Inches(0.42))
info.fill.solid(); info.fill.fore_color.rgb = TEAL
info.line.fill.background(); info.adjustments[0] = 0.5
tf = info.text_frame; tf.word_wrap=False
p=tf.paragraphs[0]; p.alignment=PP_ALIGN.LEFT
r=p.add_run(); r.text="  Smart India Hackathon 2024  ·  Problem ID: SIH26067"
r.font.size=Pt(10.5); r.font.bold=True; r.font.color.rgb=WHITE

# Team info block
add_text(s1, "Team  404 Founders",
         Inches(0.3), Inches(3.55), Inches(5.8), Inches(0.5),
         size=20, bold=True, color=WHITE)
add_text(s1, "Newton School of Technology  ×  S-VYASA University",
         Inches(0.3), Inches(4.1), Inches(5.8), Inches(0.45),
         size=11.5, color=PANEL)
add_text(s1, "Ministry of Earth Sciences (MoES)  ·  INCOIS",
         Inches(0.3), Inches(4.55), Inches(5.8), Inches(0.4),
         size=10.5, color=CYAN)

# Divider line
line_shape = s1.shapes.add_shape(1, Inches(0.3), Inches(5.05), Inches(5.5), Inches(0.03))
line_shape.fill.solid(); line_shape.fill.fore_color.rgb=TEAL; line_shape.line.fill.background()

add_text(s1, "Theme: Research, Innovation & Decision-Making for Maritime Operations",
         Inches(0.3), Inches(5.15), Inches(5.9), Inches(0.55),
         size=9.5, italic=True, color=RGBColor(0xA0,0xC8,0xE0))

# SIH badge
add_sih_logo(s1)


# ═══════════════════════════════════════════════════════════════
#  SLIDE 2 — PROBLEM STATEMENT & PAIN POINTS
# ═══════════════════════════════════════════════════════════════
s2 = prs.slides.add_slide(blank_layout)
slide_bg(s2, WHITE)
add_corner_decor(s2)
add_fish_dots(s2)
add_teal_header_bar(s2, "THE CORE CHALLENGE & PAIN POINT",
                    "SIH26067  ·  Ministry of Earth Sciences / INCOIS")
add_sih_logo(s2)

# Official PS pill
ps_box = s2.shapes.add_shape(5, Inches(0.4), Inches(1.25), Inches(12.5), Inches(0.72))
ps_box.fill.solid(); ps_box.fill.fore_color.rgb = TEAL
ps_box.line.fill.background(); ps_box.adjustments[0]=0.22
tf=ps_box.text_frame; tf.word_wrap=True
p=tf.paragraphs[0]; p.alignment=PP_ALIGN.CENTER
r=p.add_run()
r.text='"Develop a web-based interactive 3D visualization platform that integrates numerical ocean model outputs and in-situ observations."'
r.font.size=Pt(12.5); r.font.bold=True; r.font.italic=True; r.font.color.rgb=WHITE

# 4 pain-point cards
cards = [
    ("📊  Data Rich, Insight Poor",
     TEAL,
     "INCOIS generates terabytes of multi-dimensional ocean model outputs (NetCDF/GRIB). Interpreting raw ocean physics — thermocline gradients, acoustic shadow zones, shear current vectors — demands doctorate-level scientific expertise."),
    ("🚢  High-Stakes, Time-Critical Users",
     RGBColor(0x0E,0x56,0x7A),
     "Coast Guard commanders, naval captains, submarine navigators, and ROV/AUV operators depend on this data for life-or-death decisions — safe passage, sonar concealment, deep-sea missions — every single day."),
    ("⚙️  The Manual Bottleneck",
     RGBColor(0x17,0x52,0x76),
     "Scientists manually open Panoply/Ncview, slice depth layers, draft static PDF reports, email across disconnected agencies, and spend hours on clarification calls explaining findings to operators who need immediate answers."),
    ("⏱️  Too Little, Too Late",
     RGBColor(0x1A,0x53,0x74),
     "Decision-makers receive static 2D snapshots hours too late, rather than intuitive, real-time, interactive 3D operational situational awareness at their fingertips."),
]

card_x = [Inches(0.25), Inches(3.52), Inches(6.79), Inches(10.06)]
for i,(title, col, body) in enumerate(cards):
    cx = card_x[i]
    # Card bg
    c = s2.shapes.add_shape(5, cx, Inches(2.15), Inches(3.1), Inches(4.85))
    c.fill.solid(); c.fill.fore_color.rgb=col
    c.line.color.rgb=CYAN; c.line.width=Pt(1); c.adjustments[0]=0.08
    # Title
    add_text(s2, title, cx+Inches(0.12), Inches(2.22), Inches(2.9), Inches(0.5),
             size=11, bold=True, color=WHITE)
    # Body
    add_text(s2, body, cx+Inches(0.12), Inches(2.72), Inches(2.88), Inches(4.1),
             size=9.5, color=PANEL, wrap=True)


# ═══════════════════════════════════════════════════════════════
#  SLIDE 3 — CURRENT LANDSCAPE (4 tools)
# ═══════════════════════════════════════════════════════════════
s3 = prs.slides.add_slide(blank_layout)
slide_bg(s3, WHITE)
add_corner_decor(s3)
add_fish_dots(s3)
add_teal_header_bar(s3, "CURRENT LANDSCAPE: EXISTING TOOLS & PLATFORMS",
                    "What the market offers today — and where it falls short")
add_sih_logo(s3)

tools = [
    ("NASA Panoply", "🇺🇸  USA · Open Source", "NASA",
     "The most widely used open-source desktop viewer for NetCDF, HDF, and GRIB datasets worldwide. Generates static 2D contour slice maps for atmospheric & ocean scientists.",
     RGBColor(0x0B,0x3D,0x91)),   # NASA blue
    ("Copernicus\nMyOcean Pro", "🇪🇺  European Union · Web Portal", "CMEMS",
     "Comprehensive EU marine data portal offering 2D multi-layer GIS map viewers and depth-point plots. Covers global ocean reanalysis and forecast products.",
     RGBColor(0x00,0x3D,0x99)),
    ("NOAA ERDDAP\n& Ncview", "🇺🇸  USA · Data Server + Viewer", "NOAA",
     "Standard tabular and 2D grid slice browser for fast scientific inspection of gridded ocean model outputs. Widely used in academic oceanographic research pipelines.",
     RGBColor(0x00,0x5F,0x87)),
    ("ParaView\n/ VisIt", "🌐  HPC Scientific Suite", "Kitware",
     "High-end desktop 3D rendering suite. Requires powerful GPU workstations, local download of gigabyte-scale files, and months of training — far beyond operational field use.",
     RGBColor(0x2C,0x4F,0x6B)),
]

tx = [Inches(0.22), Inches(3.42), Inches(6.62), Inches(9.82)]
for i,(name,origin,badge_txt,desc,col) in enumerate(tools):
    cx = tx[i]
    # Card
    card = s3.shapes.add_shape(5, cx, Inches(1.28), Inches(3.05), Inches(5.85))
    card.fill.solid(); card.fill.fore_color.rgb=col
    card.line.color.rgb=CYAN; card.line.width=Pt(1.2); card.adjustments[0]=0.1

    # Badge circle (simulating logo)
    badge_c = s3.shapes.add_shape(9, cx+Inches(1.1), Inches(1.38), Inches(0.85), Inches(0.85))
    badge_c.fill.solid(); badge_c.fill.fore_color.rgb=CYAN; badge_c.line.fill.background()
    add_text(s3, badge_txt, cx+Inches(1.1), Inches(1.5), Inches(0.85), Inches(0.55),
             size=7.5, bold=True, color=NAVY, align=PP_ALIGN.CENTER)

    # Name
    add_text(s3, name, cx+Inches(0.1), Inches(2.35), Inches(2.88), Inches(0.7),
             size=13.5, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    # Origin tag
    tag = s3.shapes.add_shape(5, cx+Inches(0.2), Inches(2.98), Inches(2.65), Inches(0.32))
    tag.fill.solid(); tag.fill.fore_color.rgb=CYAN; tag.line.fill.background(); tag.adjustments[0]=0.5
    tf=tag.text_frame; p=tf.paragraphs[0]; p.alignment=PP_ALIGN.CENTER
    r=p.add_run(); r.text=origin; r.font.size=Pt(8); r.font.bold=True; r.font.color.rgb=NAVY

    # Description
    add_text(s3, desc, cx+Inches(0.1), Inches(3.38), Inches(2.85), Inches(3.65),
             size=9.5, color=PANEL, wrap=True)


# ═══════════════════════════════════════════════════════════════
#  SLIDE 4 — LIMITATIONS & BOTTLENECKS
# ═══════════════════════════════════════════════════════════════
s4 = prs.slides.add_slide(blank_layout)
slide_bg(s4, WHITE)
add_corner_decor(s4)
add_fish_dots(s4)
add_teal_header_bar(s4, "LIMITATIONS & BOTTLENECKS OF CURRENT TOOLS",
                    "Why existing solutions fail operational end-users")
add_sih_logo(s4)

# Two-column: NASA Panoply (left) | Copernicus MyOcean Pro (right)
# Left column header
panoply_col = Inches(0.25)
myocean_col = Inches(6.72)

for cx, name, col, items in [
    (panoply_col, "NASA PANOPLY", RGBColor(0x0B,0x3D,0x91), [
        ("💻  Desktop-Bound (Java/JRE)", "Requires 15–20 GB local file downloads. Cannot run on mobile, ship tablets, or low-bandwidth VSAT connections."),
        ("📐  Flat 2D Slices Only",       "Renders only one lat/lon cross-section at a time. Zero true 3D volumetric depth perception."),
        ("📡  No In-Situ Overlay",        "Cannot integrate real-time ARGO floats, ocean gliders, or mooring sensor feeds alongside model data."),
        ("🎓  Unusable by Non-Scientists","Interface designed for atmospheric PhDs. A Coast Guard captain cannot interpret it under operational pressure."),
    ]),
    (myocean_col, "COPERNICUS MyOcean PRO", RGBColor(0x00,0x3D,0x99), [
        ("🌐  2.5D Surface Globe Only",   "Paints color textures on the outer sphere — cannot slice the full 3D vertical depth volume (0 m → 500 m)."),
        ("🔇  No Acoustic / Defense Focus","Misses underwater acoustic shadow zones for submarines and current shear warnings for ROV operators."),
        ("🌍  Eurocentric — Misses India", "Not tailored to India's Exclusive Economic Zone, INCOIS ROMS grids, or Arabian Sea / Bay of Bengal operational areas."),
        ("🔒  Requires Registration",     "Mandatory login wall with subscription tiers — inaccessible for rapid emergency deployment on field vessels."),
    ]),
]:
    # Column header bar
    hdr = s4.shapes.add_shape(1, cx, Inches(1.18), Inches(6.2), Inches(0.46))
    hdr.fill.solid(); hdr.fill.fore_color.rgb=col; hdr.line.fill.background()
    add_text(s4, name, cx+Inches(0.1), Inches(1.2), Inches(6.0), Inches(0.42),
             size=12.5, bold=True, color=WHITE)

    # Screenshot placeholder box
    sc = s4.shapes.add_shape(5, cx, Inches(1.72), Inches(6.2), Inches(1.62))
    sc.fill.solid(); sc.fill.fore_color.rgb=RGBColor(0xD0,0xE8,0xF5)
    sc.line.color.rgb=col; sc.line.width=Pt(1.5); sc.adjustments[0]=0.05
    add_text(s4, "[ Screenshot: Tool in Use ]",
             cx+Inches(0.1), Inches(2.28), Inches(6.0), Inches(0.5),
             size=10, italic=True, color=MIDGRAY, align=PP_ALIGN.CENTER)

    # Drawback items
    for j,(title,body) in enumerate(items):
        iy = Inches(3.48) + j*Inches(0.96)
        item_bg = s4.shapes.add_shape(1, cx, iy, Inches(6.2), Inches(0.88))
        item_bg.fill.solid()
        item_bg.fill.fore_color.rgb = RGBColor(0xF0,0xF8,0xFF) if j%2==0 else PANEL
        item_bg.line.fill.background()
        add_text(s4, title, cx+Inches(0.12), iy+Inches(0.04), Inches(6.0), Inches(0.32),
                 size=10, bold=True, color=col)
        add_text(s4, body, cx+Inches(0.12), iy+Inches(0.34), Inches(6.0), Inches(0.5),
                 size=8.8, color=DARKTEXT, wrap=True)


# ═══════════════════════════════════════════════════════════════
#  SLIDE 5 — OUR SOLUTION
# ═══════════════════════════════════════════════════════════════
s5 = prs.slides.add_slide(blank_layout)
slide_bg(s5, WHITE)
add_corner_decor(s5)
add_fish_dots(s5)
add_teal_header_bar(s5, "OUR SOLUTION: PURPOSE-DRIVEN HYBRID ARCHITECTURE",
                    "Rethinking how ocean data is layered, ordered & presented for every user type")
add_sih_logo(s5)

# Core philosophy pill
phil = s5.shapes.add_shape(5, Inches(0.35), Inches(1.2), Inches(12.6), Inches(0.62))
phil.fill.solid(); phil.fill.fore_color.rgb=RGBColor(0xE8,0xF4,0xFD)
phil.line.color.rgb=TEAL; phil.line.width=Pt(1.5); phil.adjustments[0]=0.35
add_text(s5, '"The flaw in current platforms isn\'t 2D vs 3D — it\'s cognitive overload: how massive multi-parameter data is layered, ordered & contextualised for human comprehension."',
         Inches(0.55), Inches(1.28), Inches(12.2), Inches(0.5),
         size=10.5, italic=True, color=TEAL, align=PP_ALIGN.CENTER)

# 3 innovation pillars
pillars = [
    ("A  ·  Cognitive Layering", TEAL,
     ["🌊  Surface:  SST + Gerstner animated waves",
      "🌡️  Subsurface:  Volumetric thermocline gradient + isotherm contours",
      "💧  Dynamics:  3D current vector streamlines with velocity encoding",
      "🪨  Bathymetry:  Seabed topography + continental slope contours",
      "📡  Ground Truth:  Live ARGO floats + CTD sensor telemetry overlay"]),
    ("B  ·  Hybrid Map → Volume Workflow", RGBColor(0x0E,0x56,0x7A),
     ["🗺️  Level 1 — Macro 2D GIS Overview:",
      "      Fast, clean MapLibre projection for universities & routine research",
      "🔍  Level 2 — On-Demand 3D Volume:",
      "      User box-selects any region on 2D map → system instantly loads",
      "      full volumetric 3D ocean column for that exact domain (0 m → 500 m)"]),
    ("C  ·  Zero-Friction Accessibility", RGBColor(0x17,0x52,0x76),
     ["🌐  100% Browser-Native WebGL — no Java, no installs, no downloads",
      "📱  Mobile-Ready — works on phones, ship tablets, low-bandwidth VSAT",
      "🔓  No Mandatory Login — instant open access for field operators",
      "🏫  Scales from University Research → Tactical Naval Operations"]),
]

px = [Inches(0.22), Inches(4.52), Inches(8.82)]
for i,(title,col,pts) in enumerate(pillars):
    cx=px[i]
    card = s5.shapes.add_shape(5, cx, Inches(2.02), Inches(4.05), Inches(5.15))
    card.fill.solid(); card.fill.fore_color.rgb=col
    card.line.color.rgb=CYAN; card.line.width=Pt(1.2); card.adjustments[0]=0.08

    add_text(s5, title, cx+Inches(0.12), Inches(2.1), Inches(3.85), Inches(0.42),
             size=12, bold=True, color=CYAN)

    # Divider
    dv = s5.shapes.add_shape(1, cx+Inches(0.12), Inches(2.54), Inches(3.82), Inches(0.03))
    dv.fill.solid(); dv.fill.fore_color.rgb=CYAN; dv.line.fill.background()

    for j,pt in enumerate(pts):
        add_text(s5, pt, cx+Inches(0.12), Inches(2.65)+j*Inches(0.82),
                 Inches(3.85), Inches(0.78), size=9.5, color=PANEL, wrap=True)


# ═══════════════════════════════════════════════════════════════
#  SLIDE 6 — TECHNOLOGY STACK (horizontal pipeline)
# ═══════════════════════════════════════════════════════════════
s6 = prs.slides.add_slide(blank_layout)
slide_bg(s6, NAVY)
add_fish_dots(s6)
add_sih_logo(s6)

# Title
add_text(s6, "END-TO-END TECHNICAL ARCHITECTURE & STACK",
         Inches(0.35), Inches(0.18), Inches(11.0), Inches(0.72),
         size=24, bold=True, color=WHITE)
add_text(s6, "Full-stack ocean data pipeline from raw model output to interactive 3D browser",
         Inches(0.35), Inches(0.85), Inches(11.0), Inches(0.38),
         size=11, color=CYAN)

# Timeline connector line
conn = s6.shapes.add_shape(1, Inches(0.6), Inches(3.2), Inches(12.1), Inches(0.06))
conn.fill.solid(); conn.fill.fore_color.rgb=CYAN; conn.line.fill.background()

tiers = [
    ("01", "Data Ingestion", RGBColor(0x06,0x4E,0x70),
     ["Python (Xarray,","Dask, NetCDF4)","Zarr Converter","INCOIS ROMS Files","ARGO Float Feeds","Satellite SST"]),
    ("02", "Geospatial DB", RGBColor(0x0A,0x4D,0x68),
     ["PostgreSQL","+ PostGIS","Spatial sensor","index & metadata","S3/MinIO object","storage for Zarr"]),
    ("03", "API & Cache", RGBColor(0x0E,0x4C,0x66),
     ["FastAPI (async)","Redis Cache","< 1ms depth slices","Cloudflare CDN","Binary streaming","LOD downsampling"]),
    ("04", "Frontend 3D/2D", RGBColor(0x12,0x4A,0x63),
     ["React.js + Tailwind","Three.js / WebGL","GLSL custom shaders","MapLibre GL (2D)","Mobile-responsive","Zero login required"]),
]

tier_x = [Inches(0.35), Inches(3.55), Inches(6.75), Inches(9.95)]
for i,(num, name, col, pts) in enumerate(tiers):
    cx = tier_x[i]
    # Card
    card = s6.shapes.add_shape(5, cx, Inches(1.35), Inches(3.1), Inches(5.85))
    card.fill.solid(); card.fill.fore_color.rgb=col
    card.line.color.rgb=CYAN; card.line.width=Pt(1.5); card.adjustments[0]=0.1

    # Number badge
    nb = s6.shapes.add_shape(9, cx+Inches(1.1), Inches(1.42), Inches(0.9), Inches(0.9))
    nb.fill.solid(); nb.fill.fore_color.rgb=CYAN; nb.line.fill.background()
    add_text(s6, num, cx+Inches(1.1), Inches(1.55), Inches(0.9), Inches(0.55),
             size=16, bold=True, color=NAVY, align=PP_ALIGN.CENTER)

    # Name
    add_text(s6, name, cx+Inches(0.1), Inches(2.42), Inches(2.95), Inches(0.52),
             size=13, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    # Dot on timeline
    dot = s6.shapes.add_shape(9, cx+Inches(1.25), Inches(3.08), Inches(0.27), Inches(0.27))
    dot.fill.solid(); dot.fill.fore_color.rgb=CYAN; dot.line.color.rgb=WHITE; dot.line.width=Pt(1.5)

    # Tech points
    for j,pt in enumerate(pts):
        tag = s6.shapes.add_shape(5, cx+Inches(0.12), Inches(3.55)+j*Inches(0.62),
                                   Inches(2.88), Inches(0.52))
        tag.fill.solid()
        tag.fill.fore_color.rgb = TEAL if j%2==0 else RGBColor(0x0A,0x52,0x6E)
        tag.line.fill.background(); tag.adjustments[0]=0.5
        add_text(s6, pt, cx+Inches(0.18), Inches(3.62)+j*Inches(0.62),
                 Inches(2.78), Inches(0.42), size=9.5, color=WHITE)

# Arrow between tiers
for i in range(3):
    ax = tier_x[i] + Inches(3.12)
    arr = s6.shapes.add_shape(5, ax, Inches(3.06), Inches(0.38), Inches(0.38))
    arr.fill.solid(); arr.fill.fore_color.rgb=AMBER; arr.line.fill.background(); arr.adjustments[0]=0.5
    add_text(s6, "→", ax, Inches(3.1), Inches(0.38), Inches(0.32),
             size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)


# ═══════════════════════════════════════════════════════════════
#  SLIDE 7 — SYSTEM ARCHITECTURE FLOW
# ═══════════════════════════════════════════════════════════════
s7 = prs.slides.add_slide(blank_layout)
slide_bg(s7, RGBColor(0x06,0x0E,0x1A))
add_fish_dots(s7)
add_sih_logo(s7)

add_text(s7, "END-TO-END DATA PIPELINE: CONVERSION & STREAMING FLOW",
         Inches(0.35), Inches(0.15), Inches(11.0), Inches(0.65),
         size=22, bold=True, color=WHITE)
add_text(s7, "How raw INCOIS model data flows from ingest → processing → caching → client rendering",
         Inches(0.35), Inches(0.78), Inches(11.0), Inches(0.38),
         size=10.5, color=CYAN)

# ── 3 INPUT nodes (top row) ──
inputs = [
    ("📡  INCOIS ROMS\nNetCDF Files", RGBColor(0x1A,0x5F,0x7A)),
    ("🌊  ARGO Float\nIn-Situ CTD Data", RGBColor(0x12,0x52,0x6E)),
    ("🛰️  Satellite SST\n& Altimetry", RGBColor(0x0E,0x4A,0x65)),
]
in_x = [Inches(0.3), Inches(1.75), Inches(3.2)]
for i,(label,col) in enumerate(inputs):
    n = s7.shapes.add_shape(5, in_x[i], Inches(1.35), Inches(1.3), Inches(1.0))
    n.fill.solid(); n.fill.fore_color.rgb=col
    n.line.color.rgb=CYAN; n.line.width=Pt(1); n.adjustments[0]=0.15
    add_text(s7, label, in_x[i]+Inches(0.05), Inches(1.42), Inches(1.22), Inches(0.88),
             size=8.5, color=WHITE, align=PP_ALIGN.CENTER)
    # Arrow down to hub
    a = s7.shapes.add_shape(1, in_x[i]+Inches(0.62), Inches(2.38), Inches(0.06), Inches(0.52))
    a.fill.solid(); a.fill.fore_color.rgb=CYAN; a.line.fill.background()

# ── CENTRAL HUB ──
hub = s7.shapes.add_shape(5, Inches(0.6), Inches(2.95), Inches(3.6), Inches(1.1))
hub.fill.solid(); hub.fill.fore_color.rgb=TEAL
hub.line.color.rgb=WHITE; hub.line.width=Pt(2.5); hub.adjustments[0]=0.5
tf=hub.text_frame; tf.word_wrap=True
p=tf.paragraphs[0]; p.alignment=PP_ALIGN.CENTER
r=p.add_run(); r.text="⚙️  Python Processing Engine"
r.font.size=Pt(13); r.font.bold=True; r.font.color.rgb=WHITE
p2=tf.add_paragraph(); p2.alignment=PP_ALIGN.CENTER
r2=p2.add_run(); r2.text="Xarray · Dask · Zarr Converter · PostGIS Indexer"
r2.font.size=Pt(9); r2.font.color.rgb=PANEL

# Arrow hub → cache
harr = s7.shapes.add_shape(1, Inches(4.22), Inches(3.35), Inches(0.85), Inches(0.06))
harr.fill.solid(); harr.fill.fore_color.rgb=AMBER; harr.line.fill.background()
add_text(s7, "→", Inches(4.25), Inches(3.2), Inches(0.4), Inches(0.4),
         size=18, bold=True, color=AMBER, align=PP_ALIGN.CENTER)

# ── 3 CACHE/API nodes (middle) ──
cache_nodes = [
    ("⚡  Redis Cache\n< 1ms Depth Slices", RGBColor(0x7C,0x3A,0xED)),
    ("🚀  FastAPI\nAsync Microservice", RGBColor(0x05,0x96,0x69)),
    ("🌐  Cloudflare CDN\nEdge Distribution", RGBColor(0xF5,0x9E,0x0B)),
]
cn_x = [Inches(5.15), Inches(6.75), Inches(8.35)]
for i,(label,col) in enumerate(cache_nodes):
    n = s7.shapes.add_shape(5, cn_x[i], Inches(2.78), Inches(1.48), Inches(1.02))
    n.fill.solid(); n.fill.fore_color.rgb=col
    n.line.color.rgb=WHITE; n.line.width=Pt(1); n.adjustments[0]=0.15
    add_text(s7, label, cn_x[i]+Inches(0.06), Inches(2.85), Inches(1.38), Inches(0.88),
             size=9, color=WHITE, align=PP_ALIGN.CENTER)
    # Arrow to output
    a = s7.shapes.add_shape(1, cn_x[i]+Inches(0.71), Inches(3.83), Inches(0.06), Inches(0.52))
    a.fill.solid(); a.fill.fore_color.rgb=CYAN; a.line.fill.background()

# Arrow cache → client
carr = s7.shapes.add_shape(1, Inches(9.85), Inches(3.35), Inches(0.75), Inches(0.06))
carr.fill.solid(); carr.fill.fore_color.rgb=AMBER; carr.line.fill.background()
add_text(s7, "→", Inches(9.88), Inches(3.2), Inches(0.4), Inches(0.4),
         size=18, bold=True, color=AMBER, align=PP_ALIGN.CENTER)

# ── 3 CLIENT output nodes ──
client_nodes = [
    ("🗺️  2D MapLibre GIS\nMacro Ocean View", RGBColor(0x1A,0x5F,0x7A)),
    ("🌊  Three.js WebGL\n3D Volume Engine", RGBColor(0x0E,0x4C,0x66)),
    ("📱  React.js\nMobile / Tablet UI", RGBColor(0x12,0x50,0x6A)),
]
out_x = [Inches(10.62), Inches(10.62), Inches(10.62)]
out_y = [Inches(1.55), Inches(2.9), Inches(4.25)]
for i,(label,col) in enumerate(client_nodes):
    n = s7.shapes.add_shape(5, out_x[i], out_y[i], Inches(2.55), Inches(1.0))
    n.fill.solid(); n.fill.fore_color.rgb=col
    n.line.color.rgb=CYAN; n.line.width=Pt(1.2); n.adjustments[0]=0.15
    add_text(s7, label, out_x[i]+Inches(0.1), out_y[i]+Inches(0.08), Inches(2.38), Inches(0.86),
             size=9.5, color=WHITE, align=PP_ALIGN.CENTER)
    # Connector from right side
    lc = s7.shapes.add_shape(1, Inches(10.0), out_y[i]+Inches(0.48), Inches(0.62), Inches(0.05))
    lc.fill.solid(); lc.fill.fore_color.rgb=CYAN; lc.line.fill.background()

# Feature summary row at bottom
features = [
    ("Zero Login Required", GREEN),
    ("Works on Mobile / VSAT", CYAN),
    ("NetCDF → Zarr: 10x Faster", AMBER),
    ("Sub-second Depth Slices", RGBColor(0xA7,0x8B,0xFA)),
    ("India EEZ Optimised", CORAL),
]
for i,(feat,col) in enumerate(features):
    fb = s7.shapes.add_shape(5, Inches(0.3)+i*Inches(2.6), Inches(6.35), Inches(2.42), Inches(0.72))
    fb.fill.solid(); fb.fill.fore_color.rgb=RGBColor(0x12,0x22,0x36)
    fb.line.color.rgb=col; fb.line.width=Pt(1.5); fb.adjustments[0]=0.5
    add_text(s7, feat, Inches(0.38)+i*Inches(2.6), Inches(6.52), Inches(2.3), Inches(0.45),
             size=9.5, bold=True, color=col, align=PP_ALIGN.CENTER)


# ── Save ─────────────────────────────────────────────────────
out_path = r"C:\Users\ayush\Downloads\OceanSight_SIH26067.pptx"
prs.save(out_path)
print(f"Saved -> {out_path}")

import os
print(f"Size: {os.path.getsize(out_path):,} bytes")
