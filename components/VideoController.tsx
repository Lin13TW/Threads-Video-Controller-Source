import React, { useState, useEffect, useCallback } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, VolumeMuteIcon, MaximizeIcon } from '../icons';

interface VideoControllerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const VideoController: React.FC<VideoControllerProps> = ({ videoRef }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
        setVolume(video.volume);
        setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [videoRef]);

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

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const vol = Number(e.target.value);
      if(videoRef.current) {
          videoRef.current.volume = vol;
          videoRef.current.muted = vol === 0;
      }
  }, [videoRef]);

  const toggleMute = useCallback(() => {
      if(videoRef.current) {
          videoRef.current.muted = !videoRef.current.muted;
      }
  }, [videoRef]);

  const handleSpeed = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, [videoRef]);

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
        bg-black/80 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-2xl
        flex items-center gap-3 transition-opacity duration-300
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
        <div className="flex-1 relative group h-5 flex items-center">
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

        {/* Volume */}
        <div className="flex items-center gap-2 group relative">
             <button onClick={toggleMute} className="text-zinc-300 hover:text-white">
                {isMuted || volume === 0 ? <VolumeMuteIcon className="w-4 h-4"/> : <SpeakerWaveIcon className="w-4 h-4"/>}
             </button>
        </div>

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