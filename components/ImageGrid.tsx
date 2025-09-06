
import React from 'react';
import { GeneratedImage } from '../types';

interface ImageGridProps {
  images: GeneratedImage[];
  onSelect: (index: number) => void;
  canSelect: boolean;
  selectedImageIndex: number | null;
  aiGuessIndex: number | null;
  isResultState: boolean;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, onSelect, canSelect, selectedImageIndex, aiGuessIndex, isResultState }) => {
  const getBorderClass = (index: number) => {
    if (isResultState) {
        if (index === selectedImageIndex && index === aiGuessIndex) {
            return 'border-emerald-500 ring-4 ring-emerald-300'; // Correct guess
        }
        if (index === selectedImageIndex) {
            return 'border-sky-500 ring-4 ring-sky-300'; // User's choice
        }
        if (index === aiGuessIndex) {
            return 'border-rose-500 ring-4 ring-rose-300'; // AI's incorrect guess
        }
        return 'border-slate-300/50 opacity-50';
    }

    if (selectedImageIndex === index) {
        return 'border-teal-500 ring-4 ring-teal-300';
    }
    
    if (canSelect) {
        return 'border-slate-300/50 hover:border-teal-400 hover:ring-2 hover:ring-teal-200';
    }

    return 'border-slate-300/50 opacity-50';
  };

  if (!images || images.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square bg-slate-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((image, index) => (
        <div
          key={index}
          onClick={() => canSelect && onSelect(index)}
          className={`relative aspect-square bg-white/60 p-2 rounded-lg border-4 transition-all duration-300 ${getBorderClass(index)} ${canSelect ? 'cursor-pointer' : ''}`}
        >
          <img
            src={`data:image/png;base64,${image.base64}`}
            alt={image.prompt}
            className="w-full h-full object-contain"
          />
          {isResultState && (
            <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-60 text-white text-xs text-center rounded-b-md px-1 py-0.5 capitalize">{image.prompt}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;