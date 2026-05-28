import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { listOrgs } from '../libs/api/orgs.js';
import { can as canFor } from '../utils/permissions.js';
import { useResource } from '../utils/useResource.js';
import { useAuth } from './AuthContext.jsx';

const OrgContext = createContext(null);

const ORG_KEY = 'c8r.org';
const EMPTY = [];

const readOrgId = () => {
  try {
    return window.localStorage.getItem(ORG_KEY);
  } catch {
    return null;
  }
};

const writeOrgId = (id) => {
  try {
    window.localStorage.setItem(ORG_KEY, id);
  } catch {
    // Storage is blocked. The selection then resets on reload.
  }
};

// The org list carries the caller's role on each org, so no extra member lookup is needed.
export function OrgProvider({ children }) {
  const { status: authStatus } = useAuth();
  const signedIn = authStatus === 'authenticated';
  const [storedId, setStoredId] = useState(readOrgId);

  const orgsRes = useResource(
    () => (signedIn ? listOrgs({ limit: 100 }) : Promise.resolve({ data: EMPTY, meta: null })),
    [signedIn],
  );

  const orgs = useMemo(() => orgsRes.data ?? EMPTY, [orgsRes.data]);
  const org = orgs.find((o) => o.id === storedId) ?? orgs[0] ?? null;
  const orgId = org?.id ?? null;
  const role = org?.role ?? null;

  const setOrgId = useCallback((id) => {
    writeOrgId(id);
    setStoredId(id);
  }, []);

  const can = useCallback((action) => canFor(role, action, 'org'), [role]);

  const value = useMemo(
    () => ({
      orgs,
      org,
      orgId,
      setOrgId,
      role,
      can,
      reload: orgsRes.reload,
      status: orgsRes.status,
      error: orgsRes.error,
    }),
    [orgs, org, orgId, setOrgId, role, can, orgsRes.reload, orgsRes.status, orgsRes.error],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const value = useContext(OrgContext);
  if (!value) throw new Error('useOrg must be used inside OrgProvider');
  return value;
}
