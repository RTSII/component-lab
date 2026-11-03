# Label rubric (one standard for every menu, subcard and control name)

Branch `feat/blank-core`, written Nov 3, 2026 (ET) as a read-only audit. Nothing is renamed yet.
It applies to the **blank template and all 8 kinds first**. The helix follows it later, or keeps its own names.
The audit of the current labels against these rules is in [LABEL-AUDIT.md](LABEL-AUDIT.md).

How to read a name: **Section › Subcard › Control**, e.g. `Color › Button › Border`.

## Rules

1. **Names come from what the user sees and changes.** A subcard label is a sub-topic of its parent
   accordion title, and a control label is one part of its subcard. Don't put developer words in labels
   people see: no modal, backdrop, field, scrim, padding, pointer, focus, easing.
   *Source: Rob t656u / t660u; docs/NAMING-STANDARD.md lines 3-4 ("every subcard, group and menu name
   says what it controls").*
2. **The path must read as plain words with no repeats.** `Color › Text › Main` is right and
   `Color › Text › Text` is wrong. A control label names its part, not the parent again. A card that holds
   only one control may simply show the control under the card title.
   *Source: Rob t660u ("matching them to top/above"); NAMING-STANDARD.md line 42 ("Labels name the
   parameter in the component's terms").*
3. **One topic, one place.** A feature lives in one section, and no two subcards share a name or meaning.
   Today Glow is split between Color › Glow and Surface › Glow, and hover between Interaction and Motion › Hover.
   *Source: COMPONENT-LAB-ANALYSIS-REFERENCE.md §1.2 lines 70-71 (fade split across two sections, "two
   Glow cards").*
4. **No generic, catch-all or shortened names.** Not allowed: Misc, Other, Options, a catch-all "Effects",
   "Adv", "Bg", "Fill 2".
   *Source: NAMING-STANDARD.md line 17; rule 1.*
5. **The accordion titles are a fixed set.** Color, Interaction, Surface, Type, Motion, Rate, Layout, in
   that order. A component's own controls go **first inside Layout**, under the name of the component part
   they change (e.g. `Button`). Merging Rate into Motion is still Rob's open decision.
   *Source: lab/lab.js `CATS` lines 126-134; components/_core/core.json `sectionOrder` (the 8th entry,
   "component", lives inside Layout); ANALYSIS §4 line 240; blank-component.md §2.3 lines 98-99;
   NAMING-STANDARD.md lines 14, 26-27.*
6. **Each kind has one plain name, used everywhere.** It goes on the picker, the + New tiles, the kind strip
   and the Color body subcard. Proposed names, waiting on Rob's OK: Card, Button, Menu bar, Banner, List,
   Popup, Text box, Background.
   *Source: blank-component.md §2.3 line 97 and §4.1.2 line 191 (Color › "Card" must follow the kind);
   NAMING-STANDARD.md line 10; North t659u list.*
7. **Labels can change, ids never do.** Labels are set per component through `core.override.<ID>.label` /
   `short`. Ids are UPPER_SNAKE PROPERTY_TARGET, core ids are reserved, extras are noun-first, and a renamed
   id needs an `aliases` entry. Saved values are keyed by id, so renaming a label is always safe.
   *Source: README.md line 121; ANALYSIS §3.3 lines 165-167; NAMING-STANDARD.md lines 32-41.*
8. **Short labels must stand alone.** Pro rows show `short`, while Base shows `label`. The short label has to
   make sense under its subcard and can't equal another subcard's name. For example, the short `Loop` on
   Seconds per loop clashes with the Motion › Loop subcard.
   *Source: lab/controls.js line 107 (compact rows show `short`); derived from rule 2.*
9. **Item caps per subcard.** 1-3 controls show inline, and the card never shows "More (1)". 4-6 controls
   show the 2-3 main ones plus one fold. 7 or more use range folds (More 4-6, More 7-9) or split into two
   subcards. In Pro the flip back is the fold.
   *Source: COMPONENT-LAB-REVIEW-MVP.md §8 lines 532-538; README.md line 434 (future item 6);
   REVIEW-MVP §9 line 542.*
10. **Flip cards hold two halves of one topic.** The back is named after its own topic, or `<front> (more)`
    when it is the same topic in more depth. Two unrelated subcards never share one card.
    *Source: NAMING-STANDARD.md lines 13, 15; blank-component.md §3.1 lines 132-142.*
11. **Pro comes first, and Mid and Free are cut from it.** Design the complete Pro set first: every
    control, label and subcard, in final order. Then build Mid by keeping some of those Pro rows, and Free
    by keeping some of the Mid rows. Never design upward from Free. A lower tier never renames, regroups or
    reorders anything. It just shows fewer rows of the same Pro layout. Inside every card the order is
    Free rows, then Mid, then Pro. Free and Mid rows never sit on a flip back, so Pro never hides what a
    lower tier shows.
    *Source: Rob via North (Nov 3, 2026 steering); README.md line 96; core.json `tierOrder` + `freeRule`;
    ANALYSIS §3.2 line 161 and §1.3 (b).*
12. **Tier budget.** Pro = everything. Mid ≤ 22. Free = 6 (the 4 core colours + 2 free picks chosen for
    each kind).
    *Source: README.md lines 82, 102; ANALYSIS §3.6 checklist item 7; blank-component.md §3.3 table
    (per-kind freePicks).*
13. **General first, never one component.** Code and help text never key on one component's ids, group names
    or wording, so no helix text and no hard-coded group names in code.
    *Source: ANALYSIS §3.1 line 131 ("the helix was the de-facto rubric"); README.md line 123;
    blank-component.md §2.3 lines 100-101; Rob t660u.*
14. **Cards hold only titles, buttons and controls.** Explanations go in Help / FAQ, not inside menu cards.
    *Source: REVIEW-MVP §6 lines 517-520; README.md line 433; Rob t652u ("remove the descriptive text").*
15. **Lists in menus have a cap, and each thing has one name.** The component list shows up to N items, then
    `More (N)…`. Aragon proposes N = 10, and Rob hasn't picked between 8, 10 and 12. The blank template is
    always called "Blank template", never also "Blank component".
    *Source: blank-component.md §1.2 lines 48-52; ANALYSIS P2 line 291 and lines 373-375.*

## Pro-complete set (the master list; Mid and Free are columns cut from it)

The full table, with all 33 core + optional controls in final Pro order, current and proposed labels,
Mid / Free columns and status, is section 0 of [LABEL-AUDIT.md](LABEL-AUDIT.md). In short:
Pro = 33 rows across 7 sections and 18 subcards. Mid keeps 17 of them (card kind). Free keeps 6:
Border, Fill, Text, Glow colour, Glow strength and Corner radius.

## Checks before any rename (for each kind)

- Read every `Section › Subcard › Control` path aloud. It should use plain words, repeat no word and
  contain no developer terms (rules 1-2).
- Each subcard has a unique name and covers one topic (3-4). It holds no more than 3 inline controls, or
  else a fold (9).
- Each flip card covers one topic (10). No Free or Mid control sits on a back (11).
- Start from the Pro table. Mid and Free are only ✔ marks on it, never a separate layout (11).
- Budget is Free 6 / Mid ≤ 22 (12), checked by `tools/check-components.py`.
