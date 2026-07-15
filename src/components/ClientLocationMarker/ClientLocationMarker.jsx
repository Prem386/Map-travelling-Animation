import "./ClientLocationMarker.css";

function ClientLocationMarker({ x, y, city, index }) {
  // ponytail: render nested groups for translation separation and future GSAP animation
  return (
    <g transform={`translate(${x}, ${y})`} data-city={city} data-index={index}>
      <g className="client-location-marker">
        <g className="client-location-pulse" />
        <circle className="client-location-ring" r={10} />
        <circle className="client-location-dot" r={5} />
        <g className="client-location-icon" />
        <g className="client-location-label" />
      </g>
    </g>
  );
}

export default ClientLocationMarker;
