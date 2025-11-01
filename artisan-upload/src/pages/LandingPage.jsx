import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import StorySection from "../components/StorySection";
import PhotoSection from "../components/PhotosSection";
import ContactSection from "../components/ContactSection";

const LandingPage = ({ uploadedImages, artisanData }) => {
  const location = useLocation();
  const [displayData, setDisplayData] = useState(null);

  useEffect(() => {
    // Data  which we get from the navigation state
    const stateData = location.state || {};
    const backendResponse = stateData.backendResponse;
    const contactData = stateData.artisanData || artisanData;
    const images = stateData.uploadedImages || uploadedImages;

    console.log("LandingPage received:", {
      backendResponse,
      contactData,
      images,
    });

    // demo data
    const fallbackData = {
      artisanName: "Kriti Creations",
      tagline: "HANDMADE | ECO-FRIENDLY | HERITAGE",
      ctaText: "Explore art pieces",
      aboutTxt:
        "This is where we describe the artisan's journey, craftsmanship, and unique values. The artisan creates beautiful, handmade products that capture heritage and culture.",
      storyTxt:
        "In a quiet village surrounded by bamboo groves, Aarav, a skilled artisan, learned the ancient craft of bamboo weaving from his father. With each piece he creates—whether it's a basket, mat, or chair—Aarav honors the tradition passed down through generations.",
      images: [
        "https://via.placeholder.com/200",
        "https://via.placeholder.com/200",
        "https://via.placeholder.com/200",
      ],
    };

    // Mappiing the backend to  get the response
    const data = {
      artisanName:
        backendResponse?.artisanName ||
        contactData?.artisanName ||
        fallbackData.artisanName,
      tagline: backendResponse?.tagline || fallbackData.tagline,
      ctaText: fallbackData.ctaText,
      aboutTxt:
        backendResponse?.aboutTxt ||
        backendResponse?.about ||
        fallbackData.aboutTxt,
      storyTxt:
        backendResponse?.storyTxt ||
        backendResponse?.story ||
        fallbackData.storyTxt,
      images:
        images && images.length > 0
          ? images.map((img) => URL.createObjectURL(img))
          : fallbackData.images,
      contactData: contactData,
    };

    setDisplayData(data);
  }, [location, artisanData, uploadedImages]);

  if (!displayData) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin inline-block w-12 h-12 border-4 border-[#6b8e23] border-t-transparent rounded-full"></div>
        <p className="mt-4 text-lg text-[#3e2723]">Loading your landing page...</p>
      </div>
    );
  }

  return (
    <div className="main">
      <HeroSection
        artisanName={displayData.artisanName}
        tagline={displayData.tagline}
        ctaText={displayData.ctaText}
      />
      <AboutSection aboutTxt={displayData.aboutTxt} />
      <StorySection storyTxt={displayData.storyTxt} />
      <PhotoSection images={displayData.images} />
      <ContactSection
        artisanName={displayData.contactData?.artisanName || displayData.artisanName}
        phoneNum={displayData.contactData?.phoneNum}
        email={displayData.contactData?.email}
        shopAddress={displayData.contactData?.shopAddress}
      />
    </div>
  );
};

export default LandingPage;
