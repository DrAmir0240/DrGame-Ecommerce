"use client";

import React, { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX, X, Play } from "lucide-react";

interface LogoMotionProps {
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
  isModal?: boolean;
  onClose?: () => void;
}

export const LogoMotion: React.FC<LogoMotionProps> = ({
  className = "",
  autoplay = true,
  loop = true,
  isModal = false,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoplay);

  useEffect(() => {
    if (videoRef.current && autoplay) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [autoplay]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const content = (
    <div
      className={`relative rounded-2xl overflow-hidden border border-cosmic-light/30 shadow-cosmic-lg bg-oled-card/90 backdrop-blur-xl group ${className}`}
    >
      <video
        ref={videoRef}
        src="/logo-motion.mp4"
        autoPlay={autoplay}
        muted={isMuted}
        loop={loop}
        playsInline
        className="w-full h-auto object-cover max-h-[460px]"
      />

      {/* Video Controls Overlay */}
      <div className="absolute bottom-3 end-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={togglePlay}
          className="text-white/80 hover:text-white transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          <Play className={`w-4 h-4 ${isPlaying ? "opacity-40" : "opacity-100"}`} />
        </button>
        <button
          onClick={toggleMute}
          className="text-white/80 hover:text-white transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-rose-400 transition-colors ps-1 border-s border-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="relative max-w-2xl w-full">{content}</div>
      </div>
    );
  }

  return content;
};
