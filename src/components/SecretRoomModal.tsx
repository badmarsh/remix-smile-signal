import React, { useState } from 'react';
import { SECRET_ROOM_PARAGRAPHS, SECRET_ROOM_TITLE } from '../data/dedication';
import { CITIZEN_SIGNATURES, validateSecretCode } from '../data/signatures';
import { RadoPortraitFrame, RimavskaSobotaCrest } from './BrandEmblems';

interface SecretRoomModalProps {
  open: boolean;
  radoPhotoUrl: string;
  onClose: () => void;
}

export const SecretRoomModal: React.FC<SecretRoomModalProps> = ({
  open,
  radoPhotoUrl,
  onClose,
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateSecretCode(codeInput)) {
      setUnlocked(true);
      setErrorMsg(null);
    } else {
      setErrorMsg('Nesprávny 8-znakový kód. Nájdeš ho na pamätnej plakete alebo zberateľskej karte.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070c]/92 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secret-room-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-sm border-2 border-[#e5b94c] bg-[#0b101b] text-[#e8ecf2] shadow-[0_24px_70px_rgba(0,0,0,0.95)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#252e42] bg-[#101624] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <RimavskaSobotaCrest size={28} />
            <div>
              <h2
                id="secret-room-title"
                className="font-display text-lg font-bold tracking-wide text-[#e5b94c]"
              >
                {unlocked ? SECRET_ROOM_TITLE : 'Tajná miestnosť 1270'}
              </h2>
              <p className="font-mono text-[11px] text-[#9aa5b8]">
                Rymos Zumbota 1270 · Archív občanov regiónu Rimavská Sobota
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Zavrieť tajnú miestnosť 1270"
            className="min-h-[38px] cursor-pointer whitespace-nowrap rounded-sm border border-[#525b6e] bg-[#141925] px-3.5 py-1.5 font-mono text-xs font-semibold text-white hover:border-[#00e8e8] hover:text-[#00e8e8]"
          >
            Zavrieť
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!unlocked ? (
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-4 text-center">
              <div className="font-mono text-xs leading-relaxed text-[#cfd7e3]">
                Zadaj 8-znakový tajný kód z pamätnej plakety MVP alebo zo zberateľskej karty (Vizuálny manuál · Kapitola 05 / 06).
              </div>

              <div>
                <label
                  htmlFor="secret-code-input"
                  className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#00e8e8]"
                >
                  Tajný kód z plakety (8 znakov)
                </label>
                <input
                  id="secret-code-input"
                  type="text"
                  maxLength={12}
                  autoFocus
                  placeholder="XXXXXXXX"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="mt-2 w-full rounded-sm border-2 border-[#3a4254] bg-[#070a10] px-4 py-3 text-center font-mono text-lg font-bold tracking-[0.24em] text-[#ffee00] uppercase focus:border-[#00e8e8] focus:outline-none"
                />
              </div>

              {errorMsg && (
                <p role="alert" className="font-mono text-xs text-[#ff5c5c]">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="min-h-[44px] cursor-pointer rounded-sm border-2 border-[#e5b94c] bg-[#e5b94c] px-5 py-2.5 font-display text-sm font-bold tracking-wider text-[#070a10] hover:bg-[#f2ca63]"
              >
                Odomknúť miestnosť 1270
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <div className="flex flex-col items-center gap-2">
                  <RadoPortraitFrame
                    src={radoPhotoUrl}
                    sizeClass="h-32 w-32 border-2 border-[#e5b94c]"
                  />
                  <span className="font-mono text-[11px] font-semibold text-[#e5b94c]">
                    Rado Ceglédy · MVP #1
                  </span>
                </div>

                <div className="flex-1 space-y-3 text-sm leading-relaxed text-[#cfd7e3]">
                  {SECRET_ROOM_PARAGRAPHS.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </div>

              {/* Kniha podpisov */}
              <div className="border-t border-[#252e42] pt-4">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#00e8e8]">
                  Kniha podpisov občanov regiónu Rimavská Sobota
                </div>
                <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {CITIZEN_SIGNATURES.map((sig) => (
                    <div
                      key={sig}
                      className="rounded-sm border border-[#232b3d] bg-[#0e1422] px-3 py-1.5 font-mono text-xs text-[#e8ecf2]"
                    >
                      ★ {sig}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
