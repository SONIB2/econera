# Immersive construction world

The root route is a fullscreen, state-driven WebGL experience. The logo starts the entrance. A single Three.js scene contains the exterior, hinged door, and interior. Camera movement crosses the open door before settling inside. Select the masonry geometry or use the keyboard and touch control to move toward the wall. The material panel changes the illustrative texture and shows approved Supabase stock filtered by masonry subtype. Listing and quotation links use the existing protected routes.

Stable scenes are addressable through `/?scene=portal`, `/?scene=house`, and `/?scene=masonry&tipi=hollow`. The browser Back button restores previous scenes. Escape and on-screen controls return to the previous area. Reduced motion uses the same states with immediate camera and door changes. The catalogue and Masonry Studio remain usable without WebGL. The workspace remains at `/inventari`. The previous scrolling site and pavilion links remain accessible through `/tregimi`.

## Implementation and art scope

Three.js was selected for a single scene with a guided camera and simple material picking. The renderer loads after entry. Capped pixel ratio, procedural 256px textures, and rendering only when needed limit the runtime cost. No R3F, Drei, GSAP or WebGPU layer is needed for this vertical slice. Noomo's published case study informed the use of an intentional threshold and continuous camera movement. [Noomo reference](https://noomoagency.com/insights/noomo-valentime-immersive-storytelling).

The house, surrounding geometry, and canvas textures are original procedural work in the repository. No third-party models or textures were used. They are prototype art with real geometry, lighting, shadows, and material changes. The next art pass needs a detailed authored architectural model, believable landscaping, calibrated surface maps and lighting, and performance testing on physical phones. Blender was unavailable here. The texture variants illustrate material families. They are neither photographs of listings nor evidence for construction suitability.

The verified live commerce boundary is quotation submission and receipt in the existing workspace. Additional spatial material systems, projects and procurement, supplier offers, reservations, orders, carriers, payment integrations, and production AI are later milestones. The world work does not add those integrations or change existing migrations or access policies.

Verification passed for lint, TypeScript, the production build, seven PostgreSQL and validation tests, 18 desktop and emulated mobile browser tests, and two live local Supabase workflows. Browser tests click the door geometry, observe the opening and entering states, focus masonry, and verify browser Back, keyboard controls, reduced motion, and the no-WebGL fallback. Axe reported no violations in the intro, portal, house, or masonry views in a separate live desktop scan.
