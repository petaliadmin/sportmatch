"use client";
import { User, UserManager, WebStorageStateStore } from "oidc-client-ts";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM, KEYCLOAK_URL, apiEnabled } from "./config";

/**
 * Session Keycloak via OpenID Connect + PKCE (aucun secret côté navigateur).
 * Le jeton d'accès est conservé en sessionStorage (fermé avec l'onglet) et renouvelé en silence.
 */
export interface SessionUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  roles: string[];
  accessToken: string;
}

interface SessionCtx {
  ready: boolean;
  user: SessionUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  token: () => Promise<string | null>;
}

const Ctx = createContext<SessionCtx | null>(null);
const RETURN_ROUTE_KEY = "sportmatch.returnRoute";

let manager: UserManager | null = null;
function getManager(): UserManager {
  if (!manager) {
    const base = window.location.origin + window.location.pathname;
    manager = new UserManager({
      authority: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
      client_id: KEYCLOAK_CLIENT_ID,
      redirect_uri: base,
      post_logout_redirect_uri: base,
      response_type: "code",
      scope: "openid profile email",
      automaticSilentRenew: true,
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    });
  }
  return manager;
}

function toSessionUser(u: User | null): SessionUser | null {
  if (!u || u.expired) return null;
  const p = u.profile as Record<string, unknown>;
  const realmAccess = (p.realm_access as { roles?: string[] } | undefined) ?? decodeRoles(u.access_token);
  return {
    id: String(p.sub),
    name: String(p.name ?? p.preferred_username ?? "Joueur·se"),
    username: String(p.preferred_username ?? ""),
    email: p.email ? String(p.email) : undefined,
    roles: realmAccess?.roles ?? [],
    accessToken: u.access_token,
  };
}

function decodeRoles(token: string): { roles?: string[] } | undefined {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.realm_access;
  } catch {
    return undefined;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!apiEnabled);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (!apiEnabled) return;
    const m = getManager();
    const params = new URLSearchParams(window.location.search);
    const init = async () => {
      try {
        if (params.has("code") && params.has("state")) {
          const u = await m.signinRedirectCallback();
          setUser(toSessionUser(u));
          const back = sessionStorage.getItem(RETURN_ROUTE_KEY) ?? "live";
          sessionStorage.removeItem(RETURN_ROUTE_KEY);
          history.replaceState(null, "", window.location.pathname + "#" + back);
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        } else {
          setUser(toSessionUser(await m.getUser()));
        }
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    };
    init();
    const onLoaded = (u: User) => setUser(toSessionUser(u));
    const onUnloaded = () => setUser(null);
    m.events.addUserLoaded(onLoaded);
    m.events.addUserUnloaded(onUnloaded);
    return () => {
      m.events.removeUserLoaded(onLoaded);
      m.events.removeUserUnloaded(onUnloaded);
    };
  }, []);

  const login = useCallback(async () => {
    sessionStorage.setItem(RETURN_ROUTE_KEY, window.location.hash.replace(/^#/, "") || "live");
    await getManager().signinRedirect();
  }, []);

  const logout = useCallback(async () => {
    const m = getManager();
    const u = await m.getUser();
    await m.removeUser();
    setUser(null);
    if (u?.id_token) await m.signoutRedirect({ id_token_hint: u.id_token });
  }, []);

  const token = useCallback(async () => {
    if (!apiEnabled) return null;
    const u = await getManager().getUser();
    return u && !u.expired ? u.access_token : null;
  }, []);

  const value = useMemo(() => ({ ready, user, login, logout, token }), [ready, user, login, logout, token]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSession outside SessionProvider");
  return c;
}
