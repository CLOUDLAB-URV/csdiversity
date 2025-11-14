export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

type GtagEventParams = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  params?: Record<string, unknown>;
};

const canTrack = () =>
  typeof window !== "undefined" &&
  typeof window.gtag === "function" &&
  GA_MEASUREMENT_ID.length > 0;

export const trackPageView = (url: string) => {
  if (!canTrack()) return;
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

export const trackEvent = ({ action, category, label, value, params }: GtagEventParams) => {
  if (!canTrack()) return;
  const eventParams: Record<string, unknown> = {
    event_category: category,
    event_label: label,
    value,
    ...params,
  };

  Object.keys(eventParams).forEach((key) => {
    if (eventParams[key] === undefined || eventParams[key] === null) {
      delete eventParams[key];
    }
  });

  window.gtag("event", action, eventParams);
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag: (...args: any[]) => void;
  }
}

