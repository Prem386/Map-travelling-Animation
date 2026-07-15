import { useState } from "react";
import IndiaMap from "../IndiaMap/IndiaMap";
import "./CoordinatePicker.css";

function CoordinatePicker() {
  const [coords, setCoords] = useState({ x: null, y: null });
  const [copied, setCopied] = useState(false);

  const handleClick = (e) => {
    let clientX = e.clientX;
    let clientY = e.clientY;
    let svg = e.currentTarget.querySelector("svg");

    if (!svg) {
      const obj = e.currentTarget.querySelector("object");
      if (obj && obj.contentDocument) {
        svg = obj.contentDocument.querySelector("svg");
        // ponytail: object viewport coordinates offset from main window
        const objRect = obj.getBoundingClientRect();
        clientX -= objRect.left;
        clientY -= objRect.top;
      }
    }

    if (!svg || typeof svg.getScreenCTM !== "function") return;

    const pt = typeof DOMPoint !== "undefined"
      ? new DOMPoint(clientX, clientY)
      : svg.createSVGPoint();
    if (typeof DOMPoint === "undefined") {
      pt.x = clientX;
      pt.y = clientY;
    }

    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const svgP = pt.matrixTransform(ctm.inverse());

    if (svgP.x >= 0 && svgP.x <= 1000 && svgP.y >= 0 && svgP.y <= 1000) {
      setCoords({ x: svgP.x.toFixed(2), y: svgP.y.toFixed(2) });
    }
  };

  const formattedObj = `{\n  city: "",\n  x: ${coords.x ?? null},\n  y: ${coords.y ?? null},\n}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedObj);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="coordinate-picker" onClick={handleClick}>
      <div className="coordinate-picker-display" onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: "8px", borderBottom: "1px solid rgba(56, 189, 248, 0.3)", paddingBottom: "4px" }}>
          Client Location Coordinate
        </div>
        <div>X: {coords.x ?? "-"}</div>
        <div>Y: {coords.y ?? "-"}</div>
        <pre className="coordinate-object">{formattedObj}</pre>
        <button className="copy-button" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <IndiaMap />
    </div>
  );
}

export default CoordinatePicker;
