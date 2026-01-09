import React, { useState, useEffect, useCallback } from 'react';
import { PlayIcon, PauseIcon, MaximizeIcon, RotateLeftIcon, RotateRightIcon } from '../icons';

interface VideoControllerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const VideoController: React.FC<VideoControllerProps> = ({ videoRef }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef]);

  // Apply Rotation
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.style.transform = `rotate(${rotation}deg)`;
    }
  }, [rotation, videoRef]);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  }, [isPlaying, videoRef]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [videoRef]);

  const handleSpeed = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, [videoRef]);

  const rotate = useCallback((direction: 'left' | 'right') => {
      setRotation(prev => {
          const delta = direction === 'left' ? -90 : 90;
          return (prev + delta) % 360;
      });
  }, []);

  const handleFullscreen = useCallback(() => {
      if(videoRef.current) {
          if (!document.fullscreenElement) {
              videoRef.current.parentElement?.requestFullscreen();
          } else {
              document.exitFullscreen();
          }
      }
  }, [videoRef]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50 transition-opacity duration-300"
        onMouseEnter={() => setIsVisible(true)}
    >
      <div className={`
        bg-black/80 backdrop-blur-md rounded-full px-3 py-2 border border-white/10 shadow-2xl
        flex items-center gap-2 transition-opacity duration-300
        ${isPlaying && !isVisible ? 'opacity-0 hover:opacity-100' : 'opacity-100'}
      `}>
        {/* Play/Pause */}
        <button 
          onClick={togglePlay}
          className="text-white hover:text-blue-400 transition-colors p-1"
        >
          {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
        </button>

        {/* Time */}
        <span className="text-xs font-mono text-zinc-400 min-w-[35px] text-right">
          {formatTime(currentTime)}
        </span>

        {/* Progress Bar */}
        <div className="flex-1 relative group h-5 flex items-center mx-1">
            <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0 accent-white"
                style={{
                    background: `linear-gradient(to right, white ${(currentTime / duration) * 100}%, #52525b ${(currentTime / duration) * 100}%)`
                }}
            />
        </div>

        {/* Rotation */}
        <button onClick={() => rotate('left')} className="text-zinc-400 hover:text-white p-1" title="Rotate Left">
            <RotateLeftIcon className="w-4 h-4" />
        </button>
        <button onClick={() => rotate('right')} className="text-zinc-400 hover:text-white p-1" title="Rotate Right">
            <RotateRightIcon className="w-4 h-4" />
        </button>

        {/* Speed Selector */}
        <div className="relative">
             <select 
                value={playbackRate}
                onChange={(e) => handleSpeed(Number(e.target.value))}
                className="bg-transparent text-xs text-zinc-300 border border-zinc-600 rounded px-1 py-0.5 hover:border-zinc-400 focus:outline-none cursor-pointer"
             >
                 {[0.5, 1, 1.25, 1.5, 2.0].map(rate => (
                     <option key={rate} value={rate} className="bg-zinc-900 text-white">
                         {rate}x
                     </option>
                 ))}
             </select>
        </div>

        {/* Fullscreen */}
        <button onClick={handleFullscreen} className="text-white hover:text-blue-400 transition-colors p-1" title="Fullscreen">
           <MaximizeIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};