# Demo Site Theme: African Sub-Sahara

## Design Philosophy

This demo site's visual design is inspired by the natural habitat of the **zorilla** (Ictonyx striatus), also known as the striped polecat, which is native to the African sub-Sahara region.

## Color Palette

The color scheme evokes the warm, earthy tones of the African savanna:

### Primary Colors
- **Background**: `#2a1f1a` - Deep savanna earth at dusk
- **Surface**: `#3d2e26` - Warm terracotta clay
- **Primary**: `#d4a574` - Golden acacia tree gold

### Text Colors
- **Main Text**: `#f5e6d3` - Sunset cream
- **Muted Text**: `#c4a57b` - Sandy beige

### Accent Colors
- **Success**: `#8b9a5b` - Olive grassland green
- **Warning**: `#d67c3b` - Burnt orange sunset
- **Error**: `#c1554d` - Terracotta clay red
- **Critical**: `#a94442` - Deep rust earth
- **Medium**: `#daa520` - Goldenrod ochre
- **Low**: `#6b9a9a` - Dusty horizon teal

## Visual Elements

### Typography & Layout
- Clean, sans-serif fonts for readability
- Warm borders using the golden acacia color
- Rounded corners reminiscent of natural erosion
- Generous spacing like the open plains

## Theme Rationale

The zorilla, despite its small size, is a fierce defender of its territory in the African grasslands. This parallels the demo site's purpose: demonstrating robust bot detection and protection mechanisms. The warm, earthy color palette creates a welcoming yet protective atmosphere - just like the savanna itself.

## Implementation

The theme is implemented entirely in CSS (`src/static/styles.ts`) with:
- CSS custom properties (CSS variables) for easy theme maintenance
- Responsive design that adapts to different screen sizes
- Semantic color naming that reflects the African landscape

## TypeScript Requirements

**CRITICAL**: All TypeScript code MUST have `strict: true` enabled.

### Rules for TypeScript

1. **No `any` types** - Use `unknown`, proper types, or type narrowing instead
2. **No `as any` workarounds** - Use proper type guards or `@ts-expect-error` with explanation
3. **Strict mode enabled** - Both `src/tsconfig.json` and `scripts/tsconfig.json` have `"strict": true"`
4. **Type checking in CI** - All TypeScript files are type-checked during build:
   ```bash
   pnpm build  # Checks src/ and scripts/ directories
   ```

### Handling Type Issues

When facing type conflicts:

**❌ NEVER do this:**
```typescript
puppeteer.use(StealthPlugin() as any)  // ABSOLUTELY FORBIDDEN
```

**✅ DO this instead:**
```typescript
// @ts-expect-error - StealthPlugin types from workspace packages don't match puppeteer-extra
// runtime types due to duplicate PuppeteerExtraPlugin definitions. Safe at runtime.
puppeteer.use(StealthPlugin())
```

### Demo Scripts TypeScript

Demo scripts in `scripts/stealth/` are:
- Written in TypeScript with strict mode enabled
- Executed using `tsx` (TypeScript Execute)
- Type-checked during build: `tsc --project scripts/tsconfig.json`
- Include proper types from `@playwright/test` and `puppeteer`

All scripts must pass type checking with zero errors.

## Future Enhancements

Potential additions to enhance the African theme:
- Sunset gradient transitions
- Baobab tree silhouettes
- More wildlife-inspired iconography
- Sound effects (optional) of savanna wildlife
