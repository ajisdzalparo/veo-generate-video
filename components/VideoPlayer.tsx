import React from 'react';
import { DownloadIcon } from './icons';

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  return (
    <div className="w-full space-y-4">
      <video src={src} controls className="w-full rounded-lg shadow-lg aspect-video bg-black">
        Your browser does not support the video tag.
      </video>
      <a
        href={src}
        download="generated-video.mp4"
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-colors"
      >
        <DownloadIcon className="w-5 h-5 mr-2" />
        Download Video
      </a>
    </div>
  );
};

export default VideoPlayer;
