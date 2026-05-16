# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Hackathon Context
**Monad Blitz KL — May 16, 2026 · Taylor's University, Subang Jaya**

This is a hackathon project. Visual impact and a crash-free live demo matter as much as the code. Optimize for the 4-minute pitch.

---

## Chain & Deployment
- **Network:** Monad Testnet
- **Chain ID:** 10143
- **RPC:** https://testnet-rpc.monad.xyz
- **Explorer:** https://testnet.monadexplorer.com
- **Frontend deployment:** Vercel (auto-deploys on git push)

---

## Project context (current state)

Hardhat 3 Beta scaffold targeting Monad testnet. The toolchain is the modern Hardhat 3 stack — **ESM-only**, **`node:test` runner**, and **`viem`** (no ethers, no Mocha/Chai). Solidity tests are Foundry-compatible (`forge-std`). A frontend has not been added yet; when it is, follow the tech stack and UI rules below.

### Commands
- `npx hardhat test` — runs both Solidity and TypeScript test suites.
- `npx hardhat test solidity` — Foundry-style tests in `contracts/*.t.sol` only.
- `npx hardhat test nodejs` — `node:test` integration tests in `test/` only.
- `npx hardhat test nodejs --grep "<pattern>"` — run a single TS test by name pattern.
- `npx hardhat compile` — compile contracts (solc 0.8.28).
- `npx hardhat ignition deploy ignition/modules/Counter.ts` — deploy to an ephemeral simulated chain.
- `npx hardhat ignition deploy --network monad ignition/modules/Counter.ts` — deploy to Monad testnet; requires `PRIVATE_KEY` in `.env`.
- `npx hardhat run --network monad scripts/<script>.ts` — run an ad-hoc script.

### Architecture
- **`hardhat.config.ts`** — only one network is wired (`monad`). The Hardhat 3 `network.create()` API used in tests/scripts creates ephemeral in-process chains separate from this config; `monad` is only consulted for `--network monad` CLI invocations. Accounts are loaded from `process.env.PRIVATE_KEY` — the array is empty if unset, so write operations against `--network monad` will silently have no signer.
- **`contracts/`** holds Solidity sources side-by-side with their Foundry tests (`*.t.sol`). Foundry tests import `forge-std/Test.sol` and use `vm.expectRevert` etc.
- **`test/*.ts`** uses `node:test` + `viem`. The pattern is `const { viem } = await network.create();` at the top of `describe` to spin up a fresh simulated chain per file; do not assume a shared chain across files.
- **`ignition/modules/`** declarative deployment modules built with `@nomicfoundation/hardhat-ignition`. Modules use `m.contract` / `m.call` rather than imperative deploy scripts.
- **`scripts/send-op-tx.ts`** demonstrates the `chainType: "op"` simulated chain — note it references a `hardhatOp` network that isn't defined in the current config, so it requires config changes to run as-is.

### Conventions that matter
- **ESM only.** `package.json` has `"type": "module"`, `tsconfig.json` uses `module: node16`. Top-level `await` is used freely in tests and scripts — keep it.
- **viem, not ethers.** Use `viem.deployContract`, `viem.getPublicClient`, `viem.getWalletClients`, `viem.assertions.*`. Bigints (`1n`) are required for numeric on-chain values.
- **`.env` is gitignored** and supplies `PRIVATE_KEY` for the Monad deployer. `.env.example` is a UTF-16 / BOM file (Windows artifact); preserve its encoding if editing.

---

## Default Tech Stack (when adding the frontend)
- **Contracts:** Solidity + Hardhat 3 (TypeScript, already scaffolded)
- **Frontend:** Next.js (TypeScript) + Tailwind CSS
- **Web3:** wagmi + viem
- **Animations:** Framer Motion
- **Icons:** Lucide React

Install if not present:
```bash
npm install framer-motion lucide-react @tabler/icons-react
```

Smart contract dependency:
```bash
npm install @openzeppelin/contracts
```

---

## UI Philosophy — Non-Negotiable Rules

This project must look **world-class**. Every component should feel like it came from a top-tier product studio, not a hackathon. Judges form opinions in the first 10 seconds of seeing the demo. Make every pixel count.

### Core Aesthetic
- **Dark theme always** — base backgrounds: `#030309`, `#0a0a0f`, `#0f0f1a`
- **Monad purple accent palette:** `#7c3aed` → `#8b5cf6` → `#a78bfa` → `#c4b5fd`
- **Glassmorphism everywhere** — `backdrop-blur-xl`, `bg-white/5`, `border border-white/10`
- **Depth over flatness** — every screen must have at least 3 visual layers
- **Mesh gradients on hero sections** — animated, flowing, never static
- **Volumetric glow** — key elements emit soft purple light (`shadow-purple-500/30`)

### Typography Rules
- Headlines: `font-bold tracking-tight` — large, dominant, gradient text on heroes
- Gradient text: `bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent`
- Labels: `text-xs uppercase tracking-widest text-white/40`
- Body: `text-white/70` — never pure white for body copy
- Numbers/amounts: `text-4xl font-bold text-white` with purple tint

### Card Rules
```
rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl
hover:border-purple-500/40 hover:bg-white/8 transition-all duration-300
```

### Button Rules
```
Primary:   bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500
           hover:to-purple-500 rounded-xl px-6 py-3 font-semibold shadow-lg
           shadow-purple-500/25 hover:scale-105 transition-all duration-200

Secondary: border border-white/20 bg-white/5 hover:bg-white/10 rounded-xl
           backdrop-blur-sm hover:border-purple-500/50
```

### Input Rules
```
bg-white/5 border border-white/10 rounded-xl px-4 py-3
focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
focus:bg-white/8 transition-all duration-200 text-white
placeholder:text-white/30
```

---

## Advanced UI Patterns

Apply these intelligently depending on the component. Pick the ones that best serve the current UI being built — not all at once, but always reach for at least 3-4 per page.

### Cursor & Pointer Effects
- **Magnetic Hover** — buttons subtly pull toward cursor using onMouseMove + framer-motion transform
- **Cursor Spotlight** — radial gradient follows cursor, illuminating nearby content like a torch
- **Liquid Cursor Trails** — global cursor leaves fluid/particle wake as it moves
- **Cursor Warp Effects** — nearby elements distort slightly toward cursor position
- **Reactive Shadows** — card shadows shift dynamically based on cursor position relative to card
- **Shape-Shifting Cursor** — cursor morphs (circle → crosshair → pointer) based on interaction context

### Cards & Surfaces
- **Perspective Tilt Cards** — cards rotate on X/Y axis based on cursor (framer-motion rotateX/rotateY)
- **Reactive Glassmorphism** — glass panels with dynamic lighting that tracks mouse position
- **Holographic Cards** — iridescent shimmer/rainbow effect on card surfaces on hover
- **Hover Morph Cards** — cards subtly reshape (border-radius, scale, padding) on hover
- **Focus Spotlight UI** — hovered card glows while siblings dim using group-hover
- **Dynamic Focus Rings** — active elements emit animated purple ring pulse on focus
- **Reactive Borders** — borders animate (shimmer, flow, pulse) on hover or on-chain activity
- **Holographic UI** — semi-transparent floating panels with depth and refraction effects

### Backgrounds & Atmosphere
- **Mesh Gradients** — multi-point animated gradient backgrounds (CSS or canvas-based)
- **Volumetric Lighting UI** — atmospheric purple fog/glow layers behind primary content
- **Interactive Backgrounds** — background particles or mesh reacts to cursor movement
- **Interactive Noise Textures** — subtle animated grain overlay that shifts on interaction
- **Shader-Based UI** — WebGL gradient distortions for hero sections (canvas or Three.js)
- **Particle Navigation** — ambient floating particles throughout the app atmosphere
- **Data Particle Systems** — on-chain data visualized as flowing/connecting particles
- **Breathing Layouts** — subtle slow scale pulse on idle hero elements (makes it feel alive)

### Layout & Navigation
- **Floating Spatial Panels** — cards float with subtle independent parallax motion on scroll
- **Disappearing UI** — nav/controls fade in only on hover or scroll; invisible at rest
- **Dynamic Island UI** — floating adaptive pill (top-center) for wallet status and tx notifications
- **Split-Dimension UI** — foreground content and background move at different scroll speeds
- **Depth Mapping UI** — simulated parallax depth on hero sections (multiple layers)
- **Layered Transparency UI** — overlapping transparent panels at different blur/opacity levels
- **Orb Navigation** — circular orbit-style menu for secondary navigation
- **Command Palette UI** — Cmd+K opens smart command palette to control the whole app
- **Spatial Menus** — menus positioned with perceived depth, not flat dropdowns
- **Smart Dock UI** — bottom dock that predicts and surfaces likely next actions
- **Single-Element UI** — one component expands into a full workflow (e.g. button → full modal flow)

### Animations & Transitions
- **Fluid Page Transitions** — pages morph/dissolve instead of hard switching (Framer AnimatePresence)
- **Skeleton Morph Loading** — loading skeletons smoothly morph into real content (not just fade)
- **Smart Reveal Animations** — content reveals progressively on scroll (Framer whileInView)
- **Cinematic Transitions** — full-screen wipe, zoom, or portal transitions between major states
- **Morphing Components** — elements transform into other elements (button expands into modal)
- **Elastic Layouts** — sections stretch/compress with spring physics on state changes
- **Momentum Interfaces** — objects continue moving briefly after release (spring physics)
- **Physics-Based UI** — use spring configs in framer-motion for all enter/exit animations
- **Hinge Animations** — panels open like physical hinged objects
- **Folding Interfaces** — UI unfolds like paper or origami to reveal nested content
- **Portal Navigation** — major section transitions feel like stepping through a dimensional portal
- **Scroll Physics UI** — scroll movement has natural deceleration and rubber-band feedback
- **Elastic Scrolling** — rubber-band style feedback at scroll boundaries

### Typography & Text
- **Living Typography** — hero text reacts to cursor or staggers in letter by letter on load
- **Kinetic Typography** — key stats animate in with motion (slide up, fade, count-up numbers)
- **Scrollytelling UI** — scroll drives a narrative/story on the landing page
- **Adaptive Complexity UI** — simpler UI for new users, richer controls revealed for power users

### Data & Feedback
- **Living Data Visuals** — charts and numbers animate organically when values change
- **Adaptive Color Systems** — accents shift subtly per state: success=green tint, error=red tint, pending=amber
- **Microinteraction Systems** — every click, hover, tx confirmation, and state change has a tiny satisfying animation
- **Reactive Iconography** — icons animate based on state/context (loading spin, success checkmark bounce)
- **Gooey UI** — SVG feTurbulence + feDisplacementMap filter for liquid blob merge effects
- **Metaball Interfaces** — soft blobs merge and separate dynamically on interaction

### AI & Advanced Patterns
- **AI Copilot Panels** — if the project has AI, show a persistent intelligent sidebar assistant
- **Ambient AI Interface** — AI assists proactively and subtly in the background
- **Generative UI** — components that procedurally generate their own layout based on data
- **Intent-Aware UI** — interface adapts to detected user behavior patterns
- **Memory-Based UI** — UI remembers and surfaces previously used actions
- **Autonomous UI Agents** — independent AI-controlled interface modules
- **Conversational UI** — chat-based interaction mixed with direct manipulation
- **Neural Flow UI** — visual design mimics neural network connection structures

### Cinematic & Immersive
- **Immersive Fullscreen UI** — borderless cinematic interface for key interactions
- **Cinematic HUD** — game/film-inspired overlay interface for data display
- **Dreamscape UI** — surreal morphing environments during transitions
- **Infinite Canvas** — zoomable endless workspace for complex data exploration
- **Infinite Zoom UI** — users continuously zoom into nested layers of content
- **Layered Motion UI** — multiple animation depths creating realistic scene parallax

---

## Always-Present Page Elements

### Floating Navbar (always use this pattern)
```tsx
<nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50
                flex items-center gap-6 px-6 py-3 rounded-2xl
                bg-white/5 backdrop-blur-xl border border-white/10
                shadow-xl shadow-black/20">
```

### Hero Section (always start landing page with this)
```tsx
<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
  <div className="absolute inset-0 bg-[#030309]">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-500" />
  </div>
  <div className="relative z-10 text-center max-w-4xl px-6">
    <h1 className="text-6xl md:text-8xl font-bold tracking-tight
                   bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400
                   bg-clip-text text-transparent mb-6">
      Your Headline Here
    </h1>
  </div>
</section>
```

### Dynamic Island Wallet Status (always include)
```tsx
<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]
                flex items-center gap-3 px-4 py-2 rounded-full
                bg-black/80 backdrop-blur-xl border border-white/10
                shadow-2xl shadow-purple-500/10 transition-all duration-500">
  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
  <span className="text-sm text-white/80">0x1234...5678</span>
</div>
```

---

## Smart Contract Patterns (Monad-Optimized)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Always emit rich events — frontend subscribes to these
event ActionPerformed(address indexed user, uint256 amount, uint256 timestamp);
event StateChanged(uint256 indexed id, uint8 newState, uint256 timestamp);

// Always add comprehensive view functions for frontend reads
function getState() external view returns (...) {}
function getUserData(address user) external view returns (...) {}
```

---

## Monad Pitch Lines (use these in demo narration)
- "Monad's 10,000 TPS means this processes instantly — no waiting, no spinning loaders"
- "0.4 second block times make this feel indistinguishable from a Web2 app"
- "Parallel EVM execution means [specific thing] runs simultaneously without blocking"
- "Low fees make [micro-interactions / frequent transactions] actually viable for real users"
- "This couldn't exist on Ethereum — the latency would make it unusable"

---

## Code Quality Rules (always follow)
1. **No placeholders or TODOs** — write complete, working code every single time
2. **Mobile-first responsive** — always include `sm:` `md:` `lg:` breakpoints
3. **Loading states** — every contract call needs a visual loading indicator
4. **Error handling** — every try/catch shows a user-friendly toast notification
5. **Wallet guard** — protected pages check wallet connection and redirect if needed
6. **Small reusable components** — max ~100 lines per file, extract into `components/`
7. **TypeScript strict** — no `any` types, always type contract ABIs and return values
8. **Accessible** — meaningful aria-labels on all icon-only buttons

---

## What Makes Us Win
- **Visual impact in 10 seconds** — the UI must stop judges in their tracks
- **Live demo, no crashes** — test the full flow 3 times before presenting
- **Monad is essential** — answer "why couldn't this work on another chain?"
- **Real problem** — one sentence that makes anyone say "I've felt that before"
- **Tight 4-minute pitch:** Problem (20s) → Solution (20s) → Demo (90s) → Why Monad (20s) → Vision (10s)
