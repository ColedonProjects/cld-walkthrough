# Coledon Walkthrough

Reusable, Next.js-friendly walkthrough overlay that highlights elements, locks the UI behind an animated blur, and guides users through multi-page onboarding steps.

---

## Features

- JSON-driven steps (category, title, description, URL, highlight selector, tooltip position).
- Automatic URL tracking with optional `autoStart` flag.
- Programmatic restart via DOM events (`emitWalkthroughStart` helper included).
- Spotlight overlay that clones the highlighted element so the UI remains crisp above the blur.
- Dismiss / Previous / Next/Complete controls with keyboard-focus-friendly styling.

---

## Installation (after publishing)

```bash
npm install cld-walkthrough
# or
yarn add cld-walkthrough
```

Until the package is published you can add it to a Next.js project via a local path (e.g. using `npm link` or `workspace:`).

---

## Quick Start

1. **Create your steps JSON**

   ```jsonc
   // walkthrough-steps.json
   {
     "steps": [
       {
         "stepCategory": "Getting Started",
         "pageUrl": "/settings/global",
         "stepName": "Open Global Settings",
         "stepDescription": "Configure global branding and defaults.",
         "highlightElement": "global-settings-tab",
         "tooltipPosition": "right"
       }
     ]
   }
   ```

2. **Add `data-highlight` attributes**

   ```tsx
   <Container data-highlight="global-settings-tab" value="general">
     General
   </Container>
   ```

3. **Render the component**

   ```tsx
   import stepsJson from "./walkthrough-steps.json";
   import { Walkthrough } from "cld-walkthrough";

   export default function AppLayout({ children }: { children: React.ReactNode }) {
     return (
       <>
         {children}
         <Walkthrough
           steps={stepsJson.steps}
           autoStart={!!session.user?.first_login}
           dismissedStorageKey={`walkthrough-${session.user?.id}`}
         />
       </>
     );
   }
   ```

4. **Restart on demand**

   ```tsx
   import { emitWalkthroughStart } from "cld-walkthrough";

   const handleClick = () => emitWalkthroughStart(0); // optional start index
   ```

5. **Import the styles (one time)**

   ```tsx
   import "cld-walkthrough/dist/styles/walkthrough.css";
   ```

---

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `steps` | `WalkthroughStep[]` | Required list of steps. |
| `autoStart` | `boolean` | Automatically show the walkthrough when the component mounts (skipped if previously dismissed). |
| `initialStep` | `number` | Optional starting index (default `0`). |
| `dismissedStorageKey` | `string` | Local-storage key used to remember dismissal (`cld-walkthrough-dismissed` by default). |
| `startEventName` | `string` | Custom DOM event name for programmatic restarts (`cld-walkthrough:start` by default). |
| `onDismiss` | `() => void` | Called when the user clicks “Dismiss” or reaches the final step. |
| `onStepChange` | `(index, step) => void` | Called whenever the active step changes. |

---

## Step Schema

```ts
type WalkthroughTooltipPosition = "top" | "right" | "bottom" | "left";

interface WalkthroughStep {
  stepCategory: string;
  pageUrl: string;
  stepName: string;
  stepDescription: string;
  highlightElement: string; // matches data-highlight attribute
  tooltipPosition: WalkthroughTooltipPosition;
}
```

---

## Additional Tips

- The overlay locks pointer events to ensure users can only interact via the tooltip controls.
- Each step’s `pageUrl` should match the Next.js route (including critical query params). The walkthrough automatically advances when the URL matches the next step.
- When building long forms, wrap the target element in a div with a distinct background so the cloned highlight looks consistent.
- Use `emitWalkthroughStart(stepIndex)` anywhere (e.g., help menus) to replay the guide.

---

## Local Development

1. `npm install`
2. `npm run build` – type-checks and emits `dist/`.
3. Link the package into another app (`npm link ../cld-walkthrough`) to verify the integration.

---

## License & Attribution

This package is distributed under the MIT License. You’re free to extend or redistribute it, but please include a credit such as:

> Built with the Coledon Walkthrough (<https://www.coledon.co.za>)

That keeps the original author acknowledged while allowing the community to build on top of the package.

---

Happy guiding! 🚀
