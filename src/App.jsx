import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AnimatedFavicon from './components/AnimatedFavicon';

export default function App() {
  return (
    <>
      <AnimatedFavicon />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </>
  );
}