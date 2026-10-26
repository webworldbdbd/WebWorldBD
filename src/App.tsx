import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { FloatingButtons } from './components/FloatingButtons';
import { Modals } from './components/Modals';
import { Home } from './pages/Home';
import { Services } from './pages/Services';
import { Contact } from './pages/Contact';

export const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleOpenSidebar = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  const handleOpenModal = (modalType: string) => setActiveModal(modalType);
  const handleCloseModal = () => setActiveModal(null);

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      {/* Background floating light blue particles */}
      <div className="particles-bg">
        <div className="particle w-3 h-3 top-12 left-[10%]" style={{ animationDelay: '0s' }} />
        <div className="particle w-4 h-4 top-1/4 left-[85%]" style={{ animationDelay: '2s' }} />
        <div className="particle w-2 h-2 top-1/2 left-[20%]" style={{ animationDelay: '4s' }} />
        <div className="particle w-5 h-5 top-3/4 left-[70%]" style={{ animationDelay: '1s' }} />
        <div className="particle w-3 h-3 top-[90%] left-[40%]" style={{ animationDelay: '3s' }} />
      </div>

      <Header onOpenSidebar={handleOpenSidebar} />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onOpenModal={handleOpenModal}
      />

      <main className="relative z-10 flex-grow">
        <Routes>
          <Route path="/" element={<Home onOpenModal={handleOpenModal} />} />
          <Route path="/services" element={<Services onOpenModal={handleOpenModal} />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>

      <Footer onOpenModal={handleOpenModal} />

      <FloatingButtons />

      <Modals activeModal={activeModal} onClose={handleCloseModal} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
