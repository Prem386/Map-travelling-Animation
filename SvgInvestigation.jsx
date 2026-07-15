// File: /tmp/investigate_svg.js
// Investigation script to analyze SVG path and marker coordinates

import { useEffect, useRef } from 'react';

function SvgInvestigation() {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const clientLocations = [
      { id: 'client1', x: 200, y: 200, city: 'Mumbai' },
      { id: 'client2', x: 400, y: 300, city: 'Delhi' },
      { id: 'client3', x: 600, y: 250, city: 'Bangalore' }
    ];
    
    // Initialize markers
    clientLocations.forEach(loc => {
      const marker = svg.querySelector(`[data-city="${loc.city}"] .client-location-marker`);
      if (marker) {
        marker.setAttribute('transform', `translate(${loc.x}, ${loc.y})`);
      }
    });
    
    // Wait for rendering
    setTimeout(() => {
      console.log('=== SVG DOM Investigation ===');
      
      // Step 1: Query rendered SVG path
      const connectionPath = svg.querySelector('.client-connection');
      if (!connectionPath) {
        console.log('No connection path found');
        return;
      }
      
      // Step 2: Compute path points
      const point0 = connectionPath.getPointAtLength(0);
      const totalLength = connectionPath.getTotalLength();
      const pointEnd = connectionPath.getPointAtLength(totalLength);
      
      console.log('Path Analysis:');
      console.log('  - Path d:', connectionPath.getAttribute('d'));
      console.log('  - Total length:', totalLength.toFixed(2));
      console.log('  - Point at length 0:', point0);
      console.log('  - Point at total length:', pointEnd);
      
      // Step 3: Log against clientLocation coordinates
      const clientLocationsArray = clientLocations;
      console.log('\nClient Location Comparison:');
      
      clientLocationsArray.forEach((loc, index) => {
        console.log(`  Client ${index+1} (${loc.city}): x=${loc.x}, y=${loc.y}`);
        
        // Find corresponding marker group
        const markerGroup = svg.querySelector(`[data-city="${loc.city}"] .client-location-marker`);
        if (markerGroup) {
          // Step 4: Query marker group CTM values
          const ctm = markerGroup.getCTM();
          const screenCTM = markerGroup.getScreenCTM();
          
          console.log('    - Marker CTM:', ctm);
          console.log('    - Screen CTM:', screenCTM);
          
          // Calculate actual rendered position
          if (ctm) {
            const point = svg.createSVGPoint();
            point.x = loc.x;
            point.y = loc.y;
            const transformed = point.matrixTransform(ctm);
            console.log('    - Transformed position:', transformed);
          }
          
          // Check marker transform origin
          const computedStyle = window.getComputedStyle(markerGroup);
          console.log('    - Marker transform-origin:', computedStyle.transformOrigin);
          console.log('    - Marker transform:', computedStyle.transform);
        }
      });
      
      // Step 5: Analyze viewport transform
      const viewport = svg.querySelector('#viewport');
      if (viewport) {
        console.log('\nViewport Analysis:');
        const viewportCTM = viewport.getCTM();
        console.log('  - Viewport CTM:', viewportCTM);
        
        const viewportScreenCTM = viewport.getScreenCTM();
        console.log('  - Viewport Screen CTM:', viewportScreenCTM);
        
        // Check GSAP transform
        const computedTransform = window.getComputedStyle(viewport);
        console.log('  - Viewport computed transform:', computedTransform.transform);
        console.log('  - Viewport transform-origin:', computedTransform.transformOrigin);
      }
      
      // Step 6: Check path geometry vs expected coordinates
      console.log('\nGeometry Analysis:');
      
      clientLocationsArray.forEach((loc, index) => {
        console.log(`\nClient ${index+1} (${loc.city}):`);
        console.log('  - Expected coordinates:', {x: loc.x, y: loc.y});
        
        // Get the point from SVG path at this location's position
        const pathLengthAtLoc = (index / (clientLocationsArray.length - 1)) * totalLength;
        const pathPoint = connectionPath.getPointAtLength(pathLengthAtLoc);
        console.log('  - Path point at location:', pathPoint);
        console.log('  - Difference from expected:', {
          x: pathPoint.x - loc.x,
          y: pathPoint.y - loc.y
        });
      });
      
      console.log('\n=== Analysis Complete ===');
    }, 100);
    
  }, []);
  
  return (
    <div style={{ padding: '20px' }}>
      <h3>SVG Investigation Component</h3>
      <p>Open console to see detailed analysis</p>
      <svg 
        ref={svgRef}
        width="1000" 
        height="1000" 
        viewBox="0 0 1000 1000"
        style={{ border: '1px solid #ccc' }}
      >
        <defs>
          <style>{`
            .client-connection {
              stroke: #ff3366;
              stroke-width: 3px;
              stroke-linecap: round;
              fill: none;
            }
            .client-location-marker {
              transform-origin: 0 0;
              pointer-events: auto;
            }
            .client-location-ring {
              fill: none;
              stroke: #ffffff;
              stroke-width: 2px;
              filter: drop-shadow(0 0 3px rgba(255, 51, 102, 0.8));
            }
            .client-location-dot {
              fill: #ff3366;
              stroke: #ffffff;
              stroke-width: 1px;
            }
          `}</style>
        </defs>
        <g id="viewport">
          <g id="features">
            <path 
              className="client-connection" 
              data-from="client1" 
              data-to="client2"
              d="M200 200 Q400 250 400 300"
            />
            <path 
              className="client-connection" 
              data-from="client2" 
              data-to="client3"
              d="M400 300 Q600 325 600 250"
            />
          </g>
        </g>
        <g transform="translate(200, 200)" data-city="Mumbai">
          <g className="client-location-marker">
            <circle className="client-location-ring" r={10} />
            <circle className="client-location-dot" r={5} />
          </g>
        </g>
        <g transform="translate(400, 300)" data-city="Delhi">
          <g className="client-location-marker">
            <circle className="client-location-ring" r={10} />
            <circle className="client-location-dot" r={5} />
          </g>
        </g>
        <g transform="translate(600, 250)" data-city="Bangalore">
          <g className="client-location-marker">
            <circle className="client-location-ring" r={10} />
            <circle className="client-location-dot" r={5} />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default SvgInvestigation;