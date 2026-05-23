import React from 'react';

interface AppLogoProps {
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <div className={`shrink-0 overflow-hidden ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Background Gradient matching the rich deep navy-blue/violet squircle */}
          <linearGradient id="squircleBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#11053b" />
            <stop offset="45%" stopColor="#180b6a" />
            <stop offset="100%" stopColor="#3d12aa" />
          </linearGradient>

          {/* Top blue/cyan wing of the F */}
          <linearGradient id="topCyanWing" x1="15%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" /> {/* Royal Blue */}
            <stop offset="40%" stopColor="#2563eb" /> {/* Vivid Blue */}
            <stop offset="80%" stopColor="#06b6d4" /> {/* Cyan */}
            <stop offset="100%" stopColor="#22d3ee" /> {/* Sky Cyan */}
          </linearGradient>

          {/* Bottom purple-to-blue ribbon stem */}
          <linearGradient id="bottomPurpleStem" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" /> {/* Vibrant Purple */}
            <stop offset="40%" stopColor="#8b5cf6" /> {/* Violet */}
            <stop offset="75%" stopColor="#6366f1" /> {/* Indigo */}
            <stop offset="100%" stopColor="#2563eb" /> {/* Royal Blue */}
          </linearGradient>

          {/* Dropped shadow to make the folded components 3D pop */}
          <filter id="ribbonShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="3.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.45" />
          </filter>

          {/* Distinct checkmark shadow */}
          <filter id="checkShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#08031d" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Squircle main housing with 28% curvature */}
        <rect width="100" height="100" rx="28" fill="url(#squircleBg)" />

        {/* Deep background shadow accent under the folded F */}
        <path
          d="M 28 80 C 24 74, 25 55, 30 38 C 34 26, 44 19, 56 19 L 76 19 C 78 19, 78 25, 76 25 L 56 25 C 47 25, 38 31, 35 44 C 31 59, 28 72, 33 80 Z"
          fill="#0c0429"
          opacity="0.3"
        />

        {/* 1. Bottom/Stem purple portion extending up to connect with blue fold */}
        <path
          d="M 33 80
             C 31 82, 27.5 82, 25 80
             C 23.5 78.5, 23.5 75, 24.5 70
             C 27 58, 29.5 44, 33 34
             C 36.5 24, 47 19, 58 19
             L 76 19
             C 79 19, 79 26, 76 26
             L 58 26
             C 49 26, 41 31, 38 42
             C 34.5 53, 31.5 67, 33 80 Z"
          fill="url(#bottomPurpleStem)"
        />

        {/* 2. Top-most folded ribbon (Cyan-blue gradient) overlapping with shadow to create depth */}
        <path
          d="M 33 34
             C 34.5 28, 43 19, 58 19
             L 76 19
             C 79 19, 79 26, 76 26
             L 58 26
             C 48 26, 39 33, 34 44
             C 32.5 47, 31 42, 33 34 Z"
          fill="url(#topCyanWing)"
          filter="url(#ribbonShadow)"
        />

        {/* 3. The glorious overlay white checkmark */}
        <path
          d="M 34.5 52
             C 33 50.5, 30.5 50.5, 29 52
             C 27.5 53.5, 27.5 56, 29 57.5
             L 41.5 70
             C 43 71.5, 45.5 71.5, 47 70
             L 68.5 44
             C 70 42.5, 70 40, 68.5 38.5
             C 67 37, 64.5 37, 63 38.5
             L 44.2 60.8
             L 34.5 52 Z"
          fill="#FFFFFF"
          filter="url(#checkShadow)"
        />
      </svg>
    </div>
  );
};
