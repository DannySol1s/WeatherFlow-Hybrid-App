import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ForecastModule from './modules/Module_A/ForecastModule';
import StatsModule from './modules/Module_B/StatsModule';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/module-a" element={<ForecastModule />} />
        <Route path="/module-b" element={<StatsModule />} />
      </Routes>
    </Router>
  );
}

export default App;
