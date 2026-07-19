#!/usr/bin/env python3
"""
Generador interactivo de mandalas -- DOS CAPAS independientes (fondo + frente)
Cada capa tiene sus propios parametros (simetria, anillos, complejidad, densidad,
paleta, semilla, escala, rotacion). Un boton conmuta que capa editan los sliders.
Requiere: numpy, matplotlib  (ventana interactiva: python3-tk)
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.path import Path
from matplotlib.patches import Wedge
from matplotlib.collections import PathCollection, LineCollection
from matplotlib.widgets import Slider, Button
import random


PALETTES = {
    "violeta_rosa": {"bg": "#ffffff",
        "colors": ["#f6a6c1", "#c86fc9", "#7d3ac1", "#4b1d8c", "#2a1250", "#e28ad1", "#f6a6c1", "#9b4dca"]},
    "carnaval": {"bg": "#0a0a0a",
        "colors": ["#ff4d6d", "#ffb703", "#8ecae6", "#219ebc", "#fb8500", "#e63946", "#ffd60a", "#06d6a0"]},
    "marron_dorado": {"bg": "#161008",
        "colors": ["#c9a15a", "#8a5a3b", "#5c3a21", "#7d5a8c", "#3a2313", "#b98a5e", "#e8d3a0", "#9c7248"]},
    "monocromo": {"bg": "#ffffff", "colors": ["#111111"] * 8},
    "azul_noche": {"bg": "#050510",
        "colors": ["#8ecae6", "#219ebc", "#023047", "#ffb703", "#fb8500", "#48cae4", "#e0f2ff", "#0077b6"]},
    "esmeralda": {"bg": "#07130f",
        "colors": ["#2a9d8f", "#e9c46a", "#264653", "#e76f51", "#8ab17d", "#f4a261", "#e0fbfc", "#118ab2"]},
}
PALETTE_NAMES = list(PALETTES.keys())
HATCHES = ["", "", "////", "\\\\\\\\", "....", "||||", "----", "xxxx"]


# Motivos con curvas Bezier
def path_leaf_marquise(w, h):
    v = [(0, 0), (w, h*0.32), (w*0.5, h*0.88), (0, h), (-w*0.5, h*0.88), (-w, h*0.32), (0, 0)]
    return Path(v, [Path.MOVETO] + [Path.CURVE4]*6)


def path_teardrop(w, h):
    v = [(0, 0), (w, h*0.15), (w, h*0.55), (0, h), (-w, h*0.55), (-w, h*0.15), (0, 0)]
    return Path(v, [Path.MOVETO] + [Path.CURVE4]*6)


def path_petalo_redondo(w, h):
    v = [(-w*0.55, 0), (-w, h*0.5), (-w*0.4, h), (0, h), (w*0.4, h), (w, h*0.5),
         (w*0.55, 0), (w*0.2, -h*0.05), (-w*0.2, -h*0.05), (-w*0.55, 0)]
    return Path(v, [Path.MOVETO] + [Path.CURVE4]*9)


def path_diamante(w, h):
    return Path([(0, 0), (w, h*0.5), (0, h), (-w, h*0.5), (0, 0)],
                [Path.MOVETO, Path.LINETO, Path.LINETO, Path.LINETO, Path.CLOSEPOLY])


def path_lagrima_doble(w, h):
    v = [(0, 0), (w*0.9, h*0.2), (w*0.5, h*0.6), (0, h*0.55), (-w*0.5, h*0.6), (-w*0.9, h*0.2), (0, 0)]
    return Path(v, [Path.MOVETO] + [Path.CURVE4]*6)


SHAPE_FUNCS = {
    "hoja_ojo": path_leaf_marquise, "gota": path_teardrop,
    "petalo_redondo": path_petalo_redondo, "diamante": path_diamante,
    "corazon_hoja": path_lagrima_doble,
}


# Transformaciones
def scale_path(path, factor, y_offset=0.0):
    v = path.vertices.copy() * factor
    v[:, 1] += y_offset
    return Path(v, path.codes)


def to_ring(path, r0, theta):
    rad = np.array([np.cos(theta), np.sin(theta)])
    tan = np.array([-np.sin(theta), np.cos(theta)])
    v = np.array([(r0 + y) * rad + x * tan for x, y in path.vertices])
    return Path(v, path.codes)


def circle_path(cx, cy, r, n=16):
    t = np.linspace(0, 2*np.pi, n)
    v = np.column_stack([cx + r*np.cos(t), cy + r*np.sin(t)])
    return Path(v, [Path.MOVETO] + [Path.LINETO]*(n-1))


# Anillos (vectorizados, con rotacion y offset de zorder por capa)
def ring_motifs(ax, rng, r0, gap, count, colors, edge, complexity, rot, zb, allow_hatch=True):
    height = gap * rng.uniform(0.7, 1.0)
    width = (2 * np.pi * r0 / count) * rng.uniform(0.34, 0.47)
    base = SHAPE_FUNCS[rng.choice(list(SHAPE_FUNCS.keys()))](width, height)
    cf = rng.choice(colors)
    hatch = rng.choice(HATCHES) if (complexity >= 3 and allow_hatch) else ""
    layers = 1 + (1 if complexity >= 2 else 0) + (1 if complexity >= 4 else 0)
    thetas = [rot + 2*np.pi*i/count for i in range(count)]

    pc = PathCollection([to_ring(base, r0, th) for th in thetas],
                        facecolors=cf, edgecolors=edge, linewidths=0.9, zorder=zb+2)
    if hatch:
        pc.set_hatch(hatch)
    ax.add_collection(pc)

    for L in range(1, layers):
        sc = 1 - L*0.32
        ib = scale_path(base, sc, y_offset=height*(1-sc)*0.5)
        ax.add_collection(PathCollection([to_ring(ib, r0, th) for th in thetas],
            facecolors=colors[(colors.index(cf)+L*2) % len(colors)],
            edgecolors="none", zorder=zb+2+L))

    if complexity >= 2:
        dots = [circle_path((r0+height*0.8)*np.cos(th), (r0+height*0.8)*np.sin(th), width*0.13)
                for th in thetas]
        ax.add_collection(PathCollection(dots,
            facecolors=colors[(colors.index(cf)+4) % len(colors)], edgecolors="none", zorder=zb+6))


def ring_beads(ax, rng, r0, count, colors, edge, rot, zb):
    cf = rng.choice(colors)
    rad_dot = (2*np.pi*r0/count) * 0.32
    beads = [circle_path(r0*np.cos(rot+2*np.pi*i/count), r0*np.sin(rot+2*np.pi*i/count), rad_dot)
             for i in range(count)]
    ax.add_collection(PathCollection(beads, facecolors=cf, edgecolors=edge, linewidths=0.5, zorder=zb+2))


def ring_rays(ax, rng, r0, gap, count, colors, edge, rot, zb):
    cf = rng.choice(colors)
    length = gap * rng.uniform(0.5, 0.85)
    lw = rng.uniform(1.5, 3.0)
    segs = []
    for i in range(count):
        th = rot + 2*np.pi*i/count
        rad = np.array([np.cos(th), np.sin(th)])
        segs.append([r0*rad, (r0+length)*rad])
    ax.add_collection(LineCollection(segs, colors=cf, linewidths=lw, zorder=zb+2))


def ring_scallop(ax, rng, r0, gap, count, colors, edge, rot, zb):
    cf = rng.choice(colors)
    ang = 360.0 / count
    rot_deg = np.degrees(rot)
    width = gap * 0.5
    for i in range(count):
        c = ang * i + rot_deg
        ax.add_patch(Wedge((0, 0), r0+width, c-ang*0.5, c+ang*0.5, width=width,
                           facecolor=cf, edgecolor=edge, linewidth=0.6, zorder=zb+1))


class Layer:
    def __init__(self, symmetry, rings, complexity, density, palette, scale, rot_deg):
        self.symmetry = symmetry
        self.rings = rings
        self.complexity = complexity
        self.density = density
        self.palette = palette
        self.scale = scale
        self.rot_deg = rot_deg
        self.rng = random.Random()
        self.seed = self.rng.randint(0, 10**9)

    def reroll(self):
        self.seed = self.rng.randint(0, 10**9)

    def variar(self):
        self.seed = self.rng.randint(0, 10**9)

    def next_palette(self):
        i = PALETTE_NAMES.index(self.palette)
        self.palette = PALETTE_NAMES[(i+1) % len(PALETTE_NAMES)]


class State:
    def __init__(self):
        self.back = Layer(12, 7, 3, 1, "violeta_rosa", 1.30, 0)
        self.front = Layer(16, 4, 4, 1, "azul_noche", 0.72, 15)
        self.active_name = "front"
        self.zoom = 1.0

    @property
    def active(self):
        return self.front if self.active_name == "front" else self.back


state = State()
UI_SYNC = False


def draw_layer(ax, P, edge, zbase):
    rng = random.Random(P.seed)
    colors = PALETTES[P.palette]["colors"]
    max_r = 1.0 * P.scale
    gap = max_r / (P.rings + 1)
    rot = np.radians(P.rot_deg)

    est = P.symmetry * P.density * P.rings
    allow_hatch = est <= 600

    for k in range(P.rings):
        r0 = gap * (k + 1)
        base_count = P.symmetry * P.density
        roll = rng.random()
        if k == P.rings - 1 and P.complexity >= 2:
            ring_scallop(ax, rng, r0, gap, P.symmetry, colors, edge, rot, zbase)
            ring_motifs(ax, rng, r0, gap, base_count, colors, edge, P.complexity, rot, zbase, allow_hatch)
        elif P.complexity >= 4 and roll < 0.25:
            ring_beads(ax, rng, r0, P.symmetry*2*P.density, colors, edge, rot, zbase)
        elif P.complexity >= 3 and roll < 0.4:
            ring_rays(ax, rng, r0, gap, P.symmetry*P.density, colors, edge, rot, zbase)
        else:
            ring_motifs(ax, rng, r0, gap, base_count, colors, edge, P.complexity, rot, zbase, allow_hatch)
            if P.complexity >= 2 and rng.random() < 0.5:
                ring_beads(ax, rng, r0 + gap*0.5, P.symmetry*2*P.density, colors, edge, rot, zbase)

    from matplotlib.patches import Circle
    ax.add_patch(Circle((0, 0), radius=gap*0.42, facecolor=colors[0],
                        edgecolor=edge, linewidth=1.0, zorder=zbase+8))
    if P.complexity >= 2:
        ring_motifs(ax, rng, gap*0.15, gap*0.35, P.symmetry, colors, edge, min(P.complexity, 2), rot, zbase)
    ax.add_patch(Circle((0, 0), radius=gap*0.12, facecolor=colors[2 % len(colors)],
                        edgecolor="none", zorder=zbase+10))


def compose(ax):
    ax.clear()
    bg = PALETTES[state.back.palette]["bg"]
    ax.set_facecolor(bg)
    ax.figure.patch.set_facecolor(bg)
    ax.set_aspect("equal")
    ax.set_axis_off()
    edge = "#000000" if bg not in ("#0a0a0a", "#161008", "#050510", "#07130f") else "#f2f2f2"

    draw_layer(ax, state.back, edge, zbase=0)
    draw_layer(ax, state.front, edge, zbase=100)

    lim = (1.15 * max(state.back.scale, state.front.scale)) / state.zoom
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.figure.canvas.draw()
    ax.figure.canvas.flush_events()


# Interfaz
fig = plt.figure(figsize=(9, 11))
ax = fig.add_axes([0.05, 0.37, 0.9, 0.60])
axc = "#dddddd"

b_layer = Button(fig.add_axes([0.30, 0.325, 0.40, 0.032]), "Editando: FRENTE")

s_sym = Slider(fig.add_axes([0.20, 0.288, 0.66, 0.016], facecolor=axc), "Simetria", 4, 36, valinit=state.active.symmetry, valstep=1, color="#7d3ac1")
s_rings = Slider(fig.add_axes([0.20, 0.259, 0.66, 0.016], facecolor=axc), "Anillos", 3, 14, valinit=state.active.rings, valstep=1, color="#2a9d8f")
s_cplx = Slider(fig.add_axes([0.20, 0.230, 0.66, 0.016], facecolor=axc), "Complejidad", 1, 5, valinit=state.active.complexity, valstep=1, color="#e76f51")
s_dens = Slider(fig.add_axes([0.20, 0.201, 0.66, 0.016], facecolor=axc), "Densidad", 1, 4, valinit=state.active.density, valstep=1, color="#f4a261")
s_scale = Slider(fig.add_axes([0.20, 0.172, 0.66, 0.016], facecolor=axc), "Escala", 0.4, 1.6, valinit=state.active.scale, valstep=0.05, color="#9b5de5")
s_rot = Slider(fig.add_axes([0.20, 0.143, 0.66, 0.016], facecolor=axc), "Rotacion", 0, 90, valinit=state.active.rot_deg, valstep=1, color="#00bbf9")
s_zoom = Slider(fig.add_axes([0.20, 0.114, 0.66, 0.016], facecolor=axc), "Zoom (global)", 0.5, 4.0, valinit=state.zoom, valstep=0.1, color="#264653")

b_new = Button(fig.add_axes([0.06, 0.05, 0.17, 0.04]), "Nuevo (capa)")
b_pal = Button(fig.add_axes([0.25, 0.05, 0.17, 0.04]), "Paleta (capa)")
b_var = Button(fig.add_axes([0.44, 0.05, 0.17, 0.04]), "Variar (capa)")
b_png = Button(fig.add_axes([0.63, 0.05, 0.14, 0.04]), "PNG")
b_svg = Button(fig.add_axes([0.79, 0.05, 0.14, 0.04]), "SVG")


def sync_sliders():
    global UI_SYNC
    UI_SYNC = True
    P = state.active
    s_sym.set_val(P.symmetry)
    s_rings.set_val(P.rings)
    s_cplx.set_val(P.complexity)
    s_dens.set_val(P.density)
    s_scale.set_val(P.scale)
    s_rot.set_val(P.rot_deg)
    UI_SYNC = False


def on_sym(v):
    if UI_SYNC: return
    state.active.symmetry = int(v); compose(ax)
def on_rings(v):
    if UI_SYNC: return
    state.active.rings = int(v); compose(ax)
def on_cplx(v):
    if UI_SYNC: return
    state.active.complexity = int(v); compose(ax)
def on_dens(v):
    if UI_SYNC: return
    state.active.density = int(v); compose(ax)
def on_scale(v):
    if UI_SYNC: return
    state.active.scale = float(v); compose(ax)
def on_rot(v):
    if UI_SYNC: return
    state.active.rot_deg = float(v); compose(ax)
def on_zoom(v):
    if UI_SYNC: return
    state.zoom = float(v); compose(ax)


def on_layer(e):
    state.active_name = "back" if state.active_name == "front" else "front"
    b_layer.label.set_text(f"Editando: {'FRENTE' if state.active_name=='front' else 'FONDO'}")
    sync_sliders()
    compose(ax)


def on_new(e):
    state.active.reroll(); compose(ax)
def on_pal(e):
    state.active.next_palette(); compose(ax)
def on_var(e):
    state.active.variar(); compose(ax)


def _extent():
    return ax.get_window_extent().transformed(fig.dpi_scale_trans.inverted()).expanded(1.05, 1.05)
def on_png(e):
    bg = PALETTES[state.back.palette]["bg"]
    fn = f"mandala_dual_{state.back.seed}_{state.front.seed}.png"
    fig.savefig(fn, dpi=240, facecolor=bg, bbox_inches=_extent()); print("Guardado PNG:", fn)
def on_svg(e):
    bg = PALETTES[state.back.palette]["bg"]
    fn = f"mandala_dual_{state.back.seed}_{state.front.seed}.svg"
    fig.savefig(fn, format="svg", facecolor=bg, bbox_inches=_extent()); print("Guardado SVG:", fn)


s_sym.on_changed(on_sym)
s_rings.on_changed(on_rings)
s_cplx.on_changed(on_cplx)
s_dens.on_changed(on_dens)
s_scale.on_changed(on_scale)
s_rot.on_changed(on_rot)
s_zoom.on_changed(on_zoom)
b_layer.on_clicked(on_layer)
b_new.on_clicked(on_new)
b_pal.on_clicked(on_pal)
b_var.on_clicked(on_var)
b_png.on_clicked(on_png)
b_svg.on_clicked(on_svg)

compose(ax)
plt.show()
