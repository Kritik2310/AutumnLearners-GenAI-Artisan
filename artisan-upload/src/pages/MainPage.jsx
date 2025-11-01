import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "../components/ImageUpload";
import AudioInput from "../components/AudioUpload";
import ContactUpload from "../components/ContactUpload";

const MainPage = ({ updateUploadedImages, updateArtisanData }) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [artisanData, setArtisanData] = useState(null);
  const [backendResponse, setBackendResponse] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = (files) => {
    console.log("Uploaded images:", files);
    setUploadedImages(files); 
    updateUploadedImages(files);
  };

  const handleAudioUpload = (audio) => {
    console.log("Uploaded audio file:", audio);
    setAudioFile(audio);
  };

  const handleBackendResponse = (response) => {
    console.log("Backend AI response received:", response);
    setBackendResponse(response);
    setIsProcessing(false);
  };

  const handleContactSubmit = (data) => {
    console.log("Contact data submitted:", data);
    setArtisanData(data);
    updateArtisanData(data);
  };

  const handleSubmit = async () => {
    if (!backendResponse) {
      alert("Please upload and process an audio file first!");
      return;
    }
    if (!artisanData) {
      alert("Please submit your contact details!");
      return;
    }
    if (!uploadedImages || uploadedImages.length === 0) {
      alert("Please upload at least one product image!");
      return;
    }

    console.log("All data collected, navigating to landing page...");
    console.log("Backend Response:", backendResponse);
    console.log("Artisan Data:", artisanData);
    console.log("Images:", uploadedImages);

    // Navigate to landing page 
    navigate("/landing", {
      state: {
        backendResponse: backendResponse,
        artisanData: artisanData,
        uploadedImages: uploadedImages,
      },
    });
  };

  return (
    <div className="main-content">
      <h2 className="text-3xl font-serif text-center text-[#3e2723]">
        Welcome to Artisan Upload Page
      </h2>
      <p className="mt-4 text-lg text-center text-[#3e2723]">
        Follow these steps to let us evolve your story virtually...
      </p>


      <div className="mt-6 flex justify-center gap-4">
        <div className={`px-4 py-2 rounded-full ${uploadedImages.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
          {uploadedImages.length > 0 ? '✓' : '1'} Images
        </div>
        <div className={`px-4 py-2 rounded-full ${backendResponse ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
          {backendResponse ? '✓' : '2'} Audio
        </div>
        <div className={`px-4 py-2 rounded-full ${artisanData ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
          {artisanData ? '✓' : '3'} Contact
        </div>
      </div>

      <div className="mt-8">
        {/* Step 1: Upload Images */}
        <div className="step-box">
          <h3 className="text-2xl font-semibold text-[#3e2723] text-center">
            <i className="fas fa-camera-retro mr-2"></i>
            Step 1: Add your Photos
          </h3>
          <p className="mt-2 text-lg text-[#3e2723] text-center">
            Upload images of your products to showcase your work.
          </p>
          <ImageUpload onImageUpload={handleImageUpload} />
          <div className="step-text">
            Add photos that carve out your creativity and grab user attention
          </div>
        </div>

        {/* Step 2: Upload Audio */}
        <div className="step-box">
          <h3 className="text-2xl font-semibold text-[#3e2723] mt-6 text-center">
            <i className="fas fa-microphone-alt mr-2"></i>
            Step 2: Add Your Voice
          </h3>
          <p className="mt-2 text-lg text-[#3e2723] text-center">
            Record or upload a voice note explaining your craftsmanship.
          </p>
          <AudioInput 
            onBackendResponse={handleBackendResponse}
            setIsProcessing={setIsProcessing}
          />
          {backendResponse && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-lg text-center">
              <p className="text-green-800 font-semibold">
                ✓ Audio processed successfully! AI has generated your story.
              </p>
            </div>
          )}
          <div className="step-text">
            Record your voice and explain points and USPs about your business for us to make sales easy
          </div>
        </div>

        {/* Step 3: Contact Details */}
        <div className="step-box">
          <h3 className="text-2xl font-semibold text-[#3e2723] mt-6 text-center">
            <i className="fas fa-phone-alt text-dark-brown mr-2"></i>
            Step 3: Define your contact details
          </h3>
          <p className="mt-2 text-lg text-[#3e2723] text-center">
            Provide your details to contact you and visit you.
          </p>
          <ContactUpload onSubmit={handleContactSubmit} />
          <div className="step-text">
            Define all your details to contact you easily!
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className={`
            mt-8 py-3 px-8 rounded-full items-center mx-auto block text-lg font-semibold
            ${isProcessing 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'bg-dark-brown text-yellow-100 hover:bg-[#6b8e23] transition-all shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isProcessing ? "Processing..." : "Let's get started! →"}
        </button>
      </div>
    </div>
  );
};

export default MainPage;
