import React, { useState } from "react";
import Navbar from "./components/Navbar";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainPage from "./pages/MainPage";
import LandingPage from "./pages/LandingPage";

const App = () => {
  
  const [uploadedImages, setUploadedImages] = useState([]); 
  const [artisanData, setArtisanData] = useState(null);

  const updateArtisanData = (data) => {
    setArtisanData(data);
  };

  return (
    <Router>
      <div>
        <div className="bg-container"></div>
        <Navbar />
        <div className="pt-20 px-4">
          <Routes>
            <Route
              path="/"
              element={
                <MainPage
                  updateUploadedImages={setUploadedImages}
                  updateArtisanData={updateArtisanData}
                  uploadedImages={uploadedImages}
                />
              }
            />
            <Route
              path="/landing"
              element={
                <LandingPage
                  uploadedImages={uploadedImages}
                  artisanData={artisanData}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
