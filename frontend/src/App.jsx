import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import NovelPage from './pages/NovelPage.jsx';
import ChapterPage from './pages/ChapterPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/novels" element={<BrowsePage />} />
        <Route path="/novels/:slug" element={<NovelPage />} />
        <Route path="/novels/:slug/:chapterSlug" element={<ChapterPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
