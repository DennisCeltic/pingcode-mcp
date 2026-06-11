## canvas
- viewBox: 0 0 1280 720
- format: PPT 16:9

## colors
- bg: #F8FAFC
- bg_secondary: #FFFFFF
- primary: #2563EB
- accent: #F59E0B
- secondary_accent: #7C3AED
- text: #1E293B
- text_secondary: #64748B
- text_tertiary: #94A3B8
- border: #E2E8F0
- success: #10B981
- warning: #EF4444

## typography
- font_family: "Microsoft YaHei", Arial, sans-serif
- code_family: Consolas, "Courier New", monospace
- body: 18
- title: 32
- subtitle: 24
- annotation: 14
- cover_title: 48
- hero_number: 56
- chart_label: 13

## icons
- library: chunk-filled
- inventory: target, bolt, shield, users, chart-bar, lightbulb, cog, check, clock, clipboard, server, book, flag

## images

## page_rhythm
- P01: anchor
- P02: breathing
- P03: dense
- P04: dense
- P05: dense
- P06: breathing
- P07: dense
- P08: anchor

## page_layouts

## page_charts
- P03: gantt_chart
- P07: kpi_cards

## forbidden
- Mixing icon libraries
- rgba()
- `<style>`, `class`, `<foreignObject>`, `textPath`, `@font-face`, `<animate*>`, `<script>`, `<iframe>`, `<symbol>`+`<use>`
- `<g opacity>` (set opacity on each child element individually)
- HTML named entities in text (`&nbsp;`, `&mdash;`, `&copy;`, `&ndash;`, `&reg;`, `&hellip;`, `&bull;` …) — write as raw Unicode
