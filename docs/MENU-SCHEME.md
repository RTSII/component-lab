# Menu scheme: menus, submenus and variables

**Applied on feat/blank-default (Rob t681u, t685u):** 5 main menus: Color, Interaction, Style, Motion, Layout.
"Type" and "Rate" are gone as main menus. Motion groups, in order: **Timing** (Speed, Loop time = Seconds per loop,
Direction = Play direction), **Movement** (Feel = Movement feel, Strength = Movement strength [was Rate "Intensity"],
When idle = Move when idle), **Depth** (3D strength = 3D depth strength), then **Hover** (Lift; still in Motion until
the Interaction › Hover move is approved). Old files using `"section": "rate"` are read as Motion.
Surface is titled **Style** (Rob t688u); its internal id stays `surface`, so old files load into Style unchanged.
**Pro first (Rob t689u):** Pro (all controls) is the design; Mid and Free are later subsets. Inside a group the order is
the scheme order (`core.order` in core.json), never tier. Style groups: **Opacity** (Fill opacity, Border opacity),
**Glow** (Glow strength), **Corners** (Corner roundness), **Glass** (Background blur).
Layout groups, in order: **Size** (Width, Height, Scale), **Spacing** (Padding, Gap), **Text** (Secondary text size, Weight,
Letter spacing). Secondary text size (SCALE_LABEL) moved from Size to Text: it sizes the smaller text, not the component.
Old line for reference: **Size** (Width, Scale, Label size, Height),
**Spacing** (Padding, Gap), **Text** (Weight, Letter spacing). Control ids, saved values, tiers unchanged;
old manifests using `"section": "type"` are read as Layout. The rest of this doc below is still a proposal.

(Original proposal follows.)

Status: proposal only. No code, labels or ids have changed. Once Rob approves it, this doc becomes the
naming source for every kind and replaces LABEL-RUBRIC rules 3, 5 and 6 and the naming examples in
NAMING-STANDARD.md.

Terms: **menu** = a dock accordion (Color, Interaction, …). **Submenu** = a titled card inside a menu.
**Variable** = one control. "Control" and "variable" mean the same thing.
Pro is designed first and shows everything. Mid and Free are subsets: they hide rows and never rename anything.

Kinds (ids): card, nav, hero, animated-background, list, button, modal, input.
Their plain names are Card, Menu bar, Banner, Background, List, Button, Popup and Text box (rubric rule 6).

---

## (a) Pro menus: final titles

| # | Menu | What it means | Why |
|---|------|---------------|-----|
| 1 | **Color** | The colour of each part | All colours live in one place. Every kind has colours. |
| 2 | **Interaction** | What happens when someone hovers, clicks, drags, taps or uses the keyboard | Reactions to people sit together. The section hides when a kind has none. |
| 3 | **Surface** | How solid, glowing, rounded or frosted the body looks | Covers the "finish" of the body that colour alone can't. |
| 4 | **Type** | Text size and style | All text settings sit together. Text colour stays in Color › Text. |
| 5 | **Motion** | How it moves on its own: speed, loop, feel, depth | All self-running movement sits in one menu. |
| 6 | **Layout** | The kind's own parts first, then size and spacing | Covers where things go and how big they are, with the kind's own parts on top. |

**Rate vs Motion: decided (t685u): merged into Motion.** Original text:
**Rate vs Motion: decision needed. Recommendation: merge Rate into Motion as the submenu "Timing".**
- Today, Rate holds Speed, Intensity and Seconds per loop. Intensity is not a rate. A user also has to look in two menus to change one movement.
- Merging gives 6 menus, and every speed/loop setting ends up in one place.
- Rob said on t590u: "keep the rate section the same for now". If Rate stays, rename it **Timing** and give it exactly the Motion › Timing submenu below. Everything else in this scheme stays the same.
- The ids stay the same either way. Only the `section` changes.

---

## (b) Submenus and variables per menu (Pro order)

How to read the tables:
- Tier: **F** = Free, Mid and Pro all have it. **M** = Mid and Pro. **P** = Pro only.
- **M\*** = proposed move from Pro to Mid. This would fill Mid to its 22 cap; see (e).
- **F-pick(kinds)** = one of that kind's 2 free picks.
- Kinds: **all 8**, or the kinds listed. This is a proposal built from blank-component.md §3.3 and the current kinds.json hide lists.
- Path = Menu › Submenu › Variable. The short name is what shows on the row.

### 1. Color
| Submenu | Variable (short) | Full label | Id | Tier | Kinds |
|---|---|---|---|---|---|
| **Body** | Border | Border colour | COLOR_BORDER | F | all 8 |
| | Fill | Fill colour | COLOR_FILL | F | all 8 |
| | Fill bottom | Fill bottom colour (fade) | COLOR_FILL_2 | P | card, hero, modal, animated-background |
| **Text** | Main | Main text colour | COLOR_TEXT | F | all 8 |
| | Secondary | Secondary text colour | COLOR_MUTED | M\* | all except button, animated-background |
| **Glow** | Glow | Glow colour | COLOR_GLOW | F | all 8 |
| **Accent** | Accent | Accent colour | COLOR_ACCENT | M\* | all 8 |

### 2. Interaction
| Submenu | Variable (short) | Full label | Id | Tier | Kinds |
|---|---|---|---|---|---|
| **Hover** | Reaction | Hover reaction | IX_HOVER | M | all 8 |
| | Lift height | Hover lift height | HOVER_LIFT (moved from Motion) | P | card, button, nav, hero, list |
| **Click & drag** | Click | Click reaction | IX_PRESS | M | all except animated-background, input |
| | Drag | Drag reaction | IX_DRAG | M | card, hero, list |
| **Touch & keyboard** | Touch | Touch reaction | IX_TOUCH | M | all 8 |
| | Keyboard | Keyboard highlight | IX_KEY | M | all 8 |

Interaction no longer needs a flip. Touch and Keyboard (both Mid) sit on the front, which fixes the current rule break where Mid controls are hidden on a flip back.

### 3. Surface
| Submenu | Variable (short) | Full label | Id | Tier | Kinds |
|---|---|---|---|---|---|
| **Opacity** | Fill | Fill opacity | OPACITY_FILL | M | all 8 |
| | Border | Border opacity | OPACITY_BORDER | M | all 8 |
| **Glow** | Strength | Glow strength | GLOW_STRENGTH | M, F-pick(card, nav, hero, animated-background, button, modal, input) | all 8 |
| **Corners** | Roundness | Corner roundness | RADIUS | M, F-pick(card, nav, list, button, modal, input) | all 8 |
| **Glass** | Blur | Background blur | BLUR | P | all 8 |

### 4. Type
| Submenu | Variable (short) | Full label | Id | Tier | Kinds |
|---|---|---|---|---|---|
| **Size** | Main | Main text size | SCALE_TEXT | M, F-pick(hero, list) | all 8 |
| | Secondary | Secondary text size | SCALE_LABEL | P | hero, list, input |
| **Style** | Weight | Text weight | WEIGHT | P | all except animated-background |
| | Letter spacing | Letter spacing | TRACKING | P | all except animated-background |

### 5. Motion (with Rate merged; if Rate is kept, "Timing" becomes the Rate/Timing menu)
| Submenu | Variable (short) | Full label | Id | Tier | Kinds |
|---|---|---|---|---|---|
| **Timing** | Speed | Speed | MOTION_SPEED | M, F-pick(animated-background) | all 8 |
| | Loop time | Seconds per loop | MOTION_CYCLE | P | animated-background |
| | Direction | Play direction | MOTION_DIRECTION | P | animated-background |
| **Movement** | Feel | Movement feel (Settle / Spring / Linear) | MOTION_EASING | M | all 8 |
| | Strength | Movement strength | MOTION_INTENSITY | P | card, hero, animated-background |
| | When idle | Move when idle (on/off) | IDLE | M\* | card, button, hero, animated-background |
| **Depth** | 3D strength | 3D depth strength | DEPTH_PERSPECTIVE | P | card, modal |

### 6. Layout
| Submenu | Variable (short) | Full label | Id | Tier | Kinds |
|---|---|---|---|---|---|
| **<Kind's own part>** (e.g. **Button**) | kind-only variables (e.g. Icon, Hover sheen, Sheen angle, Pulse ring, Letter case) | — | BTN_* etc. | per kind | that kind only |
| **Size** | Width | Width | SIZE_W | M | all except button, animated-background |
| | Height | Height | SIZE_H | P | card, hero, list, modal (proposed; no kind uses it yet) |
| **Spacing** | Inside | Inside space | SPACE_PAD | M\* | all 8 |
| | Between | Space between items | SPACE_GAP | M\* | all except animated-background |

**Totals:**
- 6 menus, 18 submenus (plus one kind-part submenu per kind) and 33 shared variables.
- Pro has 33. Mid has 17 today, or 22 with the M\* moves. Free has 6: Border, Fill, Main text and Glow, plus the kind's 2 picks.
- Six Pro variables currently have no visible effect on the blank template, because no CSS reads them. They are Fill bottom, Secondary text size, Loop time, Direction, 3D strength and Height. Making them work is build work and is not part of this doc.

---

## (c) Rules that make it work across menus
1. **One menu per kind of change.** The same 6 menus appear on every kind, always in the same order. When a kind has no variables for a menu, the menu is hidden, never renamed.
2. **A submenu is one sub-topic of the menu above it.** When the sub-topic is a part of the component, it uses a fixed part word: **Body, Text, Glow, Accent**. The same word means the same part in every menu: Color › Glow is the glow's colour and Surface › Glow is its strength. The only kind-specific submenu name is the kind's own part in Layout, which uses the kind's plain name.
3. **A variable names one knob inside its submenu.** Its short name makes sense on its own when you read the path, and it never repeats the menu or submenu word (Color › Text › Main, not Color › Text › Text colour). A submenu with only one variable shows that variable under the card title.
4. **One place per setting.** Each variable has exactly one home. Hover lift moves to Interaction › Hover, next to the hover reaction it belongs to. Strength (intensity) moves out of Rate into Motion › Movement.
5. **Same order everywhere.** Menus and submenus keep a fixed order. Inside a submenu the order is Free, then Mid, then Pro.
6. **Size caps.** A submenu holds 1–3 variables. 4–6 means 3 on the front and one "More" fold (this only happens in kind-part submenus). No flips are needed. If a flip is ever used, its back holds only Pro rows on the same topic.
7. **Tiers only subtract.** Pro shows everything. Mid hides Pro rows and Free hides Mid rows. A submenu that ends up empty hides, and so does an empty menu. Nothing is renamed by tier.
8. **Kinds only subtract.** A kind hides what it doesn't use (hide list) and adds only its own part submenu. A kind never renames shared menus, submenus or variables, so there are no per-kind colour group names.
9. **Ids never change.** Only label, short name, group and section move, through core.json or the manifest override whitelist. Saved settings are keyed by id, so they survive renames. The helix is not touched; it can keep its old names through its own overrides.
10. **Plain words only.** No modal, backdrop, field, scrim, padding, pointer, focus, easing, tracking, radius, Adv, Bg, "Fill 2" or "Effects" in anything the user sees.

---

## (d) Old name → new name

| Level | Old | New |
|---|---|---|
| Menu | Rate | merged into Motion as "Timing" (or the menu is renamed "Timing" if kept) |
| Submenu | Color › Card / Nav / Hero / Backdrop / List / Button / Modal / Field (per-kind colorGroup) | Color › **Body** (the same on every kind) |
| Submenu | Interaction › Pointer | Interaction › **Hover** + **Click & drag** |
| Submenu | Interaction › Touch & keys | Interaction › **Touch & keyboard** |
| Submenu | Surface › Shape | Surface › **Corners** |
| Submenu | Surface › Effects | Surface › **Glass** |
| Submenu | Motion › Loop | Motion › **Movement** |
| Submenu | Motion › Hover | removed (Lift → Interaction › Hover; Idle → Motion › Movement) |
| Submenu | Rate › Tempo (and "Tempo·Adv") | Motion › **Timing** |
| Variable | Fill (gradient end) / "Fill 2" | Fill bottom |
| Variable | Text (colour) | Main |
| Variable | Muted text / "Muted" | Secondary |
| Variable | On hover / "Hover" | Reaction |
| Variable | On press / "Press" | Click |
| Variable | On drag / "Drag" | Drag |
| Variable | Keyboard focus / "Focus" | Keyboard |
| Variable | Fill opacity / Border opacity | Fill / Border (under Opacity) |
| Variable | Glow strength / "Strength" | Strength (under Surface › Glow) |
| Variable | Corner radius / "Radius" | Roundness |
| Variable | Backdrop blur / "Blur" | Blur (under Glass; full label "Background blur") |
| Variable | Text size / "Text" | Main (under Type › Size) |
| Variable | Label size / "Label" | Secondary (under Type › Size) |
| Variable | Weight | Weight (no change) |
| Variable | Letter spacing / "Tracking" | Letter spacing |
| Variable | Speed | Speed (no change, moves to Motion › Timing) |
| Variable | Seconds per loop / "Loop" | Loop time |
| Variable | Direction | Direction (moves to Motion › Timing) |
| Variable | Easing | Feel |
| Variable | Intensity / "Glow / blob intensity" (template override) | Strength (Motion › Movement) |
| Variable | Idle animation / "Idle" | When idle |
| Variable | Perspective | 3D strength |
| Variable | Hover lift / "Lift" | Lift height (Interaction › Hover) |
| Variable | Width / Height | no change |
| Variable | Padding | Inside |
| Variable | Gap | Between |
| Kind name | Nav / Hero / Animated bg / Modal / Input | Menu bar / Banner / Background / Popup / Text box |

---

## (e) Not decided: needs Rob (max 5)
1. ~~**Rate:**~~ decided t685u: merged into Motion. Was: merge it into Motion › Timing (recommended), or keep it as its own menu renamed "Timing"? You said "keep the rate section the same for now" on t590u.
2. **Color body submenu name:** a fixed **Body** on every kind (recommended, no per-kind fixes), or the kind's plain name (Card, Button, Menu bar…)?
3. **Mid size:** move Secondary text, Accent, When idle, Inside and Between into Mid (22, the cap), or keep Mid at today's 17?
4. **Free picks per kind:** use the per-kind picks shown above (from blank-component.md §3.3), or keep Glow strength + Roundness on every kind as today?
5. **Kind picker:** should it live in the dock strip or the toolbar menu, and which tiers see it? This is needed before the blank-template build, not before the renames.

---

## Appendix: review of the docs (checklist, as of 72f3c0d)

Sources:
- A = blank-component.md
- R = blank-component review
- AN = COMPONENT-LAB-ANALYSIS-REFERENCE.md
- M = COMPONENT-LAB-REVIEW-MVP.md
- RD = README.md
- CL = CHANGELOG-blank-core.md
- N = NAMING-STANDARD.md
- LR/LA = LABEL-RUBRIC / LABEL-AUDIT
- CI = COMPONENT-IMPORT.md

**Applied (16):**
- 8 kinds with markup and frames (A §2.2)
- kind merge plus check_kinds (A §4.4)
- advanced flag only on Weight and Letter spacing (A §4.1)
- flip pairs keyed by section (A §3.1)
- kind's own parts first in Layout (A §2.3)
- Help text de-helixed (A §2.3)
- /api/new kind overrides (A §4.3)
- kind switch keeps tuned values (console only) (A §1.3)
- import checker, report only (CI)
- regression test harness (R)
- label rubric and audit written (LR/LA)
- Free→Mid→Pro order inside groups (RD)
- 1–3 variables per submenu on the template (M §8)
- Color redesign with no flips (CL)
- helix safety tag pre-blank-core
- wizard hook only (A §4.5, by design)

**Not applied (18):**
1. Boot into the blank template. The registry is still helix first and _template last (A §1.1).
2. Grouped toolbar menu with kind badges, cap and "More" (A §1.2).
3. Kind picker strip and "Save as +" chip (A §2.1).
4. Per-kind opt, free picks and defaults. kinds.json has none (A §3.3).
5. Six Pro variables are missing from the template and have no CSS (LA).
6. The 'Opacity' special case in foldSingle is still there (A §3.1, LA).
7. The single name "Blank template" is not used everywhere (LR 15).
8. Tier words still clash: the "Basic" star curation vs the README's "Base" vs Mid (LA, RD).
9. Plain kind names: Nav, Hero, Animated bg, Modal and Input are still shown (LR 6).
10. The 37 label mismatches from the audit (LA).
11. The checker does not enforce the size caps (M §8).
12. Header slide-down drawer and VIP blank-template icon (CL deferred).
13. Empty sandbox / chooser overlay (CL deferred).
14. Per-kind snapshots and stars (CL deferred).
15. Import install step (CI).
16. FAQ / Help page for tiers (RD post-MVP 5).
17. Wizard UI (AN, deferred).
18. Dedicated component section (AN, deferred).

**Conflicts (9):**
1. Colour body name: "Surface" or kind label (A) vs the painted element name (N) vs plain names (LR). This scheme proposes "Body".
2. The Interaction flip hides Mid controls on its back (RD tier rule).
3. Shape↔Effects pairs two unrelated topics (LR 10).
4. Glow is in both Color and Surface, and hover in both Interaction and Motion (LR 3). Resolved here by rules 2 and 4.
5. Rate holds Intensity, which is not a rate (LA).
6. Boot: A reorders the registry, R says change it in one place at the end, and RD says _template stays last.
7. N's example names (Nav, Field, Backdrop, ·Adv) vs the plain-word rule (LR 1, 4).
8. Free picks: per kind (A §3.3) vs the same on every kind (code).
9. Hide lists: A §3.3 vs kinds.json (input hides Speed vs Click; drag on hero, list and card).

**Needs Rob (10):**
- Rate merge (AN, t590u)
- Color body name
- Mid size
- free picks per kind
- kind picker place and tiers (R Q3)
- list cap 8/10/12 (AN)
- palette step on save-as (R Q4)
- tier names Free/Mid(Base)/Pro (AN)
- wizard Pro-only (AN)
- boot into blank template (R Q1; implied yes by "general / blank template")
