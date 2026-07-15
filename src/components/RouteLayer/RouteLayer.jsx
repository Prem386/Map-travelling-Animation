import "./RouteLayer.css";

function RouteLayer({ clientLocations = [] }) {
  if (clientLocations.length < 2) {
    return null;
  }

  return (
    <g className="route-layer">
      {clientLocations.slice(0, -1).map((p1, i) => {
        const p2 = clientLocations[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const offset = Math.min(distance * 0.18, 90);
        const cx = midX;
        const cy = midY - offset;
        const from = p1;
        const to = p2;

        // ponytail: simple automatic control point offset, tweak later if custom paths needed
        return (
          <path
            key={`${p1.id}-${p2.id}`}
            className="client-connection"
            data-from={from.id}
            data-to={to.id}
            d={`M ${p1.x} ${p1.y}
Q ${cx} ${cy}
  ${p2.x} ${p2.y}`}
            stroke="currentColor"
            fill="none"
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
}

export default RouteLayer;

