//! The cookies one API call carries to the upstream and back.
//!
//! Stateless on purpose: nothing is kept between requests. The visitor's
//! browser holds the upstream session cookie (on our domain), sends it with
//! each call, and the call forwards it. Within one call a login or a form
//! needs a few requests in a row, which share this small jar, and whatever
//! the upstream sets is returned to the browser as it came.

use std::{collections::BTreeMap, fmt::Write as _, sync::Mutex};

use reqwest::header::{HeaderMap, SET_COOKIE};

/// The only cookies that cross. Everything else the upstream sets stays out of
/// the visitor's browser, and nothing else the browser holds reaches the
/// upstream.
const CROSSING: &[&str] = &["_philomena_key", "_ses", "user_totp_auth"];

/// A cookie the upstream set, to be passed on to the visitor.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SetCookie {
    name: String,
    value: String,
    max_age: Option<i64>,
    expires: Option<String>,
    http_only: bool,
    same_site: Option<String>,
}

impl SetCookie {
    /// Reads one `Set-Cookie` header value. `Domain` is dropped on purpose:
    /// the cookie belongs to our domain, not the upstream's.
    fn parse(header: &str) -> Option<Self> {
        let mut parts = header.split(';');
        let (name, value) = parts.next()?.split_once('=')?;
        let mut cookie = Self {
            name: name.trim().to_owned(),
            value: value.trim().to_owned(),
            max_age: None,
            expires: None,
            http_only: false,
            same_site: None,
        };
        for attribute in parts {
            let (key, value) = attribute
                .split_once('=')
                .map_or((attribute, ""), |(key, value)| (key, value));
            match key.trim().to_ascii_lowercase().as_str() {
                "max-age" => cookie.max_age = value.trim().parse().ok(),
                "expires" => cookie.expires = Some(value.trim().to_owned()),
                "httponly" => cookie.http_only = true,
                "samesite" => cookie.same_site = Some(value.trim().to_owned()),
                _ => {}
            }
        }
        Some(cookie)
    }

    /// Whether this cookie deletes the browser's copy.
    fn expires_now(&self) -> bool {
        self.value.is_empty() || self.max_age.is_some_and(|age| age <= 0)
    }

    /// The `Set-Cookie` value to send the visitor. `secure` is whether the
    /// visitor reached us over https.
    pub fn header(&self, secure: bool) -> String {
        let mut header = format!("{}={}; Path=/", self.name, self.value);
        if let Some(age) = self.max_age {
            let _ = write!(header, "; Max-Age={age}");
        }
        if let Some(expires) = &self.expires {
            let _ = write!(header, "; Expires={expires}");
        }
        if self.http_only {
            header.push_str("; HttpOnly");
        }
        let _ = write!(
            header,
            "; SameSite={}",
            self.same_site.as_deref().unwrap_or("Lax")
        );
        if secure {
            header.push_str("; Secure");
        }
        header
    }
}

/// The cookies of one API call.
#[derive(Debug, Default)]
pub struct Session {
    jar: Mutex<BTreeMap<String, String>>,
    set: Mutex<Vec<SetCookie>>,
}

impl Session {
    /// Starts from the visitor's `Cookie` header, keeping the cookies that cross.
    pub fn from_cookie_header(header: &str) -> Self {
        let jar = header
            .split(';')
            .filter_map(|pair| pair.split_once('='))
            .map(|(name, value)| (name.trim(), value.trim()))
            .filter(|(name, _)| CROSSING.contains(name))
            .map(|(name, value)| (name.to_owned(), value.to_owned()))
            .collect();
        Self {
            jar: Mutex::new(jar),
            set: Mutex::new(vec![]),
        }
    }

    /// The `Cookie` header for the next upstream request.
    pub fn cookie_header(&self) -> Option<String> {
        let jar = self
            .jar
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        if jar.is_empty() {
            return None;
        }
        Some(
            jar.iter()
                .map(|(name, value)| format!("{name}={value}"))
                .collect::<Vec<_>>()
                .join("; "),
        )
    }

    /// Takes in what an upstream response sets.
    pub fn absorb(&self, headers: &HeaderMap) {
        for value in headers.get_all(SET_COOKIE) {
            let Some(cookie) = value.to_str().ok().and_then(SetCookie::parse) else {
                continue;
            };
            if !CROSSING.contains(&cookie.name.as_str()) {
                continue;
            }
            let mut jar = self
                .jar
                .lock()
                .unwrap_or_else(std::sync::PoisonError::into_inner);
            if cookie.expires_now() {
                jar.remove(&cookie.name);
            } else {
                jar.insert(cookie.name.clone(), cookie.value.clone());
            }
            drop(jar);
            let mut set = self
                .set
                .lock()
                .unwrap_or_else(std::sync::PoisonError::into_inner);
            // The last word on a cookie wins.
            set.retain(|earlier| earlier.name != cookie.name);
            set.push(cookie);
        }
    }

    /// The cookies to hand back to the visitor.
    pub fn into_set_cookies(self) -> Vec<SetCookie> {
        self.set
            .into_inner()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }
}

#[cfg(test)]
mod tests {
    use reqwest::header::HeaderValue;

    use super::*;

    #[test]
    fn only_the_crossing_cookies_are_kept() {
        let session = Session::from_cookie_header(
            "a=1; _philomena_key=XCP.abc; ditzy-settings=%7B%7D; _ses=f",
        );
        assert_eq!(
            session.cookie_header().as_deref(),
            Some("_philomena_key=XCP.abc; _ses=f")
        );
        assert!(Session::from_cookie_header("a=1").cookie_header().is_none());
    }

    #[test]
    fn what_the_upstream_sets_is_absorbed_and_passed_on() {
        let session = Session::from_cookie_header("_philomena_key=old");
        let mut headers = HeaderMap::new();
        headers.append(
            SET_COOKIE,
            HeaderValue::from_static(
                "_philomena_key=new; path=/; domain=example.org; max-age=3600; HttpOnly; SameSite=Lax",
            ),
        );
        headers.append(SET_COOKIE, HeaderValue::from_static("tracking=x; path=/"));
        session.absorb(&headers);
        // The next request carries the new value, and only the crossing cookie.
        assert_eq!(
            session.cookie_header().as_deref(),
            Some("_philomena_key=new")
        );
        let set = session.into_set_cookies();
        let [cookie] = set.as_slice() else {
            panic!("exactly the crossing cookie is passed on");
        };
        // No Domain: the cookie belongs to our domain.
        assert_eq!(
            cookie.header(false),
            "_philomena_key=new; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax"
        );
        assert!(cookie.header(true).ends_with("; Secure"));
    }

    #[test]
    fn an_expired_cookie_is_forgotten() {
        let session = Session::from_cookie_header("_philomena_key=old");
        let mut headers = HeaderMap::new();
        headers.append(
            SET_COOKIE,
            HeaderValue::from_static("_philomena_key=; max-age=0; path=/"),
        );
        session.absorb(&headers);
        assert!(session.cookie_header().is_none());
        assert_eq!(
            session.into_set_cookies().len(),
            1,
            "the browser must be told too"
        );
    }
}
