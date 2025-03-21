
import React from 'react';

interface ReeloLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const ReeloLogo: React.FC<ReeloLogoProps> = ({ 
  className = "", 
  width = 180, 
  height = 60 
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/lovable-uploads/2b42e9a5-8157-45e8-9b45-8ef9e6c445b4.png" 
        alt="Reelo Logo" 
        width={width} 
        height={height} 
        className="object-contain"
      />
    </div>
  );
};

export default ReeloLogo;
