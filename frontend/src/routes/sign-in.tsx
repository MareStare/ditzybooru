import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '#/components/ui/Button';
import { Field, FieldLabel } from '#/components/ui/Field';
import { HCaptcha } from '#/components/ui/HCaptcha';
import { Notice, NoticeTitle } from '#/components/ui/Notice';
import { Panel, PanelBody, PanelHeader } from '#/components/ui/Panel';
import { SESSION_QUERY_KEY } from '#/hooks/use-session';
import { useDataSource } from '#/hooks/use-data-source';
import { useSite } from '#/hooks/use-site';
import { fetchLoginCaptcha, signIn, SignInRejected } from '#/lib/api/backend/session';

export const Route = createFileRoute('/sign-in')({ component: SignInPage });

function SignInPage() {
  const site = useSite();
  const kind = useDataSource();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<null | string>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<null | string>(null);
  // Browser only: the captcha is not part of the server render.
  const { data: siteKey, isError: captchaUnavailable } = useQuery({
    queryKey: ['login-captcha'],
    queryFn: fetchLoginCaptcha,
    enabled: kind === 'live' && typeof window !== 'undefined',
    staleTime: 60 * 60_000,
  });

  const ready = kind === 'live' && siteKey !== undefined && (siteKey === null || captchaToken !== null);

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    setBusy(true);
    setProblem(null);
    signIn({ email, password, rememberMe, captchaToken }).then(
      session => {
        queryClient.setQueryData(SESSION_QUERY_KEY, session);
        void navigate({ to: '/' });
      },
      (error: unknown) => {
        setBusy(false);
        // A captcha token works once, so the visitor has to solve another.
        setCaptchaToken(null);
        setProblem(error instanceof SignInRejected ? error.message : 'Could not reach the site. Try again.');
      },
    );
  };

  return (
    <div className="developer-page">
      <h1 className="developer-page__title">Sign in to {site.name}</h1>

      {kind === 'live' ? null : (
        <Notice>
          <NoticeTitle>Mock data is on</NoticeTitle>
          Signing in needs the live data source. Switch to it in the developer settings.
        </Notice>
      )}

      <Panel>
        <PanelHeader>Sign in</PanelHeader>
        <PanelBody>
          <form className="developer-setting" onSubmit={submit}>
            <div className="developer-setting__text">
              <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
              <Field
                id="sign-in-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={event => {
                  setEmail(event.target.value);
                }}
              />
            </div>
            <div className="developer-setting__text">
              <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
              <Field
                id="sign-in-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={event => {
                  setPassword(event.target.value);
                }}
              />
            </div>
            <label className="developer-setting__hint">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={event => {
                  setRememberMe(event.target.checked);
                }}
              />{' '}
              Remember me
            </label>
            {typeof siteKey === 'string' ? (
              <HCaptcha
                // A new widget after a failed try, as the old token is spent.
                key={problem ?? 'first'}
                siteKey={siteKey}
                onToken={setCaptchaToken}
                onError={() => {
                  setCaptchaFailed(true);
                }}
              />
            ) : null}
            <span className="developer-setting__hint" role="status">
              {problem}
              {captchaFailed ? 'The captcha could not be loaded.' : null}
              {captchaUnavailable ? `Could not reach ${site.name} to start the sign-in.` : null}
            </span>
            <div>
              <Button type="submit" variant="primary" disabled={!ready || busy}>
                Sign in
              </Button>
            </div>
          </form>
        </PanelBody>
      </Panel>
    </div>
  );
}
