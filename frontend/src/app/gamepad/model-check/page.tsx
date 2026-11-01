'use client';

import ControllerModel3D from '@/components/gamepad/ControllerModel3D';

export default function ModelPreview() {
  return (
    <div style={{ height: '100dvh', background: '#0b0f16' }}>
      <ControllerModel3D modelUrl="/models/dualsense.glb" />
    </div>
  );
}
