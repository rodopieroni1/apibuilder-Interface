import Router from "./router";
import Navigation from "./components/commons/Navigation";
import 'animate.css'
function App() {
  return (
    <div className="text-text bg-bg grid grid-cols-12 h-screen">
      <Navigation/>
      <Router/>
    </div>
  );
}

export default App;

