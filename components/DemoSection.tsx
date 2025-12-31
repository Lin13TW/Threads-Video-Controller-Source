import React, { useRef } from 'react';
import { VideoController } from './VideoController';

export const DemoSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="bg-blue-600 w-2 h-8 rounded-full inline-block"></span>
          Live Preview
        </h2>
        <p className="text-zinc-400">
          This simulates how the controller will behave on Threads. Hover over the video to reveal controls.
        </p>
      </div>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden group border border-zinc-800 ring-4 ring-zinc-900/50">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
          loop
          playsInline
          crossOrigin="anonymous"
        />
        
        {/* The Controller Component */}
        <VideoController videoRef={videoRef} />
        
        {/* Simulation of Threads overlay elements to prove z-index works */}
        <div className="absolute top-4 right-4 bg-black/40 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
          Threads UI Mockup
        </div>
      </div>
      
      <div className="mt-4 flex gap-4 text-sm text-zinc-500 justify-center">
        <span>Try: Change Speed</span>
        <span>•</span>
        <span>Try: Scrub Timeline</span>
        <span>•</span>
        <span>Try: Mute</span>
      </div>
    </div>
  );
};