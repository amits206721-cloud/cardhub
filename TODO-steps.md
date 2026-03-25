# CardHub Unified Card Rendering Fix - TODO Steps

## Plan Summary
✅ Single data structure: {backgroundColor, backgroundImage, elements:[]}
✅ Single renderCard in editor.js, referenced globally
✅ Remove all texts/bgColor/bgImage usage
✅ PX positioning everywhere
✅ container.style backgrounds (not parent)
✅ Aspect-ratio 3/4 everywhere

## Step-by-Step Implementation

### Phase 1: Core JS Fixes [P0]
- [✅] main.js: Replace renderCard with spec exact match
- [✅] editor.js: Fix renderCard bg to container.style  
- [✅] main.js: Keep auto-render data-state canvases
- [✅] editor.js: Confirm window.cardData structure correct

### Phase 2: CSS Layout [P1]
- [✅] styles.css: .card-canvas width:100% max-width:320px aspect 3/4
- [✅] styles.css: Remove .card-compact height:200px

### Phase 3: HTML Templates [P2]
- [✅] profile.html: data-state fallback to new format
- [✅] templates_gallery.html: Convert Jinja texts→elements array

### Phase 4: Backend [P3]
- [✅] app.py: state.get('elements', []) instead of texts

### Phase 5: Test & Verify [P4]
- [ ] Visit templates_gallery → all previews unified
- [ ] Profile → saved cards preview correctly  
- [ ] Editor → preview updates live, drag works, save→profile preview matches
- [ ] No console errors, no empty previews

Progress: 0/13 complete

