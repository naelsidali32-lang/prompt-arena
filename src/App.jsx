import { BrowserRouter, Routes, Route } from "react-router-dom";
import HostScreen from "./pages/HostScreen";
import PlayerScreen from "./pages/PlayerScreen";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HostScreen />} />
        <Route path="/play" element={<PlayerScreen />} />
      </Routes>
    </BrowserRouter>
  );
}