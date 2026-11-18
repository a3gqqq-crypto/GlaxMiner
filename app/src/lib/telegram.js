// Thin, defensive wrapper around Telegram.WebApp. Every call is optional:
// older clients lack some methods, and a normal browser has none of them.
import { getPref } from "./prefs";

const BRAND_BG = "#0b0b0f";

export function tg() {
  return typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
}

function supports(version) {
  try {
    return Boolean(tg()?.isVersionAtLeast?.(version));
  } catch {
    return false;
  }
}

function safe(fn) {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

export function initTelegram() {
  const w = tg();
  if (!w) return;
  safe(() => w.ready());
  safe(() => w.expand());
  if (supports("6.1")) {
    safe(() => w.setHeaderColor(BRAND_BG));
    safe(() => w.setBackgroundColor(BRAND_BG));
  }
  if (supports("7.10")) safe(() => w.setBottomBarColor(BRAND_BG));
  // Stop a downward swipe on the core from closing the app (Bot API 7.7+)
  if (supports("7.7")) safe(() => w.disableVerticalSwipes());
}

export function isInTelegram() {
  return Boolean(tg()?.initData);
}

// Unsigned display copy of the Telegram user. Fine for showing a name or
// photo; the server never trusts it (it verifies the signed initData).
export function telegramUser() {
  return tg()?.initDataUnsafe?.user || null;
}

export function platform() {
  return tg()?.platform || "web";
}

export const haptic = {
  tap() {
    if (getPref("haptics") === false) return;
    safe(() => tg()?.HapticFeedback?.selectionChanged());
  },
  impact(style = "medium") {
    if (getPref("haptics") === false) return;
    safe(() => tg()?.HapticFeedback?.impactOccurred(style));
  },
  success() {
    if (getPref("haptics") === false) return;
    safe(() => tg()?.HapticFeedback?.notificationOccurred("success"));
  },
  error() {
    if (getPref("haptics") === false) return;
    safe(() => tg()?.HapticFeedback?.notificationOccurred("error"));
  },
};

// Telegram's native back button, wired to a handler while a sub-screen is open.
export function showBackButton(onBack) {
  const b = tg()?.BackButton;
  if (!b || !supports("6.1")) return () => {};
  safe(() => {
    b.onClick(onBack);
    b.show();
  });
  return () =>
    safe(() => {
      b.offClick(onBack);
      b.hide();
    });
}

export function openTelegramLink(url) {
  const w = tg();
  if (w?.openTelegramLink && supports("6.1")) {
    safe(() => w.openTelegramLink(url));
  } else {
    window.open(url, "_blank", "noopener");
  }
}

export function onViewportChange(cb) {
  const w = tg();
  if (!w?.onEvent) return () => {};
  safe(() => w.onEvent("viewportChanged", cb));
  return () => safe(() => w.offEvent("viewportChanged", cb));
}
