# OceanSight 3D - SIH26067 Full Presentation with Real Images & Official Logos
# Generated for Team 404 Founders (Newton School of Technology, S-VYASA)

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# ── Asset paths ──────────────────────────────────────────────
ASSETS_DIR   = r"C:\Users\ayush\.gemini\antigravity\scratch\oceansight-3d-mvp\pipeline\assets"
UPLOADED_DIR = r"C:\Users\ayush\.gemini\antigravity\brain\f7021cb9-7db4-4f07-a064-b5ca2192c170\.user_uploaded"
BRAIN_DIR    = r"C:\Users\ayush\.gemini\antigravity\brain\f7021cb9-7db4-4f07-a064-b5ca2192c170"

IMG_SIH        = os.path.join(ASSETS_DIR, "sih_logo.png")
IMG_NASA       = os.path.join(ASSETS_DIR, "nasa_logo.png")
IMG_COPERNICUS = os.path.join(ASSETS_DIR, "copernicus_logo.png")
IMG_NOAA       = os.path.join(ASSETS_DIR, "noaa_logo.png")
IMG_PARAVIEW   = os.path.join(ASSETS_DIR, "paraview_logo.png")

IMG_PANOPLY_SCREEN = os.path.join(UPLOADED_DIR, "media_1789155874882.png")
IMG_MYOCEAN_SCREEN = os.path.join(UPLOADED_DIR, "media_1789155798457.png")
IMG_DEMO_SURFACE   = os.path.join(BRAIN_DIR, "demo_surface.jpg")
IMG_DEMO_THERMO    = os.path.join(BRAIN_DIR, "demo_thermocline.jpg")
IMG_ARCH_DIAGRAM   = os.path.join(BRAIN_DIR, "ocean_architecture_pipeline_1788867700886.jpg")

# ── Color Palette ────────────────────────────────────────────
NAVY     = RGBColor(0x06, 0x0E, 0x1A)  # deep oceanic background
NAVY_MID = RGBColor(0x0D, 0x1B, 0x2A)  # card panel
TEAL     = RGBColor(0x1A, 0x6B, 0x8A)  # brand ocean teal
CYAN     = RGBColor(0x38, 0xBD, 0xF8)  # highlight cyan
WHITE    = RGBColor(0xFF, 0xFF, 0xFF)
AMBER    = RGBColor(0xF5, 0x9E, 0x0B)
CORAL    = RGBColor(0xF4, 0x3F, 0x5E)
GREEN    = RGBColor(0x10, 0xB9, 0x81)
DARKTEXT = RGBColor(0x0D, 0x1B, 0x2A)
MIDGRAY  = RGBColor(0x64, 0x74, 0x8B)
LTBLUE   = RGBColor(0xE8, 0xF4, 0xFD)
PANEL    = RGBColor(0xD0, 0xE8, 0xF5)

W = Inches(13.333)  # 16:9 Widescreen
H = Inches(7.5)

prs = Presentation()
prs.slide_width = W
prs.slide_height = H
blank_layout = prs.slide_layouts[6]

# ── Helper functions ─────────────────────────────────────────
def add_rect(slide, x, y, w, h, fill=None, line=None, line_w=None):
    shape = slide.shapes.add_shape(1, x, y, w, h)
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

def add_text(slide, text, x, y, w, h, size=18, bold=False, color=DARKTEXT, align=PP_ALIGN.LEFT, italic=False, wrap=True):
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

def add_sih_logo_badge(slide, dark_theme=False):
    """Adds the real, official Smart India Hackathon logo on EVERY slide."""
    # White background card to make the logo pop with crisp contrast
    card_w = Inches(2.35)
    card_h = Inches(0.68)
    card_x = W - card_w - Inches(0.25)
    card_y = Inches(0.12)

    bg_shape = slide.shapes.add_shape(5, card_x, card_y, card_w, card_h)  # rounded rectangle
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = WHITE
    bg_shape.line.color.rgb = CYAN
    bg_shape.line.width = Pt(1.5)
    bg_shape.adjustments[0] = 0.15

    # Insert real SIH logo image
    if os.path.exists(IMG_SIH):
        slide.shapes.add_picture(
            IMG_SIH,
            card_x + Inches(0.08),
            card_y + Inches(0.05),
            width=Inches(1.55),
            height=Inches(0.58)
        )

    # Sub-badge for Problem ID
    tag = slide.shapes.add_shape(5, card_x + Inches(1.65), card_y + Inches(0.12), Inches(0.62), Inches(0.44))
    tag.fill.solid()
    tag.fill.fore_color.rgb = NAVY_MID
    tag.line.fill.background()
    tag.adjustments[0] = 0.2
    tf = tag.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = "SIH\n26067"
    r.font.size = Pt(7.5)
    r.font.bold = True
    r.font.color.rgb = CYAN

def add_marine_decor(slide):
    """Decorative organic ocean accents."""
    # Corner wave shapes
    s1 = slide.shapes.add_shape(9, Inches(-0.4), Inches(-0.4), Inches(1.8), Inches(1.8))
    s1.fill.solid(); s1.fill.fore_color.rgb = TEAL; s1.line.fill.background()
    s2 = slide.shapes.add_shape(9, Inches(12.3), Inches(6.4), Inches(1.5), Inches(1.5))
    s2.fill.solid(); s2.fill.fore_color.rgb = TEAL; s2.line.fill.background()

    # Small swimming fish icons / cyan bubbles
    dots = [(1.5, 0.25), (2.8, 0.18), (8.5, 0.22), (0.4, 6.8), (11.0, 6.6)]
    for fx, fy in dots:
        o = slide.shapes.add_shape(9, Inches(fx), Inches(fy), Inches(0.16), Inches(0.09))
        o.fill.solid(); o.fill.fore_color.rgb = CYAN; o.line.fill.background()

def add_header_banner(slide, title, subtitle=None):
    add_rect(slide, Inches(0), Inches(0), W, Inches(0.95), fill=NAVY_MID)
    add_text(slide, title, Inches(0.4), Inches(0.08), Inches(9.5), Inches(0.52),
             size=22, bold=True, color=WHITE)
    if subtitle:
        add_text(slide, subtitle, Inches(0.4), Inches(0.56), Inches(9.5), Inches(0.35),
                 size=10.5, color=CYAN)
    add_sih_logo_badge(slide, dark_theme=True)


# =============================================================
# SLIDE 1: TITLE PAGE (Inspired by user's reference image)
# =============================================================
s1 = prs.slides.add_slide(blank_layout)
s1.background.fill.solid()
s1.background.fill.fore_color.rgb = WHITE

# Left navy block
add_rect(s1, Inches(0), Inches(0), Inches(6.8), H, fill=NAVY)
add_rect(s1, Inches(0), Inches(0), Inches(6.8), Inches(0.18), fill=TEAL)

# Decorative wave corner & fish
add_marine_decor(s1)

# Main Title & Presentation Meta
add_text(s1, "OCEANSIGHT 3D", Inches(0.5), Inches(0.8), Inches(6.0), Inches(0.85),
         size=36, bold=True, color=CYAN)

add_text(s1, "Interactive 3D Visualization Platform for\nNumerical Ocean Models & In-Situ Observations",
         Inches(0.5), Inches(1.75), Inches(6.0), Inches(0.9),
         size=15, bold=False, color=WHITE)

# Hackathon Info Banner
h_box = s1.shapes.add_shape(5, Inches(0.5), Inches(2.85), Inches(5.8), Inches(0.5))
h_box.fill.solid(); h_box.fill.fore_color.rgb = TEAL; h_box.line.fill.background(); h_box.adjustments[0] = 0.4
tf = h_box.text_frame
p = tf.paragraphs[0]; p.alignment = PP_ALIGN.LEFT
r = p.add_run()
r.text = "  SMART INDIA HACKATHON 2024  ·  PS ID: SIH26067"
r.font.size = Pt(11); r.font.bold = True; r.font.color.rgb = WHITE

# Team & Institution Info
add_text(s1, "Team 404 Founders", Inches(0.5), Inches(3.6), Inches(6.0), Inches(0.5),
         size=22, bold=True, color=WHITE)

add_text(s1, "Newton School of Technology  ·  S-VYASA University", Inches(0.5), Inches(4.2), Inches(6.0), Inches(0.4),
         size=12.5, color=PANEL)

add_text(s1, "Ministry of Earth Sciences (MoES)  |  INCOIS", Inches(0.5), Inches(4.65), Inches(6.0), Inches(0.4),
         size=11, color=CYAN)

# Divider
d_line = s1.shapes.add_shape(1, Inches(0.5), Inches(5.2), Inches(5.8), Inches(0.03))
d_line.fill.solid(); d_line.fill.fore_color.rgb = TEAL; d_line.line.fill.background()

add_text(s1, "Theme: Research, Innovation & Operational Decision-Making for Maritime Safety",
         Inches(0.5), Inches(5.35), Inches(5.8), Inches(0.6),
         size=10, italic=True, color=RGBColor(0xA0, 0xC8, 0xE0))

# RIGHT SIDE: Arched & Rounded Image Windows (Inspired by uploaded slide layout)
# Arched main frame for 3D Ocean Surface
arch_bg = s1.shapes.add_shape(5, Inches(7.3), Inches(0.8), Inches(5.5), Inches(4.2))
arch_bg.fill.solid(); arch_bg.fill.fore_color.rgb = NAVY_MID
arch_bg.line.color.rgb = CYAN; arch_bg.line.width = Pt(2.5); arch_bg.adjustments[0] = 0.25

if os.path.exists(IMG_DEMO_SURFACE):
    s1.shapes.add_picture(IMG_DEMO_SURFACE, Inches(7.45), Inches(0.95), width=Inches(5.2), height=Inches(3.9))

# Circular accent frame overlapping bottom right with Thermocline visual
c_frame = s1.shapes.add_shape(9, Inches(9.8), Inches(4.3), Inches(2.8), Inches(2.8))
c_frame.fill.solid(); c_frame.fill.fore_color.rgb = WHITE
c_frame.line.color.rgb = TEAL; c_frame.line.width = Pt(3)

if os.path.exists(IMG_DEMO_THERMO):
    s1.shapes.add_picture(IMG_DEMO_THERMO, Inches(10.0), Inches(4.5), width=Inches(2.4), height=Inches(2.4))

# Official SIH logo on title page
add_sih_logo_badge(s1)


# =============================================================
# SLIDE 2: PROBLEM STATEMENT & REAL PAIN POINTS
# =============================================================
s2 = prs.slides.add_slide(blank_layout)
s2.background.fill.solid()
s2.background.fill.fore_color.rgb = WHITE
add_marine_decor(s2)
add_header_banner(s2, "THE CORE PROBLEM & OPERATIONAL PAIN POINTS",
                  "Problem Statement ID: SIH26067 | Ministry of Earth Sciences / INCOIS")

# Problem Statement Quote Box
ps_box = s2.shapes.add_shape(5, Inches(0.5), Inches(1.15), Inches(12.33), Inches(0.75))
ps_box.fill.solid(); ps_box.fill.fore_color.rgb = LTBLUE
ps_box.line.color.rgb = TEAL; ps_box.line.width = Pt(1.5); ps_box.adjustments[0] = 0.2
tf = ps_box.text_frame; tf.word_wrap = True
p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
r = p.add_run()
r.text = '"Develop a web-based interactive 3D visualization platform that integrates numerical ocean model outputs and in-situ observations."'
r.font.size = Pt(12.5); r.font.bold = True; r.font.italic = True; r.font.color.rgb = TEAL

# 4 Detailed Pain-Point Cards
pain_cards = [
    ("📊 Data Overload vs. Insight", TEAL, [
        "• INCOIS generates massive multi-dimensional NetCDF/GRIB outputs daily.",
        "• Interpreting 4D ocean physics requires doctorate-level expertise.",
        "• Raw numbers conceal critical operational gradients like thermoclines and shear currents."
    ]),
    ("🚢 High-Stakes Operational Users", RGBColor(0x0E, 0x56, 0x7A), [
        "• Coast Guard, Naval Submarines, Cargo Captains, and ROV/AUV operators depend on ocean state data daily.",
        "• Submarines require exact acoustic shadow depths for acoustic concealment.",
        "• Subsea maintenance robots struggle with sudden deep current shear."
    ]),
    ("⏳ The Manual Workflow Bottleneck", RGBColor(0x17, 0x52, 0x76), [
        "• Scientists must open complex legacy desktop tools (Panoply, Ferret, Ncview).",
        "• Slices and graphs are manually compiled into static PDF reports.",
        "• Reports are emailed to captains, who then must call scientists for clarifications."
    ]),
    ("⚠️ Delayed Life-or-Death Decisions", RGBColor(0x1A, 0x53, 0x74), [
        "• Operators receive static 2D snapshots hours after models are run.",
        "• No real-time interactive exploration when conditions suddenly shift at sea.",
        "• Critical gap between scientific numerical models and fast operational decisions."
    ])
]

col_w = Inches(2.93)
col_gap = Inches(0.2)
for i, (title, col, bullets) in enumerate(pain_cards):
    cx = Inches(0.5) + i * (col_w + col_gap)
    card = s2.shapes.add_shape(5, cx, Inches(2.1), col_w, Inches(5.0))
    card.fill.solid(); card.fill.fore_color.rgb = col
    card.line.color.rgb = CYAN; card.line.width = Pt(1); card.adjustments[0] = 0.08

    add_text(s2, title, cx + Inches(0.12), Inches(2.2), col_w - Inches(0.24), Inches(0.6),
             size=12, bold=True, color=WHITE)

    body_text = "\n\n".join(bullets)
    add_text(s2, body_text, cx + Inches(0.12), Inches(2.85), col_w - Inches(0.24), Inches(4.1),
             size=9.5, color=PANEL, wrap=True)


# =============================================================
# SLIDE 3: CURRENT LANDSCAPE & TOOLS (WITH OFFICIAL LOGOS)
# =============================================================
s3 = prs.slides.add_slide(blank_layout)
s3.background.fill.solid()
s3.background.fill.fore_color.rgb = WHITE
add_marine_decor(s3)
add_header_banner(s3, "CURRENT LANDSCAPE: EXISTING TOOLS & PLATFORMS",
                  "Reviewing world-wide tools currently used for NetCDF ocean visualization")

tool_data = [
    ("NASA Panoply", "USA · NASA GSFC", IMG_NASA, [
        "• The world's most widely used desktop viewer for NetCDF, HDF, and GRIB datasets.",
        "• Produces static 2D slice contour and vector maps.",
        "• Standard tool in atmospheric and academic oceanographic institutions."
    ]),
    ("Copernicus MyOcean Pro", "European Union · Mercator Ocean", IMG_COPERNICUS, [
        "• Flagship web-based GIS portal for EU marine data visualization.",
        "• Provides interactive 2D map layers, depth sliders, and point time-series.",
        "• Serves European global ocean forecast and reanalysis products."
    ]),
    ("NOAA ERDDAP / Ncview", "USA · NOAA CoastWatch", IMG_NOAA, [
        "• High-speed data server and lightweight NetCDF visual inspection utility.",
        "• Allows tabular filtering and fast slicing of gridded ocean data.",
        "• Widely adopted by research laboratories and data scientists."
    ]),
    ("ParaView / VisIt", "Global · Kitware HPC", IMG_PARAVIEW, [
        "• High-end desktop scientific 3D visualization and volume rendering suite.",
        "• Supports complex isosurfaces, streamline tracing, and volumetric shaders.",
        "• Demands dedicated workstation GPUs and extensive specialized training."
    ])
]

for i, (name, origin, logo_path, bullets) in enumerate(tool_data):
    cx = Inches(0.5) + i * (col_w + col_gap)
    card = s3.shapes.add_shape(5, cx, Inches(1.2), col_w, Inches(5.9))
    card.fill.solid(); card.fill.fore_color.rgb = RGBColor(0xF8, 0xFA, 0xFC)
    card.line.color.rgb = TEAL; card.line.width = Pt(1.5); card.adjustments[0] = 0.08

    # Logo Container
    logo_box = s3.shapes.add_shape(5, cx + Inches(0.2), Inches(1.35), col_w - Inches(0.4), Inches(1.1))
    logo_box.fill.solid(); logo_box.fill.fore_color.rgb = WHITE
    logo_box.line.color.rgb = RGBColor(0xE2, 0xE8, 0xF0); logo_box.line.width = Pt(1)

    if os.path.exists(logo_path):
        s3.shapes.add_picture(logo_path, cx + Inches(0.4), Inches(1.42), width=col_w - Inches(0.8), height=Inches(0.95))

    add_text(s3, name, cx + Inches(0.1), Inches(2.6), col_w - Inches(0.2), Inches(0.4),
             size=13.5, bold=True, color=NAVY_MID, align=PP_ALIGN.CENTER)

    tag = s3.shapes.add_shape(5, cx + Inches(0.3), Inches(3.05), col_w - Inches(0.6), Inches(0.32))
    tag.fill.solid(); tag.fill.fore_color.rgb = TEAL; tag.line.fill.background(); tag.adjustments[0] = 0.5
    tf = tag.text_frame; p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = origin; r.font.size = Pt(8); r.font.bold = True; r.font.color.rgb = WHITE

    body = "\n\n".join(bullets)
    add_text(s3, body, cx + Inches(0.15), Inches(3.55), col_w - Inches(0.3), Inches(3.4),
             size=9.5, color=DARKTEXT, wrap=True)


# =============================================================
# SLIDE 4: DRAWBACKS & BOTTLENECKS (WITH ACTUAL SCREENSHOTS!)
# =============================================================
s4 = prs.slides.add_slide(blank_layout)
s4.background.fill.solid()
s4.background.fill.fore_color.rgb = WHITE
add_marine_decor(s4)
add_header_banner(s4, "LIMITATIONS & BOTTLENECKS OF CURRENT TOOLS",
                  "Why existing solutions fail in fast-paced operational maritime scenarios")

pane_w = Inches(6.0)
# LEFT COLUMN: NASA Panoply
add_rect(s4, Inches(0.5), Inches(1.15), pane_w, Inches(0.45), fill=RGBColor(0x0B, 0x3D, 0x91))
add_text(s4, "NASA PANOPLY — Desktop Java Bottleneck", Inches(0.6), Inches(1.2), pane_w - Inches(0.2), Inches(0.35),
         size=12, bold=True, color=WHITE)

# Actual Panoply Screenshot uploaded by user
if os.path.exists(IMG_PANOPLY_SCREEN):
    s4.shapes.add_picture(IMG_PANOPLY_SCREEN, Inches(0.5), Inches(1.65), width=pane_w, height=Inches(2.55))

panoply_drawbacks = [
    "❌ Desktop-Bound (Java): Requires downloading 15–20 GB raw files locally and installing JRE. Impossible on mobile or ship satellite links.",
    "❌ Flat 2D Slices Only: View only one horizontal or vertical cross-section at a time. Zero true 3D volumetric rendering.",
    "❌ Zero In-Situ Sensor Overlay: Cannot overlay real-time ARGO floats or buoy observations alongside model fields.",
    "❌ High Cognitive Barrier: Designed strictly for atmospheric research PhDs; completely unusable for an operational Coast Guard captain."
]
p_text = "\n".join(panoply_drawbacks)
add_text(s4, p_text, Inches(0.5), Inches(4.3), pane_w, Inches(2.8), size=9.5, color=DARKTEXT, wrap=True)

# RIGHT COLUMN: Copernicus MyOcean Pro
add_rect(s4, Inches(6.83), Inches(1.15), pane_w, Inches(0.45), fill=RGBColor(0x00, 0x3D, 0x99))
add_text(s4, "COPERNICUS MyOcean PRO — 2.5D Surface Limitation", Inches(6.93), Inches(1.2), pane_w - Inches(0.2), Inches(0.35),
         size=12, bold=True, color=WHITE)

# Actual MyOcean Screenshot uploaded by user
if os.path.exists(IMG_MYOCEAN_SCREEN):
    s4.shapes.add_picture(IMG_MYOCEAN_SCREEN, Inches(6.83), Inches(1.65), width=pane_w, height=Inches(2.55))

myocean_drawbacks = [
    "❌ 2.5D Surface Globe, Not Volumetric: Paints color rasters onto the surface of a globe. Cannot slice depth volumes (0m → 500m).",
    "❌ No Acoustic / Thermocline Defense Focus: Fails to highlight acoustic shadow zones for submarine sonar or current shear for ROVs.",
    "❌ Eurocentric / Disconnected from India: Tailored to European regions; lacks native support for INCOIS high-res ROMS grids.",
    "❌ Complex Layering Hierarchy: Overwhelming GIS menus with high latency when toggling multiple variables."
]
m_text = "\n".join(myocean_drawbacks)
add_text(s4, m_text, Inches(6.83), Inches(4.3), pane_w, Inches(2.8), size=9.5, color=DARKTEXT, wrap=True)


# =============================================================
# SLIDE 5: OUR SOLUTION — PURPOSE-DRIVEN HYBRID ARCHITECTURE
# =============================================================
s5 = prs.slides.add_slide(blank_layout)
s5.background.fill.solid()
s5.background.fill.fore_color.rgb = WHITE
add_marine_decor(s5)
add_header_banner(s5, "OUR SOLUTION: PURPOSE-DRIVEN HYBRID ARCHITECTURE",
                  "Solving cognitive overload through intelligent data layering and hybrid 2D-to-3D exploration")

# Philosophy statement
phil = s5.shapes.add_shape(5, Inches(0.5), Inches(1.15), Inches(12.33), Inches(0.65))
phil.fill.solid(); phil.fill.fore_color.rgb = LTBLUE
phil.line.color.rgb = TEAL; phil.line.width = Pt(1.5); phil.adjustments[0] = 0.25
tf = phil.text_frame
p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
r = p.add_run()
r.text = '"The main problem is not just 2D vs. 3D — it is how vast multi-parameter ocean data is layered, ordered, and presented so anyone can understand it."'
r.font.size = Pt(11); r.font.bold = True; r.font.italic = True; r.font.color.rgb = TEAL

# 3 Pillars
pillars = [
    ("1. Cognitive Layering Hierarchy", TEAL, [
        "• Structured Operational Layers: Data is organized into logical depths:",
        "  - Surface Layer: SST + Gerstner dynamic waves.",
        "  - Subsurface Volume: Continuous thermocline gradient & isotherms.",
        "  - Dynamics: 3D particle current streamlines with velocity colors.",
        "  - Bathymetry: Procedural seabed contours & continental slope.",
        "  - Ground Truth: Live ARGO profiling floats & CTD telemetry overlay."
    ]),
    ("2. Hybrid 2D-to-3D Workflow", RGBColor(0x0E, 0x56, 0x7A), [
        "• Macro 2D GIS Map (University / Broad Overview):",
        "  Familiar, lightweight 2D map for regional surveillance without heavy rendering overhead.",
        "• On-Demand 3D Volumetric Slicing (Defense / ROVs):",
        "  User box-selects any coordinates on the 2D map to instantly instantiate a deep 3D ocean volume (0m → 500m → seabed) with live probe telemetry."
    ]),
    ("3. Zero-Friction Web Accessibility", RGBColor(0x17, 0x52, 0x76), [
        "• 100% Browser-Native WebGL: Zero installs, zero downloads, and NO mandatory login barrier.",
        "• Mobile & Low-Bandwidth Ready: Fully responsive on tactical tablets and ship bridge screens over low-speed satellite/VSAT connections.",
        "• Unified Platform: Scales seamlessly from university education to frontline naval and Coast Guard missions."
    ])
]

col_w3 = Inches(3.97)
for i, (title, col, pts) in enumerate(pillars):
    cx = Inches(0.5) + i * (col_w3 + Inches(0.2))
    card = s5.shapes.add_shape(5, cx, Inches(1.95), col_w3, Inches(5.15))
    card.fill.solid(); card.fill.fore_color.rgb = col
    card.line.color.rgb = CYAN; card.line.width = Pt(1); card.adjustments[0] = 0.08

    add_text(s5, title, cx + Inches(0.15), Inches(2.1), col_w3 - Inches(0.3), Inches(0.45),
             size=12.5, bold=True, color=CYAN)

    body = "\n\n".join(pts)
    add_text(s5, body, cx + Inches(0.15), Inches(2.65), col_w3 - Inches(0.3), Inches(4.3),
             size=9.5, color=WHITE, wrap=True)


# =============================================================
# SLIDE 6: TECHNOLOGY STACK (PIPELINE TIMELINE)
# =============================================================
s6 = prs.slides.add_slide(blank_layout)
s6.background.fill.solid()
s6.background.fill.fore_color.rgb = NAVY
add_marine_decor(s6)
add_header_banner(s6, "END-TO-END TECHNOLOGY STACK",
                  "Modern, high-performance cloud-native tools driving OceanSight 3D")

timeline_line = s6.shapes.add_shape(1, Inches(0.8), Inches(3.2), Inches(11.7), Inches(0.06))
timeline_line.fill.solid(); timeline_line.fill.fore_color.rgb = CYAN; timeline_line.line.fill.background()

tiers = [
    ("01", "Data Pipeline & Ingestion", RGBColor(0x06, 0x4E, 0x70), [
        "Python (Xarray, Dask)",
        "NetCDF4 Data Slicing",
        "Zarr Cloud Conversion",
        "INCOIS ROMS Grids",
        "ARGO Float In-Situ Feeds"
    ]),
    ("02", "Storage & Database", RGBColor(0x0A, 0x4D, 0x68), [
        "PostgreSQL + PostGIS",
        "Geospatial Buoy Indexing",
        "Cloud Object Store (S3)",
        "Chunked Zarr Store",
        "Bathymetry DEM Cache"
    ]),
    ("03", "High-Speed API & Cache", RGBColor(0x0E, 0x4C, 0x66), [
        "FastAPI (Async Microservice)",
        "Redis In-Memory Cache",
        "< 1ms Pre-warmed Slices",
        "Raw Binary Data Packing",
        "Cloudflare Edge CDN"
    ]),
    ("04", "Client 3D & 2D Frontend", RGBColor(0x12, 0x4A, 0x63), [
        "React.js + TailwindCSS",
        "Three.js / WebGL & WebGPU",
        "Custom GLSL Wave Shaders",
        "MapLibre GL (2D GIS)",
        "Mobile & Touch Responsive"
    ])
]

for i, (num, name, col, pts) in enumerate(tiers):
    cx = Inches(0.5) + i * (col_w + col_gap)
    card = s6.shapes.add_shape(5, cx, Inches(1.25), col_w, Inches(5.85))
    card.fill.solid(); card.fill.fore_color.rgb = col
    card.line.color.rgb = CYAN; card.line.width = Pt(1.5); card.adjustments[0] = 0.1

    nb = s6.shapes.add_shape(9, cx + Inches(1.05), Inches(1.35), Inches(0.85), Inches(0.85))
    nb.fill.solid(); nb.fill.fore_color.rgb = CYAN; nb.line.fill.background()
    add_text(s6, num, cx + Inches(1.05), Inches(1.48), Inches(0.85), Inches(0.55),
             size=16, bold=True, color=NAVY, align=PP_ALIGN.CENTER)

    add_text(s6, name, cx + Inches(0.1), Inches(2.35), col_w - Inches(0.2), Inches(0.55),
             size=12.5, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    dot = s6.shapes.add_shape(9, cx + Inches(1.3), Inches(3.08), Inches(0.3), Inches(0.3))
    dot.fill.solid(); dot.fill.fore_color.rgb = CYAN; dot.line.color.rgb = WHITE; dot.line.width = Pt(1.5)

    for j, pt in enumerate(pts):
        tag = s6.shapes.add_shape(5, cx + Inches(0.15), Inches(3.6) + j * Inches(0.62), col_w - Inches(0.3), Inches(0.52))
        tag.fill.solid(); tag.fill.fore_color.rgb = TEAL if j % 2 == 0 else RGBColor(0x0A, 0x52, 0x6E)
        tag.line.fill.background(); tag.adjustments[0] = 0.5
        add_text(s6, pt, cx + Inches(0.2), Inches(3.68) + j * Inches(0.62), col_w - Inches(0.4), Inches(0.4),
                 size=9.5, color=WHITE, align=PP_ALIGN.CENTER)


# =============================================================
# SLIDE 7: END-TO-END DATA CONVERSION & STREAMING ARCHITECTURE
# =============================================================
s7 = prs.slides.add_slide(blank_layout)
s7.background.fill.solid()
s7.background.fill.fore_color.rgb = NAVY
add_marine_decor(s7)
add_header_banner(s7, "END-TO-END DATA CONVERSION & STREAMING PIPELINE",
                  "NetCDF Ingestion → Python Zarr Conversion → Redis Caching → 3D WebGL Rendering")

# Embed the generated high-resolution Architecture Diagram
if os.path.exists(IMG_ARCH_DIAGRAM):
    s7.shapes.add_picture(IMG_ARCH_DIAGRAM, Inches(0.5), Inches(1.15), width=Inches(8.2), height=Inches(4.8))

# Right Explanation Cards
info_x = Inches(8.9)
info_w = Inches(3.93)

arch_steps = [
    ("1. Convert NetCDF to Zarr", AMBER,
     "Modern cloud-native format. Stores chunks independently so client fetches only the exact depth layer requested instead of the entire 15 GB file."),
    ("2. In-Memory Redis Caching", GREEN,
     "Common depths (0m, 50m, 100m) are pre-warmed in RAM cache. Second time anyone requests a slice, response time drops to < 1 millisecond."),
    ("3. Raw Binary Streaming (10x Smaller)", CYAN,
     "Replaces bloated JSON with compact Float32 binary byte buffers, reducing bandwidth by 90% over shipboard satellite connections."),
    ("4. Level of Detail (LOD) Meshing", CORAL,
     "Dynamic downsampling: High resolution near the camera probe; lower mesh density in distant ocean zones for steady 60 FPS performance.")
]

for i, (title, col, desc) in enumerate(arch_steps):
    iy = Inches(1.15) + i * Inches(1.22)
    step_box = s7.shapes.add_shape(5, info_x, iy, info_w, Inches(1.15))
    step_box.fill.solid(); step_box.fill.fore_color.rgb = NAVY_MID
    step_box.line.color.rgb = col; step_box.line.width = Pt(1.5); step_box.adjustments[0] = 0.12

    add_text(s7, title, info_x + Inches(0.15), iy + Inches(0.08), info_w - Inches(0.3), Inches(0.35),
             size=11, bold=True, color=col)
    add_text(s7, desc, info_x + Inches(0.15), iy + Inches(0.42), info_w - Inches(0.3), Inches(0.68),
             size=8.8, color=WHITE, wrap=True)

# Bottom Feature Pills
features = [
    ("✓ Zero Login Required", GREEN),
    ("✓ Mobile & Low-Bandwidth VSAT", CYAN),
    ("✓ NetCDF → Zarr: 10x Faster", AMBER),
    ("✓ Sub-millisecond Depth Slices", RGBColor(0xA7, 0x8B, 0xFA)),
    ("✓ Indian Ocean EEZ Tailored", CORAL)
]

pill_w = Inches(2.38)
for i, (feat, col) in enumerate(features):
    px = Inches(0.5) + i * (pill_w + Inches(0.1))
    fb = s7.shapes.add_shape(5, px, Inches(6.25), pill_w, Inches(0.85))
    fb.fill.solid(); fb.fill.fore_color.rgb = RGBColor(0x0E, 0x1A, 0x2A)
    fb.line.color.rgb = col; fb.line.width = Pt(1.5); fb.adjustments[0] = 0.5
    add_text(s7, feat, px + Inches(0.1), Inches(6.45), pill_w - Inches(0.2), Inches(0.45),
             size=9.5, bold=True, color=col, align=PP_ALIGN.CENTER)


# ── Save Presentation to Downloads and Desktop ──────────────
out_downloads = r"C:\Users\ayush\Downloads\OceanSight_SIH26067_Final.pptx"
out_desktop   = r"C:\Users\ayush\Desktop\OceanSight_SIH26067_Final.pptx"

prs.save(out_downloads)
prs.save(out_desktop)

print("SUCCESS: Saved presentation to:")
print(f"  1. {out_downloads} ({os.path.getsize(out_downloads):,} bytes)")
print(f"  2. {out_desktop} ({os.path.getsize(out_desktop):,} bytes)")

