import "./App.css";
import IndiaMap from "./components/IndiaMap/IndiaMap";
import { clientLocations } from "./data/clientLocations";

function App() {
  // ponytail: render the presentational map component with client locations data
  return (
    <div className="app">
      <IndiaMap clientLocations={clientLocations} />
    </div>
  );
}

export default App;