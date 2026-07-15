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
    ease: "power2.inOut",
    overviewScale: 1.0,
    minScale: 1.4,
    maxScale: 2.0,
    viewportCenter: 500,
    maxTravelDistance: 500,
  },

  overlap: {
    connectionToCamera: 0.2,
    cameraToMarker: 0.25,
  },
};

// ponytail: calculate camera viewport transform based on travel distance
const getCameraState = (loc, prevLoc) => {
  const dx = prevLoc ? loc.x - prevLoc.x : 0;
  const dy = prevLoc ? loc.y - prevLoc.y : 0;
  const travelDistance = Math.sqrt(dx * dx + dy * dy);

  // ponytail: linear mapping from travelDistance to scale. Max travel -> min scale, Min travel -> max scale.
  const maxTravelDistance = ANIMATION.camera.maxTravelDistance;
  const scaleRange = ANIMATION.camera.maxScale - ANIMATION.camera.minScale;
  const rawScale = ANIMATION.camera.maxScale - (travelDistance / maxTravelDistance) * scaleRange;
  const scale = clamp(ANIMATION.camera.minScale, ANIMATION.camera.maxScale, rawScale);

  return {
    x: ANIMATION.camera.viewportCenter - scale * loc.x,
    y: ANIMATION.camera.viewportCenter - scale * loc.y,
    scale,
  };
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
      gsap.set(viewport, { scale: ANIMATION.camera.overviewScale, x: 0, y: 0, transformOrigin: "0 0" });
      console.log("Viewport transform before timeline starts: attribute =", viewport ? viewport.getAttribute("transform") : null, "style =", viewport ? viewport.style.transform : null);

      // Hide all client connection paths initially before timeline starts
      const connectionPaths = svg.querySelectorAll(".client-connection");
      connectionPaths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
      });

      // Hide all client location markers initially at timeline start
      clientLocations.forEach((loc, i) => {
        const marker = svg.querySelector(`[data-index="${i}"] .client-location-marker`) || svg.querySelector(`[data-city="${loc.city}"] .client-location-marker`);
        if (marker) {
          masterTimeline.set(marker, { scale: 0, opacity: 0 }, 0);
        }
      });

      // 1. Map fade-in
      masterTimeline.to(svg, { opacity: 1, duration: 1.5 });

      // Build intro
      const firstLoc = clientLocations[0];
      const firstMarker = svg.querySelector(`[data-index="0"] .client-location-marker`) || svg.querySelector(`[data-city="${firstLoc.city}"] .client-location-marker`);

      // 2. Camera zoom to the first client location
      if (viewport) {
        const { x, y, scale } = getCameraState(firstLoc);

        masterTimeline.to(
          viewport,
          {
            x: x,
            y: y,
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
      if (firstMarker) {
        masterTimeline.fromTo(
          firstMarker,
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

      // Build travel sequence
      for (let i = 1; i < clientLocations.length; i++) {
        const loc = clientLocations[i];
        const prevLoc = clientLocations[i - 1];
        const marker = svg.querySelector(`[data-index="${i}"] .client-location-marker`) || svg.querySelector(`[data-city="${loc.city}"] .client-location-marker`);

        // 1. Draw connection line
        const connectionPath = svg.querySelector(
          `.client-connection[data-from-index="${i - 1}"][data-to-index="${i}"]`
        ) || svg.querySelector(
          `.client-connection[data-from="${prevLoc.id || i - 1}"][data-to="${loc.id || i}"]`
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
          const { x, y, scale } = getCameraState(loc, prevLoc);

          masterTimeline.to(
            viewport,
            {
              x: x,
              y: y,
              scale: scale,
              transformOrigin: "0 0",
              duration: ANIMATION.camera.duration,
              ease: ANIMATION.camera.ease,
            },
            "<" + ANIMATION.overlap.connectionToCamera
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

      // ponytail: ending sequence to restore overview viewport scale/position and hold
      if (viewport) {
        masterTimeline.to(
          viewport,
          {
            x: 0,
            y: 0,
            scale: ANIMATION.camera.overviewScale,
            duration: ANIMATION.camera.duration,
            ease: ANIMATION.camera.ease,
          },
          "+=1.0"
        );

        masterTimeline.to({}, { duration: 1.5 });
      }

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


