// Original stroke icon set (24px grid, 1.75 stroke), drawn for GlaxMiner.
const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const make = (paths) =>
  function Icon({ size = 24, ...rest }) {
    return (
      <svg {...base} width={size} height={size} {...rest}>
        {paths}
      </svg>
    );
  };

export const IconOutpost = make(<><path d="M12 2.5l8 4.8v9.4l-8 4.8-8-4.8V7.3z" /><path d="M12 2.5v19" /><path d="M4 7.3l8 4.7 8-4.7" /></>);
export const IconLab = make(<><path d="M9 3h6" /><path d="M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3" /><path d="M7.5 15h9" /></>);
export const IconContracts = make(<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2.5h6V4" /><path d="M9 13l2 2 4-4" /></>);
export const IconRanks = make(<><path d="M6 20v-7" /><path d="M12 20V5" /><path d="M18 20v-10" /><path d="M3 20h18" /></>);
export const IconVault = make(<><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18" /><path d="M15.5 15h2.5" /></>);
export const IconBolt = make(<path d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12z" />);
export const IconClock = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconArrowUp = make(<><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></>);
export const IconLock = make(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const IconCheck = make(<path d="M5 12l5 5 9-10" />);
export const IconChevron = make(<path d="M9 6l6 6-6 6" />);
export const IconUsers = make(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>);
export const IconShare = make(<><path d="M12 15V3" /><path d="M7 8l5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>);
export const IconShield = make(<><path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>);
export const IconSpark = make(<><path d="M12 3v4" /><path d="M12 17v4" /><path d="M3 12h4" /><path d="M17 12h4" /><path d="M6 6l2.5 2.5" /><path d="M15.5 15.5L18 18" /><path d="M18 6l-2.5 2.5" /><path d="M8.5 15.5L6 18" /></>);
export const IconRefresh = make(<><path d="M20 11a8 8 0 0 0-14.6-4.5" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.6 4.5" /><path d="M20 20v-4h-4" /></>);
export const IconDown = make(<><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></>);
export const IconSettings = make(<><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M4.2 6.5l2.6 1.5M17.2 16l2.6 1.5M4.2 17.5l2.6-1.5M17.2 8l2.6-1.5" /></>);
export const IconCalendar = make(<><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17" /><path d="M8 3v4M16 3v4" /></>);
export const IconFlame = make(<path d="M12 21c4 0 7-2.7 7-6.6 0-3-1.8-5.2-3.6-7.1-.4 2-1.4 3.2-2.7 3.7.4-3.3-.9-6.3-3.7-8-.1 3.2-1.6 5.1-3.1 6.9C4.6 11.4 5 12.7 5 14.4 5 18.3 8 21 12 21z" />);
export const IconMap = make(<><path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z" /><path d="M9 4v13.5M15 6.5V20" /></>);
export const IconInfo = make(<><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7.5v.01" /></>);
export const IconX = make(<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>);
export const IconCrown = make(<><path d="M3.5 8l4.5 4 4-7 4 7 4.5-4-2 11h-13z" /></>);
