"""Regenerate lab/icons.js from the npm package @material-design-icons/svg.

Usage (the package lives in a scratch dir, never in the lab or the repo):
    npm install --prefix /workspace/mdi-scratch @material-design-icons/svg
    python tools/build_icons.py /workspace/mdi-scratch/node_modules/@material-design-icons/svg

To add an icon: add one line to ICONS below (lab name -> Material icon name), run this,
then use svg('name') in lab.js. Only the icons listed here are stored (not all 2,164).
"""
import json, os, re, sys

# lab name -> Material Icons name (https://mui.com/material-ui/material-icons/)
ICONS = {
    # rail categories
    'color': 'palette', 'interact': 'touch_app', 'surface': 'layers', 'type': 'text_fields',
    'motion': 'animation', 'rate': 'speed', 'layout': 'grid_view',
    # rail actions + settings
    'plus': 'add', 'toolbar': 'start', 'gear': 'settings',
    # dock stage-1 nested icon, edge handle, help
    'dock': 'view_sidebar', 'handle': 'chevron_left', 'help': 'help_outline',
    # dock + header + nav
    'close': 'close', 'back': 'chevron_left', 'chev': 'chevron_right',
    'dots': 'more_vert', 'user': 'person', 'check': 'check',
    # footer
    'diff': 'difference', 'code': 'integration_instructions', 'undo': 'undo',
    'reset': 'restart_alt',
    # playback
    'play': 'play_arrow', 'pause': 'pause',
    # Pro sections menu (⋮)
    'expand': 'unfold_more', 'collapse': 'unfold_less', 'remember': 'history',
    # controls
    'star': 'star_border', 'starOn': 'star', 'sig': 'auto_awesome',
    # Settings › Rail order rows
    'grip': 'drag_indicator', 'up': 'keyboard_arrow_up', 'down': 'keyboard_arrow_down',
    'eye': 'visibility', 'eyeOff': 'visibility_off',
}
# icons that always use one style (the "on" star is solid in every style)
FIXED = {'starOn': 'filled'}
STYLES = ['outlined', 'filled', 'round', 'sharp']

def body(src, style, name):
    s = open(os.path.join(src, style, name + '.svg')).read()
    vb = re.search(r'viewBox="([^"]+)"', s).group(1)
    inner = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', s, flags=re.S).strip()
    return vb, inner

def main(src):
    lines = []
    for k, mi in ICONS.items():
        styles = [FIXED[k]] if k in FIXED else STYLES
        out = {}
        vb0 = None
        for st in styles:
            vb, inner = body(src, st, mi)
            vb0 = vb0 or vb
            out[st] = inner
        entry = {'mi': mi, 'vb': vb0}
        if k in FIXED: entry['fixed'] = FIXED[k]
        entry['s'] = out
        lines.append('    ' + json.dumps(k) + ': ' + json.dumps(entry, ensure_ascii=False, separators=(',', ':')) + ',')
    ver = json.load(open(os.path.join(src, 'package.json')))['version']
    head = open(os.path.join(os.path.dirname(__file__), 'icons.head.js')).read().replace('{VER}', ver)
    js = head + '\n'.join(lines).rstrip(',') + '\n  };\n' + open(os.path.join(os.path.dirname(__file__), 'icons.tail.js')).read()
    dst = os.path.join(os.path.dirname(__file__), '..', 'lab', 'icons.js')
    open(dst, 'w').write(js)
    print('wrote', os.path.normpath(dst), len(ICONS), 'icons,', len(js), 'bytes')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '/workspace/mdi-scratch/node_modules/@material-design-icons/svg')
