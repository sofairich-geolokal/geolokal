"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with proper typing
const DynamicBoundaryLayerWrapper = dynamic(
  () => import('./DynamicBoundaryLayer'),
  { 
    ssr: false,
    loading: () => <div>Loading boundary layer...</div>
  }
);

interface BoundaryLayerWrapperProps {
  isVisible: boolean;
  isHighlighted?: boolean;
  areaType?: string;
  onBoundarySelect?: (location: any) => void;
}

const BoundaryLayerWrapper: React.FC<BoundaryLayerWrapperProps> = ({
  isVisible,
  isHighlighted = false,
  areaType = 'municipal',
  onBoundarySelect
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <DynamicBoundaryLayerWrapper
      isVisible={true}
      isHighlighted={isHighlighted}
      areaType={areaType}
      onBoundarySelect={onBoundarySelect}
    />
  ) as React.ReactElement;
};

export default BoundaryLayerWrapper;
