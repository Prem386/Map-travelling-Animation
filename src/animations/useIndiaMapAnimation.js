import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const clamp = (min, max, val) => Math.min(Math.max(val, min), max);

const ANIMATION = {
  marker: {
    duration: 0.8,
    ease: "back.out(1.7)",
  },

  connection: {
    duration: 1.2,
    ease: "power2.inOut",
  },

  camera: {
    duration: 2.0,
    scale: 2.5,
    ease: "power2.inOut",
  },

  overlap: {
    connectionToCamera: 0.2,
    cameraToMarker: 0.25,
  },
};

export default function useIndiaMapAnimation(svgRef, clientLocations) {
  const timelineRef = useRef();

  useGSAP(
    () => {
      const svg = svgRef.current;
      if (!svg || !clientLocations || clientLocations.length === 0) return;

      // ponytail: find root container for ScrollTrigger trigger element
      const container = svg.closest(".india-map-container");

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      console.log("prefersReducedMotion:", prefersReducedMotion);

      const viewport = svg.querySelector("#viewport");

      console.log("GSAP timeline created");
      const masterTimeline = gsap.timeline({
        paused: true,
        defaults: {
          ease: "power2.out",
        },
        onUpdate: () => {
          console.log("Timeline progress update:", masterTimeline.progress().toFixed(2));
        },
        onComplete: () => {
          console.log("Timeline completed");
        },
      });

      // Set initial states to prevent flashes before timeline starts
      gsap.set(svg, { opacity: 0 });
      gsap.set(viewport, { scale: 1, x: 0, y: 0, transformOrigin: "0 0" });
      console.log("Viewport transform before timeline starts: attribute =", viewport ? viewport.getAttribute("transform") : null, "style =", viewport ? viewport.style.transform : null);

      // Hide all client location markers initially at timeline start
      clientLocations.forEach((loc) => {
        const marker = svg.querySelector(`[data-city="${loc.city}"] .client-location-marker`);
        if (marker) {
          masterTimeline.set(marker, { scale: 0, opacity: 0 }, 0);
        }
      });

      // 1. Map fade-in
      masterTimeline.to(svg, { opacity: 1, duration: 1.5 });

      // Build dynamic sequenced animation timeline
      clientLocations.forEach((loc, index) => {
        const marker = svg.querySelector(`[data-city="${loc.city}"] .client-location-marker`);

        if (index === 0) {
          // 2. Camera zoom to the first client location
          if (viewport) {
            const scale = 2.0; // ponytail: lazy default max zoom for first location
            const tx = 500 - scale * loc.x;
            const ty = 500 - scale * loc.y;

            masterTimeline.to(
              viewport,
              {
                x: tx,
                y: ty,
                scale: scale,
                duration: ANIMATION.camera.duration,
                ease: ANIMATION.camera.ease,
                onComplete: () => {
                  console.log("Viewport transform after intro camera tween completes: attribute =", viewport.getAttribute("transform"), "style =", viewport.style.transform);
                },
              }
            );
          }

          // 3. Reveal first marker
          if (marker) {
            masterTimeline.fromTo(
              marker,
              { scale: 0, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: ANIMATION.marker.duration,
                ease: ANIMATION.marker.ease,
                transformOrigin: "0px 0px",
              },
              "-=" + ANIMATION.overlap.cameraToMarker
            );
          }
        } else {
          // Client index > 0: Draw Connection -> Move Camera -> Reveal Marker
          const prevLoc = clientLocations[index - 1];

          // 1. Draw connection line
          const connectionPath = svg.querySelector(
            `.client-connection[data-from="${prevLoc.id}"][data-to="${loc.id}"]`
          );
          if (connectionPath) {
            const length = connectionPath.getTotalLength();
            masterTimeline.set(connectionPath, {
              strokeDasharray: length,
              strokeDashoffset: length,
            });

            masterTimeline.to(connectionPath, {
              strokeDashoffset: 0,
              duration: ANIMATION.connection.duration,
              ease: ANIMATION.connection.ease,
            });
          }

          // 2. Animate viewport center toward current client
          if (viewport) {
            const dx = loc.x - prevLoc.x;
            const dy = loc.y - prevLoc.y;
            const travelDistance = Math.sqrt(dx * dx + dy * dy);

            // ponytail: linear mapping from travelDistance to scale. Max travel (500) -> 1.4, Min travel (0) -> 2.0.
            const maxTravelDistance = 500;
            const scaleRange = 2.0 - 1.4;
            const rawScale = 2.0 - (travelDistance / maxTravelDistance) * scaleRange;
            const scale = clamp(1.4, 2.0, rawScale);

            const tx = 500 - scale * loc.x;
            const ty = 500 - scale * loc.y;

            masterTimeline.to(
              viewport,
              {
                x: tx,
                y: ty,
                scale: scale,
                transformOrigin: "0 0",
                duration: ANIMATION.camera.duration,
                ease: ANIMATION.camera.ease,
              },
              "<" + ANIMATION.overlap.connectionToCamera // Start panning shortly after connection animation starts
            );
          }

          // 3. Reveal current marker
          if (marker) {
            masterTimeline.fromTo(
              marker,
              { scale: 0, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: ANIMATION.marker.duration,
                ease: ANIMATION.marker.ease,
                transformOrigin: "0px 0px",
              },
              "-=" + ANIMATION.overlap.cameraToMarker
            );
          }
        }
      });

      console.log("Timeline total duration:", masterTimeline.duration());

      timelineRef.current = masterTimeline;

      // Reduced motion: skip to final state immediately
      if (prefersReducedMotion) {
        masterTimeline.progress(1, true);
        return;
      }

      // ScrollTrigger: play once when container enters viewport
      ScrollTrigger.create({
        trigger: container || svg,
        start: "top 70%",
        end: "bottom center",
        once: true,
        onEnter: () => {
          console.log("ScrollTrigger onEnter fires");
          console.log("Timeline progress immediately before play():", masterTimeline.progress());
          masterTimeline.play();
          console.log("Timeline progress immediately after play():", masterTimeline.progress());
        },
      });
    },
    { dependencies: [clientLocations], scope: svgRef }
  );

  return {
    timeline: timelineRef,
  };
}


