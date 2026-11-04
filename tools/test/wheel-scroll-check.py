# Manual browser check (Rob t691u): wheel over a knob, slider, fader or tempo jog must scroll the dock and never change a value.
# Serve the repo on a spare port (e.g. python3 -m http.server 5193), then: python3 tools/test/wheel-scroll-check.py (needs playwright + Chrome).
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=b.new_page(viewport={'width':1600,'height':900})
  pg.goto('http://localhost:5193/?reset'); pg.wait_for_timeout(2500)
  pg.evaluate("()=>{window.__wp=[];addEventListener('wheel',e=>__wp.push(e.defaultPrevented),{passive:true})}")
  pg.evaluate("()=>{__lab.setTier('pro');__lab.openDock();}"); pg.wait_for_timeout(800)
  def scrolls(): return pg.evaluate("()=>[...document.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+5&&/(auto|scroll)/.test(getComputedStyle(e).overflowY)).map(e=>[e.className.slice(0,20),e.scrollTop,e.scrollHeight-e.clientHeight])")
  for sec,sel,name in [('Style','.page svg .dial-rotor','knob'),('Layout','input[type=range]','slider'),('Layout','[class*=fader]','fader'),('Motion','.xdj-jog','tempo jog')]:
    pg.locator('text=/^'+sec+'$/').first.click(); pg.wait_for_timeout(700)
    loc=pg.locator(sel).locator('visible=true').first
    if not loc.count(): print(name,'not found'); continue
    loc.evaluate("e=>e.scrollIntoView({block:'center'})"); pg.wait_for_timeout(300)
    bb=loc.bounding_box()
    print(name, loc.evaluate("e=>e.className+' inPage:'+!!e.closest('.page')"), bb)
    P0=pg.evaluate("()=>JSON.stringify(__lab.state.P)"); s0=scrolls()
    pg.mouse.move(bb['x']+bb['width']/2,bb['y']+bb['height']/2)
    pg.evaluate('()=>{__wp=[]}')
    for d in (300,300,-300,-300,-300,300): pg.mouse.wheel(0,d); pg.wait_for_timeout(200); print('  ',name,d,scrolls())
    pg.wait_for_timeout(400)
    print(name,'value unchanged:',P0==pg.evaluate("()=>JSON.stringify(__lab.state.P)"),'prevented:',pg.evaluate('()=>__wp'))
  b.close()
