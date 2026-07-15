import "./App.css";
import IndiaMap from "./components/IndiaMap/IndiaMap";
import CoordinatePicker from "./components/CoordinatePicker/CoordinatePicker";
import { clientLocations } from "./data/clientLocations";

function App() {
  return (
    <div className="app">
      {/* <CoordinatePicker /> */}
      <IndiaMap clientLocations={clientLocations} />
    </div>
  );
}

export default App;