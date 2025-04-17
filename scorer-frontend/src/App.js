import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';  // Changed from Switch to Routes
import { CssBaseline, Container } from '@mui/material';
import MatchesPage from './components/MatchesPage';
import MatchDetail from './components/MatchDetail';
import AdminPanel from './components/AdminPanel';
import NavBar from './components/NavBar';

function App() {
  return (
    <Router>
      <CssBaseline />
      <NavBar />
      <Container maxWidth="lg">
        <Routes>  {/* Changed from Switch to Routes */}
          <Route path="/" exact element={<MatchesPage />} />  {/* Changed component to element */}
          <Route path="/match/:id" element={<MatchDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;