import React, { useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ArrowLeft } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Real-Time Site Monitoring",
      description: "Track your construction sites with live updates and AI-powered insights",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=80",
      features: ["Live Dashboard", "Real-time Alerts", "GPS Tracking"]
    },
    {
      title: "Intelligent Risk Prediction",
      description: "AI predicts delays and risks before they happen, helping you stay ahead",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=80",
      features: ["AI Analytics", "Risk Forecasting", "Preventive Actions"]
    },
    {
      title: "Automated Reporting",
      description: "Generate professional reports instantly with all project data",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=80",
      features: ["Auto Reports", "Data Export", "Custom Dashboards"]
    },
    {
      title: "Team Collaboration",
      description: "Keep your entire team synchronized with real-time communication",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=80",
      features: ["Team Chat", "Task Management", "File Sharing"]
    },
    {
      title: "Budget Management",
      description: "Control costs and track spending in real-time across all projects",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=80",
      features: ["Budget Tracking", "Expense Analytics", "Cost Alerts"]
    }
  ];

  React.useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, slides.length]);

  if (!isOpen) return null;

  const slide = slides[currentSlide];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with Back Button and Close */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 lg:px-12 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-2 rounded-lg transition font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Demo Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 lg:p-12">
          {/* Left Side - Image */}
          <div className="relative overflow-hidden rounded-xl">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-96 lg:h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Video-like overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-md rounded-full p-4 hover:bg-white/30 transition">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>

            {/* Slide Counter */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold">
              {currentSlide + 1} / {slides.length}
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex flex-col justify-between">
            {/* Title and Description */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {slide.title}
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {slide.description}
              </p>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Key Features</p>
                <div className="space-y-2">
                  {slide.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-8 space-y-4">
              {/* Playback Controls */}
              <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-3">
                <button
                  onClick={prevSlide}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                  aria-label="Previous slide"
                >
                  <SkipBack className="w-5 h-5 text-gray-700" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Play className="w-5 h-5 text-gray-700" />
                  )}
                </button>

                <button
                  onClick={nextSlide}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                  aria-label="Next slide"
                >
                  <SkipForward className="w-5 h-5 text-gray-700" />
                </button>

                <div className="flex-1" />

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-gray-700" />
                  )}
                </button>
              </div>

              {/* Progress Indicators */}
              <div className="flex gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`flex-1 h-1 rounded-full transition ${
                      idx === currentSlide
                        ? "bg-indigo-600"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 pt-4">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition shadow-lg hover:shadow-xl">
                  Start Free Trial
                </button>
                <button className="w-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold py-3 rounded-lg transition">
                  Schedule a Call
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-8 lg:px-12 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Join 2,500+ companies</p>
              <p className="text-xs text-gray-600">Transforming their construction management with SmartSite</p>
            </div>
            <div className="flex gap-2">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Free Trial</span>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">No Credit Card</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
