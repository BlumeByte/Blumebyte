import React from 'react';

type BackgroundVariant = 'landing' | 'superadmin' | 'admin' | 'manager' | 'employee';

const VARIANT_CLASS: Record<BackgroundVariant, string> = {
  landing: 'mono-3d-theme-landing',
  superadmin: 'mono-3d-theme-superadmin',
  admin: 'mono-3d-theme-admin',
  manager: 'mono-3d-theme-manager',
  employee: 'mono-3d-theme-employee',
};

export function Monochrome3DBackground({ variant }: { variant: BackgroundVariant }) {
  return (
    <div className={`mono-3d-bg ${VARIANT_CLASS[variant]}`} aria-hidden="true">
      <div className="mono-3d-grid" />
      <div className="mono-3d-orb mono-3d-orb-a" />
      <div className="mono-3d-orb mono-3d-orb-b" />
      <div className="mono-3d-orb mono-3d-orb-c" />
      <div className="mono-3d-sweep" />
    </div>
  );
}

