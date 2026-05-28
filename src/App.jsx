// App.jsx
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AnimatedFavicon from './components/AnimatedFavicon';

export default function App() {
  return (
    <>
      <AnimatedFavicon />
      <Routes>
        <Route path="/" element={<HomePage initialPanel={null} />} />
        <Route path="/project" element={<HomePage initialPanel="projects" />} />
        <Route path="/blog" element={<HomePage initialPanel="blog" />} />
      </Routes>
    </>
  );
}