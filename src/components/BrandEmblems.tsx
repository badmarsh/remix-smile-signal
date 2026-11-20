import React from 'react';
import mvpPlaqueImg from '../assets/images/mvp_plaque_trophy_1795115616768.jpg';
import physicalEditionImg from '../assets/images/physical_edition_box_1795115575355.jpg';
import radoPortraitImg from '../assets/images/rado_portrait_techno_1795115581925.jpg';
import { PixelSprite } from '../game/sprites';

export const DEFAULT_RADO_PORTRAIT_URL = radoPortraitImg;
export const PHYSICAL_EDITION_IMAGE_URL = physicalEditionImg;
export const MVP_PLAQUE_IMAGE_URL = mvpPlaqueImg;

/**
 * Renders any PixelSprite bitmap cleanly as crisp pixel-art SVG (shapeRendering="crispEdges")
 * so Zúbok, Signálik, and the Golden-Star MVP Plaque match 1:1 between canvas and UI.
 */
export const PixelSpriteIcon: React.FC<{
  sprite: PixelSprite;
  size?: number;
  label?: string;
  className?: string;
}> = ({ sprite, size = 32, label, className = '' }) => {
  const h = sprite.rows.length;
  const w = sprite.rows[0]?.length ?? 1;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={Math.round((size * h) / w)}
      shapeRendering="crispEdges"
      className={`shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {sprite.rows.map((row, y) =>
        row.split('').map((ch, x) => {
          if (ch === '.') return null;
          const fill = sprite.palette[ch];
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
};

/**
 * Official Coat of Arms of Rimavská Sobota (Heraldický register SR):
 * "V striebornom štíte čierny orol v červenej zbroji."
 */
export const RimavskaSobotaCrest: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 64,
}) => (
  <svg
    viewBox="0 0 120 142"
    width={size}
    height={Math.round((size * 142) / 120)}
    className={`shrink-0 ${className}`}
    role="img"
    aria-label="Erb mesta Rimavská Sobota — v striebornom štíte čierny orol v červenej zbroji"
  >
    <defs>
      <linearGradient id="rs-silver-shield" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="55%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
    </defs>

    {/* Heater Shield Base (Silver / Strieborný štít) */}
    <path
      d="M12 10 H108 V66 C108 103 82 126 60 136 C38 126 12 103 12 66 Z"
      fill="url(#rs-silver-shield)"
      stroke="#1E2430"
      strokeWidth="4"
    />
    <path
      d="M17 15 H103 V65 C103 98 80 119 60 129 C40 119 17 98 17 65 Z"
      fill="none"
      stroke="#94A3B8"
      strokeWidth="1.5"
    />

    {/* Displayed Black Heraldic Eagle (Čierny orol) */}
    <g fill="#0E1117">
      {/* Head facing heraldic dexter (viewer left) */}
      <path d="M59 24 C53 24 49 28 50 33 C51 37 54 39 55 43 L65 43 C66 38 68 35 67 30 C66 26 63 24 59 24 Z" />
      {/* Crest tuft */}
      <path d="M64 26 L70 23 L67 29 Z" />

      {/* Torso & Breast */}
      <path d="M51 43 C47 51 48 69 54 81 L66 81 C72 69 73 51 69 43 Z" />

      {/* Left Wing (Viewer Left) with distinct primary feathers */}
      <path d="M51 46 C42 40 31 32 22 33 C25 38 30 41 37 44 L21 44 C25 49 32 51 38 52 L22 55 C27 59 34 60 40 60 L26 65 C32 68 39 67 44 66 L32 74 C39 75 46 72 51 68 Z" />

      {/* Right Wing (Viewer Right) */}
      <path d="M69 46 C78 40 89 32 98 33 C95 38 90 41 83 44 L99 44 C95 49 88 51 82 52 L98 55 C93 59 86 60 80 60 L94 65 C88 68 81 67 76 66 L88 74 C81 75 74 72 69 68 Z" />

      {/* Fanned Tail Feathers */}
      <path d="M55 81 L49 102 L55 98 L60 112 L65 98 L71 102 L65 81 Z" />
      <path d="M54 83 L44 96 L51 94 Z" />
      <path d="M66 83 L76 96 L69 94 Z" />

      {/* Upper Legs / Thighs */}
      <path d="M52 78 L41 90 L46 93 L55 83 Z" />
      <path d="M68 78 L79 90 L74 93 L65 83 Z" />
    </g>

    {/* Eye highlight */}
    <circle cx="56" cy="30" r="1.5" fill="#F8FAFC" />

    {/* Red Arming (Červená zbroj: zobák, jazyk a pazúry) */}
    <g fill="#D91E2A">
      {/* Curved Beak & Tongue */}
      <path d="M51 28 C46 27 42 29 40 33 C44 32 47 32 51 33 Z" />
      <path d="M49 33 L42 35 L49 35 Z" />
      {/* Left Talons */}
      <path d="M41 90 L33 93 L38 95 L32 100 L40 98 L39 105 L44 98 L47 93 Z" />
      {/* Right Talons */}
      <path d="M79 90 L87 93 L82 95 L88 100 L80 98 L81 105 L76 98 L73 93 Z" />
    </g>
  </svg>
);

/**
 * Custom brand lockup for microDENT.sk (Rimavská Sobota microscopic dental clinic)
 */
export const MicrodentLogo: React.FC<{ compact?: boolean; className?: string }> = ({
  compact = false,
  className = '',
}) => (
  <div className={`inline-flex items-center gap-2.5 ${className}`}>
    <svg
      viewBox="0 0 40 40"
      width={compact ? 26 : 36}
      height={compact ? 26 : 36}
      className="shrink-0"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="38" height="38" rx="4" fill="#0B192C" stroke="#00E8E8" strokeWidth="1.5" />
      {/* Stylized precision molar + microscope optical crosshair */}
      <path
        d="M12 13 C12 9 16 8 20 10 C24 8 28 9 28 13 C28 19 25 22 25 29 C25 32 22 32 21 28 L20 24 L19 28 C18 32 15 32 15 29 C15 22 12 19 12 13 Z"
        fill="#FFFFFF"
      />
      <circle cx="20" cy="15" r="4" fill="none" stroke="#00B4D8" strokeWidth="1.6" />
      <line x1="20" y1="9" x2="20" y2="12" stroke="#00E8E8" strokeWidth="1.3" />
      <line x1="20" y1="18" x2="20" y2="21" stroke="#00E8E8" strokeWidth="1.3" />
      <line x1="14" y1="15" x2="17" y2="15" stroke="#00E8E8" strokeWidth="1.3" />
      <line x1="23" y1="15" x2="26" y2="15" stroke="#00E8E8" strokeWidth="1.3" />
    </svg>
    <div className="leading-tight">
      <div className={`font-sans font-bold tracking-tight text-white ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className="font-normal text-[#00E8E8]">micro</span>DENT<span className="text-[#94A3B8]">.sk</span>
      </div>
      {!compact && (
        <div className="font-mono text-[10px] tracking-wide text-[#94A3B8]">
          Mikroskopická stomatológia · RS
        </div>
      )}
    </div>
  </div>
);

/**
 * Custom brand lockup for TeatrO.eu (RSNET optical internet & IPTV Rimavská Sobota)
 */
export const TeatroLogo: React.FC<{ compact?: boolean; className?: string }> = ({
  compact = false,
  className = '',
}) => (
  <div className={`inline-flex items-center gap-2.5 ${className}`}>
    <svg
      viewBox="0 0 40 40"
      width={compact ? 26 : 36}
      height={compact ? 26 : 36}
      className="shrink-0"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="38" height="38" rx="4" fill="#1E0E14" stroke="#E5B94C" strokeWidth="1.5" />
      {/* Optical fiber broadcast waves & theater arch */}
      <path d="M9 28 C9 16 31 16 31 28" fill="none" stroke="#FF2A4B" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 28 C13 20 27 20 27 28" fill="none" stroke="#FFEE00" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17 28 C17 24 23 24 23 28" fill="none" stroke="#00E8E8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="29" r="2.2" fill="#FFFFFF" />
      <line x1="8" y1="12" x2="32" y2="12" stroke="#E5B94C" strokeWidth="1.2" strokeDasharray="2 2" />
    </svg>
    <div className="leading-tight">
      <div className={`font-sans font-bold tracking-tight text-white ${compact ? 'text-xs' : 'text-sm'}`}>
        Teatr<span className="text-[#FFEE00]">O</span><span className="text-[#94A3B8]">.eu</span>
      </div>
      {!compact && (
        <div className="font-mono text-[10px] tracking-wide text-[#94A3B8]">
          Optický internet &amp; IPTV · RSNET
        </div>
      )}
    </div>
  </div>
);

/**
 * Framed Rado Ceglédy portrait with zero-broken-image fallback
 */
export const RadoPortraitFrame: React.FC<{
  src: string;
  sizeClass?: string;
  className?: string;
}> = ({ src, sizeClass = 'h-16 w-16', className = '' }) => {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden rounded-sm border border-[#e5b94c]/80 bg-[#101520] ${sizeClass} ${className}`}
    >
      {!failed ? (
        <img
          src={src}
          alt="Rado Ceglédy — 1. miesto Celoživotný MVP regiónu Rimavská Sobota"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-[#141a26] text-center font-mono text-[10px] font-bold text-[#e5b94c]">
          <span>RC</span>
          <span className="text-[9px] text-[#00e8e8]">MVP #1</span>
        </div>
      )}
    </div>
  );
};
