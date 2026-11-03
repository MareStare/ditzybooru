import { useEffect, useRef } from 'react';

/** The part of hCaptcha's browser API this uses. */
interface HCaptchaApi {
  render: (
    container: HTMLElement,
    options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    hcaptcha?: HCaptchaApi;
  }
}

const SCRIPT_URL = 'https://js.hcaptcha.com/1/api.js?render=explicit';

let loading: Promise<HCaptchaApi> | undefined;

/** Loads hCaptcha's script once and resolves with its API. */
function load(): Promise<HCaptchaApi> {
  loading ??= new Promise<HCaptchaApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.hcaptcha === undefined) {
        reject(new Error('hCaptcha loaded without its API'));
      } else {
        resolve(window.hcaptcha);
      }
    };
    script.onerror = () => {
      // Let the next try load it again.
      loading = undefined;
      reject(new Error('Could not load hCaptcha'));
    };
    document.head.append(script);
  });

  return loading;
}

interface HCaptchaProps {
  siteKey: string;
  /** Called with the token when the visitor solves it, and with `null` when it runs out. */
  onToken: (token: null | string) => void;
  /** Called when the widget could not be shown at all. */
  onError: () => void;
}

/** The captcha widget the site's sign-in asks for. */
export function HCaptcha({ siteKey, onToken, onError }: HCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // The latest callbacks, without re-rendering the widget when they change.
  const handlersRef = useRef({ onToken, onError });
  useEffect(() => {
    handlersRef.current = { onToken, onError };
  });

  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;
    const element = containerRef.current;
    if (element === null) {
      return;
    }
    load().then(
      api => {
        if (cancelled) {
          return;
        }
        widgetId = api.render(element, {
          sitekey: siteKey,
          callback: token => {
            handlersRef.current.onToken(token);
          },
          'expired-callback': () => {
            handlersRef.current.onToken(null);
          },
        });
      },
      () => {
        handlersRef.current.onError();
      },
    );

    return () => {
      cancelled = true;
      if (widgetId !== undefined) {
        window.hcaptcha?.remove(widgetId);
      }
    };
  }, [siteKey]);

  return <div ref={containerRef} />;
}
