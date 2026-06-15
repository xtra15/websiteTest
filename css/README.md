# CSS

## Load order

`index.html` loads CSS in this order:

1. `css/variables.css` — theme tokens and design variables.
2. `css/base.css` — global body, canvas, loading screen, glass panels, background layers.
3. `css/layout.css` — app shell layout, toolbar/header/control positioning, body layout states.
4. `css/components.css` — imports component modules in order:
   `buttons.css`, `toolbar.css`, `modals.css`, `forms.css`, `settings.css`, `points.css`, `hud.css`, `toast.css`, `logs.css`, `laws.css`, `help.css`.
5. `css/responsive.css` — mobile overrides only.

## File ownership

- `variables.css` — CSS variables for colors, fonts, spacing, radius, blur, safe areas.
- `base.css` — body, canvas, loading screen, glass panels, background/noise layers, reduced-motion.
- `layout.css` — header, controls, toolbar, layout variants, spacer helpers.
- `buttons.css` — buttons, icon buttons, tool/theme buttons, button size/margin helpers.
- `toolbar.css` — tool options, plus button, tool manager rows and drag state.
- `modals.css` — popup modals, bottom sheets, overlays, modal inputs.
- `forms.css` — solver options, switches, range/number inputs, inline notes.
- `settings.css` — settings accordions, theme grid, layout cards, settings rows.
- `points.css` — active point list rows, badges, lock controls, empty state.
- `hud.css` — debug HUD.
- `toast.css` — toast notification.
- `logs.css` — dev log entries.
- `laws.css` — laws review cards.
- `help.css` — help modal cards.
- `responsive.css` — small-screen overrides.

## Dynamic classes and runtime states

JS/runtime adds or toggles these classes:

- Layout/theme: `layout-classic`, `layout-split`, `layout-onehand`, `low-power`, `theme-btn.active`, `extra-themes.active`.
- Shell/modals: `toolbar.active`, `modal-overlay.active`, `custom-popup.active`, `bottom-sheet.active`, `accordion-item.open`.
- Buttons/selection: `solver-opt.active`, `tool-opt.selected`, `tool-manager-item.dragging`, `tool-toggle-btn.off`, `layout-card.selected`.
- Visibility/state: `toast.show`, `control-btn.hidden`, `point-item.locked`.

Runtime display toggles are also used for: `debug-hud`, `loading-screen`, `liquid-mesh`, `liquid-noise`, input modal sub-containers, solver lock controls, and generated solver rows.

## Inline style rule

Avoid inline styles. Use CSS classes and helper classes for spacing and typography, for example:

- Spacing: `spacer-12`, `spacer-16`, `spacer-20`, `button-margin-bottom-8`, `button-margin-bottom-12`, `button-margin-top-bottom-12`.
- Typography/layout helpers: `inline-note`, `inline-note--section`, `inline-note--compact`, `input-width-sm`, `input-width-md`, `input-width-lg`, `button-full`, `button-compact`, `settings-value`.

If a helper is missing, add it to the owning CSS file instead of adding another inline style.

## Adding a new component style

1. Put the style in the closest existing module: buttons, toolbar, modals, forms, settings, points, etc.
2. If the component does not fit an existing module, create a focused CSS file and import it from `components.css` in the manifest order.
3. Use BEM-style names: `.new-card`, `.new-card__title`, `.new-card--compact`.
4. Use existing variables and helper classes before adding one-off rules.
5. Put mobile-only changes in `responsive.css`, not in the component file.

## Intentional inline style exceptions

Keep these inline styles documented and limited:

- Theme dot color data on `.theme-dot` elements, including solid colors and gradients.
- JS-toggled `display:none` containers for modal sub-panels such as angle/orbit/point/solver input containers and solver lock sections.
