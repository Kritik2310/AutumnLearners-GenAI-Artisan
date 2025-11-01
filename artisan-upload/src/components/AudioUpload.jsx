import React, { useState, useEffect, useRef } from "react";
import Wavesurfer from "wavesurfer.js";

const AudioInput = ({ onBackendResponse, setIsProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);

  useEffect(() => {
    if (waveformRef.current && !waveSurferRef.current) {
      waveSurferRef.current = Wavesurfer.create({
        container: waveformRef.current,
        waveColor: "#6b8e23",
        progressColor: "#3e2723",
        height: 100,
        barWidth: 2,
        barRadius: 3,
      });
    }
    return () => {
      if (waveSurferRef.current) waveSurferRef.current.destroy();
    };
  }, []);

  const uploadAudioToBackend = async (audioFile) => {
    const formData = new FormData();
    formData.append("audio_file", audioFile);

    setIsLoading(true);
    if (setIsProcessing) setIsProcessing(true);

    try {
      const response = await fetch("http://localhost:5000/process-audio-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Backend response:", result);

      // Passing data to the main page
      if (onBackendResponse) {
        onBackendResponse(result);
      }

      alert("✓ Audio processed successfully! AI has generated your content.");

    } catch (error) {
      alert("Audio upload failed. Please ensure:\n1. Backend server is running on port 5000\n2. The endpoint /process-audio-upload is correct");
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
      if (setIsProcessing) setIsProcessing(false);
    }
  };

  const startRecording = () => {
    if (!navigator.mediaDevices) {
      alert("Your browser does not support media devices");
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
          const audioChunkBlob = new Blob([event.data], { type: "audio/wav" });
          if (waveSurferRef.current) waveSurferRef.current.loadBlob(audioChunkBlob);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: "audio/wav" });
          setAudioBlob(audioBlob);
          setAudioURL(URL.createObjectURL(audioBlob));
          
          // Automatically upload when recording stops
          uploadAudioToBackend(audioBlob);
        };

        mediaRecorder.start();
        setRecorder(mediaRecorder);
        setIsRecording(true);
      })
      .catch((err) => {
        alert("Microphone access denied or unavailable.");
        console.error(err);
      });
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("audio")) {
      setAudioURL(URL.createObjectURL(file));
      uploadAudioToBackend(file);
    } else {
      alert("Please select a valid audio file.");
    }
  };

  return (
    <div className="mt-8 w-[700px] mx-auto">
      {isLoading && (
        <div className="text-center mb-4 p-4 bg-blue-100 border border-blue-400 rounded">
          <p className="text-lg text-blue-800 font-semibold">
            🎵 Processing your audio... AI is generating content. Please wait.
          </p>
          <div className="mt-2">
            <div className="animate-spin inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-4">
        <div className="border-2 border-dashed border-[#6b8e23] p-4 w-[600px] h-[140px] mx-auto">
          <h3 className="text-xl text-center text-[#3e2723] font-semibold mb-4">
            Upload Audio File
          </h3>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="w-full p-2 border rounded"
            disabled={isLoading}
          />
        </div>
        <div className="border-2 border-dashed border-[#6b8e23] p-4 w-[600px] h-[140px] mx-auto">
          <h3 className="text-xl text-center text-[#3e2723] font-semibold mb-4">
            Record Your Voice
          </h3>
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-green-600 text-white p-4 rounded-full shadow-md hover:bg-green-700 w-full"
              disabled={isLoading}
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-600 text-white p-4 rounded-full shadow-md hover:bg-red-700 w-full"
            >
              Stop Recording
            </button>
          )}
          {isRecording && (
            <div className="mt-6">
              <div ref={waveformRef} className="w-full" style={{ height: "100px" }}></div>
            </div>
          )}
        </div>
      </div>
      {audioURL && !isRecording && (
        <div className="mt-8 flex justify-center">
          <audio controls src={audioURL} className="w-[400px]"></audio>
        </div>
      )}
    </div>
  );
};

export default AudioInput;
