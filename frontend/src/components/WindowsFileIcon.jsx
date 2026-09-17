import React from 'react';

/**
 * Windows File Explorer Iconography System
 * Authentic, professional vector icons modeled directly on Windows 10/11 File Explorer.
 * Strictly iconography only — no text inside icons.
 */

export function WindowsFolderIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Back tab & body */}
      <path
        d="M3 7.5C3 6.67 3.67 6 4.5 6H12.2C12.8 6 13.37 6.27 13.75 6.74L15.3 8.67C15.68 9.14 16.25 9.41 16.85 9.41H27.5C28.33 9.41 29 10.08 29 10.91V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V7.5Z"
        fill="#F5BA42"
      />
      {/* Interior depth shadow */}
      <path
        d="M4 11H28V24.5C28 25.05 27.55 25.5 27 25.5H5C4.45 25.5 4 25.05 4 24.5V11Z"
        fill="#DFA020"
        opacity="0.35"
      />
      {/* Front pocket flap */}
      <path
        d="M3 12.5C3 11.67 3.67 11 4.5 11H27.5C28.33 11 29 11.67 29 12.5V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V12.5Z"
        fill="#FFCA28"
      />
      {/* Subtle top edge highlight */}
      <path d="M4 11.5H28" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function WindowsDriveIcon({ className = 'w-8 h-8 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Drive casing */}
      <rect x="3" y="8" width="26" height="17" rx="2" fill="#E1E4E8" stroke="#9AA0A6" strokeWidth="1" />
      {/* Drive top plate */}
      <rect x="5" y="10" width="22" height="11" rx="1" fill="#FFFFFF" />
      {/* Windows logo on drive or disk platter */}
      <rect x="7" y="12" width="7" height="7" rx="0.5" fill="#0078D4" />
      <path d="M10.5 12V19 M7 15.5H14" stroke="#FFFFFF" strokeWidth="0.8" />
      {/* Activity light & connector slot */}
      <circle cx="23" cy="15.5" r="1.5" fill="#107C10" />
      <rect x="5" y="22" width="22" height="1.5" rx="0.5" fill="#BDC1C6" />
    </svg>
  );
}

export function WindowsDocumentsFolderIcon({ className = 'w-8 h-8 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7.5C3 6.67 3.67 6 4.5 6H12.2C12.8 6 13.37 6.27 13.75 6.74L15.3 8.67C15.68 9.14 16.25 9.41 16.85 9.41H27.5C28.33 9.41 29 10.08 29 10.91V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V7.5Z" fill="#F5BA42" />
      {/* Document peaking inside */}
      <rect x="9" y="8" width="14" height="10" rx="1" fill="#FFFFFF" stroke="#90A4AE" strokeWidth="0.5" />
      <line x1="12" y1="11" x2="20" y2="11" stroke="#0078D4" strokeWidth="1" strokeLinecap="round" />
      <line x1="12" y1="14" x2="18" y2="14" stroke="#90A4AE" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M3 12.5C3 11.67 3.67 11 4.5 11H27.5C28.33 11 29 11.67 29 12.5V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V12.5Z" fill="#FFCA28" />
      <path d="M4 11.5H28" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function WindowsPersonalFolderIcon({ className = 'w-8 h-8 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7.5C3 6.67 3.67 6 4.5 6H12.2C12.8 6 13.37 6.27 13.75 6.74L15.3 8.67C15.68 9.14 16.25 9.41 16.85 9.41H27.5C28.33 9.41 29 10.08 29 10.91V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V7.5Z" fill="#F5BA42" />
      <path d="M3 12.5C3 11.67 3.67 11 4.5 11H27.5C28.33 11 29 11.67 29 12.5V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V12.5Z" fill="#FFCA28" />
      <path d="M4 11.5H28" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
      {/* User emblem */}
      <circle cx="22" cy="18" r="4.5" fill="#0078D4" />
      <circle cx="22" cy="16.5" r="1.5" fill="#FFFFFF" />
      <path d="M19.5 21C19.5 19.8 20.6 19 22 19C23.4 19 24.5 19.8 24.5 21" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function WindowsSharedFolderIcon({ className = 'w-8 h-8 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7.5C3 6.67 3.67 6 4.5 6H12.2C12.8 6 13.37 6.27 13.75 6.74L15.3 8.67C15.68 9.14 16.25 9.41 16.85 9.41H27.5C28.33 9.41 29 10.08 29 10.91V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V7.5Z" fill="#F5BA42" />
      <path d="M3 12.5C3 11.67 3.67 11 4.5 11H27.5C28.33 11 29 11.67 29 12.5V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V12.5Z" fill="#FFCA28" />
      <path d="M4 11.5H28" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
      {/* People emblem */}
      <circle cx="21" cy="18" r="5" fill="#107C10" />
      <circle cx="20" cy="16.5" r="1.3" fill="#FFFFFF" />
      <circle cx="23" cy="16.5" r="1.1" fill="#C8E6C9" />
      <path d="M18 21C18 19.6 19 19 20.5 19C21.8 19 22.8 19.6 23 21" stroke="#FFFFFF" strokeWidth="0.9" />
    </svg>
  );
}

export function WindowsStarredFolderIcon({ className = 'w-8 h-8 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7.5C3 6.67 3.67 6 4.5 6H12.2C12.8 6 13.37 6.27 13.75 6.74L15.3 8.67C15.68 9.14 16.25 9.41 16.85 9.41H27.5C28.33 9.41 29 10.08 29 10.91V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V7.5Z" fill="#F5BA42" />
      <path d="M3 12.5C3 11.67 3.67 11 4.5 11H27.5C28.33 11 29 11.67 29 12.5V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V12.5Z" fill="#FFCA28" />
      <path d="M4 11.5H28" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
      {/* Star emblem */}
      <circle cx="21" cy="18" r="5" fill="#D97706" />
      <path d="M21 14.5L22.2 17L24.8 17.3L22.9 19.1L23.4 21.6L21 20.3L18.6 21.6L19.1 19.1L17.2 17.3L19.8 17L21 14.5Z" fill="#FFFFFF" />
    </svg>
  );
}

export function WindowsRecentFolderIcon({ className = 'w-8 h-8 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7.5C3 6.67 3.67 6 4.5 6H12.2C12.8 6 13.37 6.27 13.75 6.74L15.3 8.67C15.68 9.14 16.25 9.41 16.85 9.41H27.5C28.33 9.41 29 10.08 29 10.91V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V7.5Z" fill="#F5BA42" />
      <path d="M3 12.5C3 11.67 3.67 11 4.5 11H27.5C28.33 11 29 11.67 29 12.5V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V12.5Z" fill="#FFCA28" />
      <path d="M4 11.5H28" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
      {/* Clock emblem */}
      <circle cx="21" cy="18" r="5" fill="#0284C7" />
      <circle cx="21" cy="18" r="3.5" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
      <path d="M21 16V18.2L22.5 19.2" stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

export function WindowsApprovalsFolderIcon({ className = 'w-8 h-8 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7.5C3 6.67 3.67 6 4.5 6H12.2C12.8 6 13.37 6.27 13.75 6.74L15.3 8.67C15.68 9.14 16.25 9.41 16.85 9.41H27.5C28.33 9.41 29 10.08 29 10.91V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V7.5Z" fill="#F5BA42" />
      <path d="M3 12.5C3 11.67 3.67 11 4.5 11H27.5C28.33 11 29 11.67 29 12.5V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V12.5Z" fill="#FFCA28" />
      <path d="M4 11.5H28" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
      {/* Shield/Checkmark emblem */}
      <circle cx="21" cy="18" r="5" fill="#7C3AED" />
      <path d="M19.2 18L20.5 19.3L23 16.8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WindowsWordIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Document base sheet */}
      <path d="M6 4C6 2.9 6.9 2 8 2H19.5L26 8.5V28C26 29.1 25.1 30 24 30H8C6.9 30 6 29.1 6 28V4Z" fill="#185ABD" />
      {/* Top right corner fold */}
      <path d="M19.5 2L26 8.5H20.5C19.95 8.5 19.5 8.05 19.5 7.5V2Z" fill="#4B88E8" />
      {/* Document lines */}
      <rect x="10" y="13" width="12" height="2" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
      <rect x="10" y="17" width="12" height="2" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
      <rect x="10" y="21" width="8" height="2" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
      <rect x="10" y="25" width="10" height="1.5" rx="0.75" fill="#FFFFFF" fillOpacity="0.6" />
    </svg>
  );
}

export function WindowsExcelIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Document base sheet */}
      <path d="M6 4C6 2.9 6.9 2 8 2H19.5L26 8.5V28C26 29.1 25.1 30 24 30H8C6.9 30 6 29.1 6 28V4Z" fill="#107C41" />
      {/* Top right corner fold */}
      <path d="M19.5 2L26 8.5H20.5C19.95 8.5 19.5 8.05 19.5 7.5V2Z" fill="#33AC66" />
      {/* Spreadsheet table grid */}
      <rect x="10" y="13" width="12" height="12" rx="1" fill="#FFFFFF" fillOpacity="0.2" />
      <path d="M10 17H22 M10 21H22 M16 13V25" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function WindowsPowerPointIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Document base sheet */}
      <path d="M6 4C6 2.9 6.9 2 8 2H19.5L26 8.5V28C26 29.1 25.1 30 24 30H8C6.9 30 6 29.1 6 28V4Z" fill="#D24726" />
      {/* Top right corner fold */}
      <path d="M19.5 2L26 8.5H20.5C19.95 8.5 19.5 8.05 19.5 7.5V2Z" fill="#F07D62" />
      {/* Slide presentation chart */}
      <circle cx="16" cy="18" r="5" fill="#FFFFFF" fillOpacity="0.25" />
      <path d="M16 13A5 5 0 0 1 21 18H16V13Z" fill="#FFFFFF" />
      <rect x="10" y="25" width="12" height="1.5" rx="0.75" fill="#FFFFFF" fillOpacity="0.7" />
    </svg>
  );
}

export function WindowsPdfIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Document base sheet */}
      <path d="M6 4C6 2.9 6.9 2 8 2H19.5L26 8.5V28C26 29.1 25.1 30 24 30H8C6.9 30 6 29.1 6 28V4Z" fill="#E5252A" />
      {/* Top right corner fold */}
      <path d="M19.5 2L26 8.5H20.5C19.95 8.5 19.5 8.05 19.5 7.5V2Z" fill="#F57578" />
      {/* Acrobat ribbon flourish */}
      <path
        d="M18.5 13C16.8 13 15.3 14.5 14.7 16.8C14.1 19.2 12.8 20.8 11.2 21.2C10.2 21.5 9.5 22.3 9.8 23.3C10 24.1 10.9 24.6 11.8 24.3C14.3 23.5 16.2 20.8 17.1 18.2C18.6 18.7 20.2 19 21.5 18.8C22.6 18.6 23.2 17.6 22.8 16.7C22.4 15.8 21.4 15.4 20.4 15.7C19.8 15.9 19.2 16.2 18.7 16.5C18.8 15.2 18.8 14.1 18.5 13Z"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function WindowsImageIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Windows Photos photo tile */}
      <rect x="4" y="4" width="24" height="24" rx="3" fill="#0078D4" />
      <rect x="5.5" y="5.5" width="21" height="21" rx="2" fill="#005A9E" />
      {/* Sky backdrop */}
      <rect x="5.5" y="5.5" width="21" height="15" fill="#2899F5" />
      {/* Sun */}
      <circle cx="11" cy="11" r="2.5" fill="#FFD54F" />
      {/* Mountain peaks */}
      <path d="M6 23L13 14L18 20L21 16L26 23H6Z" fill="#004578" />
      <path d="M12 23L16 18L21 23H12Z" fill="#106EBE" />
    </svg>
  );
}

export function WindowsVideoIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Windows Films & TV video tile */}
      <rect x="4" y="5" width="24" height="22" rx="3" fill="#0063B1" />
      {/* Clapper header */}
      <path d="M4 8C4 6.34 5.34 5 7 5H25C26.66 5 28 6.34 28 8V10H4V8Z" fill="#004E8C" />
      <path d="M8 5L6 10 M14 5L12 10 M20 5L18 10 M26 5L24 10" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />
      {/* Play icon */}
      <path d="M14 14.5L20 18L14 21.5V14.5Z" fill="#FFFFFF" />
    </svg>
  );
}

export function WindowsAudioIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Windows Media / Groove music tile */}
      <rect x="4" y="5" width="24" height="22" rx="3" fill="#8764B8" />
      {/* Musical note with beam */}
      <path
        d="M13 19.5C13 20.88 11.88 22 10.5 22C9.12 22 8 20.88 8 19.5C8 18.12 9.12 17 10.5 17C11.13 17 11.7 17.23 12.14 17.61L12.5 10H20.5V17.5C20.5 18.88 19.38 20 18 20C16.62 20 15.5 18.88 15.5 17.5C15.5 16.12 16.62 15 18 15C18.63 15 19.2 15.23 19.64 15.61L20 11.5H13V19.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function WindowsZipIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Windows Compressed Yellow Folder */}
      <path
        d="M3 7.5C3 6.67 3.67 6 4.5 6H12.2C12.8 6 13.37 6.27 13.75 6.74L15.3 8.67C15.68 9.14 16.25 9.41 16.85 9.41H27.5C28.33 9.41 29 10.08 29 10.91V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V7.5Z"
        fill="#F5BA42"
      />
      <path
        d="M3 12.5C3 11.67 3.67 11 4.5 11H27.5C28.33 11 29 11.67 29 12.5V24.5C29 25.33 28.33 26 27.5 26H4.5C3.67 26 3 25.33 3 24.5V12.5Z"
        fill="#FFCA28"
      />
      {/* Zipper vertical track */}
      <rect x="14.5" y="11" width="3" height="15" fill="#455A64" />
      {/* Interlocking zipper teeth */}
      <rect x="13.5" y="12" width="2" height="1.5" fill="#CFD8DC" />
      <rect x="16.5" y="13.5" width="2" height="1.5" fill="#CFD8DC" />
      <rect x="13.5" y="15" width="2" height="1.5" fill="#CFD8DC" />
      <rect x="16.5" y="16.5" width="2" height="1.5" fill="#CFD8DC" />
      <rect x="13.5" y="18" width="2" height="1.5" fill="#CFD8DC" />
      <rect x="16.5" y="19.5" width="2" height="1.5" fill="#CFD8DC" />
      {/* Zipper pull tab */}
      <rect x="14" y="21.5" width="4" height="4" rx="1" fill="#ECEFF1" stroke="#37474F" strokeWidth="0.75" />
    </svg>
  );
}

export function WindowsCodeIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* VS Code / Developer code document */}
      <path d="M6 4C6 2.9 6.9 2 8 2H19.5L26 8.5V28C26 29.1 25.1 30 24 30H8C6.9 30 6 29.1 6 28V4Z" fill="#007ACC" />
      <path d="M19.5 2L26 8.5H20.5C19.95 8.5 19.5 8.05 19.5 7.5V2Z" fill="#38A2F5" />
      {/* Code brackets < / > */}
      <path d="M12.5 15L9.5 18L12.5 21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 15L22.5 18L19.5 21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 14L15 22" stroke="#80D8FF" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function WindowsTextIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Windows Notepad document sheet */}
      <path d="M6 4C6 2.9 6.9 2 8 2H19.5L26 8.5V28C26 29.1 25.1 30 24 30H8C6.9 30 6 29.1 6 28V4Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
      <path d="M19.5 2L26 8.5H20.5C19.95 8.5 19.5 8.05 19.5 7.5V2Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
      {/* Top blue bar */}
      <path d="M6.5 4C6.5 3.2 7.2 2.5 8 2.5H19.5V6H6.5V4Z" fill="#0078D4" />
      {/* Notepad ruled lines */}
      <rect x="10" y="12" width="12" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="10" y="16" width="12" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="10" y="20" width="12" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="10" y="24" width="8" height="1.5" rx="0.75" fill="#94A3B8" />
    </svg>
  );
}

export function WindowsExeIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Windows application tile */}
      <rect x="4" y="5" width="24" height="22" rx="2.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M4 7C4 5.9 4.9 5 6 5H26C27.1 5 28 5.9 28 7V10H4V7Z" fill="#0078D4" />
      <circle cx="7" cy="7.5" r="1" fill="#FFFFFF" />
      <circle cx="10" cy="7.5" r="1" fill="#FFFFFF" />
      <circle cx="13" cy="7.5" r="1" fill="#FFFFFF" />
      {/* Center gear */}
      <circle cx="16" cy="18" r="4" stroke="#64748B" strokeWidth="2" fill="none" strokeDasharray="3 2" />
      <circle cx="16" cy="18" r="2" fill="#64748B" />
    </svg>
  );
}

export function WindowsGenericFileIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M6 4C6 2.9 6.9 2 8 2H19.5L26 8.5V28C26 29.1 25.1 30 24 30H8C6.9 30 6 29.1 6 28V4Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
      <path d="M19.5 2L26 8.5H20.5C19.95 8.5 19.5 8.05 19.5 7.5V2Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="10" y="14" width="12" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="10" y="18" width="12" height="1.5" rx="0.75" fill="#94A3B8" />
      <rect x="10" y="22" width="8" height="1.5" rx="0.75" fill="#94A3B8" />
    </svg>
  );
}

/**
 * Universal Windows File Explorer Icon Component
 * Resolves appropriate icon based on mime_type or filename extension.
 */
export default function WindowsFileIcon({ mimeType = '', filename = '', isFolder = false, className = 'w-5 h-5 shrink-0' }) {
  if (isFolder) {
    return <WindowsFolderIcon className={className} />;
  }

  const mime = (mimeType || '').toLowerCase();
  const lowerName = (filename || '').toLowerCase();
  const ext = lowerName.includes('.') ? lowerName.split('.').pop() : '';

  // PDF
  if (mime.includes('pdf') || ext === 'pdf') {
    return <WindowsPdfIcon className={className} />;
  }

  // Word
  if (
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml') ||
    ext === 'docx' ||
    ext === 'doc' ||
    ext === 'rtf' ||
    ext === 'odt'
  ) {
    return <WindowsWordIcon className={className} />;
  }

  // Excel
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    ext === 'xlsx' ||
    ext === 'xls' ||
    ext === 'csv' ||
    ext === 'tsv' ||
    ext === 'ods'
  ) {
    return <WindowsExcelIcon className={className} />;
  }

  // PowerPoint
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    ext === 'pptx' ||
    ext === 'ppt' ||
    ext === 'pps' ||
    ext === 'odp'
  ) {
    return <WindowsPowerPointIcon className={className} />;
  }

  // Images
  if (
    mime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif', 'heic', 'avif'].includes(ext)
  ) {
    return <WindowsImageIcon className={className} />;
  }

  // Video
  if (
    mime.startsWith('video/') ||
    ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'webm', 'flv', 'm4v', '3gp'].includes(ext)
  ) {
    return <WindowsVideoIcon className={className} />;
  }

  // Audio
  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg', 'wma', 'aiff'].includes(ext)
  ) {
    return <WindowsAudioIcon className={className} />;
  }

  // Zip / Archive
  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('tar') ||
    mime.includes('gzip') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'tgz'].includes(ext)
  ) {
    return <WindowsZipIcon className={className} />;
  }

  // Code / Web / Scripts
  if (
    mime.includes('javascript') ||
    mime.includes('json') ||
    mime.includes('html') ||
    mime.includes('xml') ||
    [
      'js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'json',
      'py', 'sql', 'xml', 'yaml', 'yml', 'sh', 'bat', 'cmd', 'ps1',
      'c', 'cpp', 'h', 'hpp', 'cs', 'java', 'go', 'rs', 'php', 'rb'
    ].includes(ext)
  ) {
    return <WindowsCodeIcon className={className} />;
  }

  // Text / Notepad
  if (
    mime.startsWith('text/') ||
    ['txt', 'log', 'md', 'markdown', 'ini', 'cfg', 'conf', 'env'].includes(ext)
  ) {
    return <WindowsTextIcon className={className} />;
  }

  // Executables
  if (['exe', 'msi', 'dll', 'sys', 'bin'].includes(ext)) {
    return <WindowsExeIcon className={className} />;
  }

  // Generic document fallback
  return <WindowsGenericFileIcon className={className} />;
}
