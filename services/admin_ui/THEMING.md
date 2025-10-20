# 🎨 Theming the FAM Admin UI

This UI was set up for easy theming. Here’s how to change the look fast.

## 1) Colors (CSS variables)
Edit `src/index.css` at the top:

```
:root {
  --primary: #c47b27;      /* main brand color */
  --primary-dark: #a1631f; /* hover */
  --secondary: #7a9e7e;    /* accent */
  --danger: #d64545;       /* errors */
  --wheat-50: #fbf7f1;     /* background */
  --wheat-100: #f6efe3;    /* panels */
  --wheat-200: #efe4cf;    /* borders */
  --cocoa-600: #5a4636;    /* text secondary */
  --cocoa-700: #4a3a2d;    /* headings */
  --cocoa-900: #2b2119;    /* text primary */
}
```

- Change these hex values to your brand colors and the whole UI updates.
- Buttons, navbar, tables, forms all reference these variables.

## 2) Fonts
Update `index.html` to swap fonts. Currently using Google Fonts Inter:

```
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Then in `src/index.css` body:
```
body { font-family: 'Inter', ... }
```

You can switch to `Poppins`, `Nunito`, etc. by changing both lines.

## 3) Logo / Favicon
- Replace `public/favicon.svg` with your own SVG or PNG
- If you add a logo file, you can import it in `src/App.jsx` and show it in the navbar.

## 4) Spacing & Radius
- Buttons, cards, inputs use consistent spacing (rem units) and `0.375rem` radius.
- Tweak globally in `.btn`, `.card`, `.form-group` inside `src/index.css`.

## 5) Status Colors
Change the badge colors in `src/index.css` under `/* Status Badge */`:
```
.status-pending { background:#fef3c7; color:#92400e; }
.status-confirmed { background:#fde68a; color:#92400e; }
.status-preparing { background:#bbf7d0; color:#166534; }
.status-dispatched { background:#e0e7ff; color:#4338ca; }
.status-delivered { background:#d1fae5; color:#065f46; }
```

## 6) Rebuild after changes
From project root:

```bash
# Rebuild just the UI
docker compose build admin_ui
# Restart UI container
docker compose up -d admin_ui
```

## 7) Quick ideas
- Add your bakery logo text in `App.jsx` nav-brand
- Use a hero banner image on the Orders page top
- Add subtle background texture to `body` (baking paper)

If you tell me your brand colors (hex codes) and a logo, I can wire them in for you. 🍞