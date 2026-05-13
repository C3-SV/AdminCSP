"use client";

import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "@/lib/firebase";
import {
  normalizeAdminEmail,
  resolveAdminAuthorization,
} from "@/services/admin/allowlist";
import { AdminAllowlistEntry } from "@/types/admin/auth";

type AdminAuthContextValue = {
  user: User | null;
  adminProfile: AdminAllowlistEntry | null;
  loadingAuth: boolean;
  loadingAuthorization: boolean;
  loading: boolean;
  isAuthorizedAdmin: boolean;
  isOwner: boolean;
  authError: string;
  loginWithGoogle: () => Promise<void>;
  clearAuthError: () => void;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminAllowlistEntry | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(Boolean(auth));
  const [loadingAuthorization, setLoadingAuthorization] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) {
      return;
    }

    let mounted = true;
    let authorizationRequestId = 0;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      authorizationRequestId += 1;
      const requestId = authorizationRequestId;

      setUser(nextUser);
      setLoadingAuth(false);

      if (!nextUser) {
        setAdminProfile(null);
        setLoadingAuthorization(false);
        return;
      }

      setAuthError("");

      if (!nextUser.email) {
        setAdminProfile(null);
        setLoadingAuthorization(false);
        setAuthError("Tu cuenta no tiene correo disponible para validacion.");
        void signOut(firebaseAuth);
        return;
      }

      setLoadingAuthorization(true);

      void (async () => {
        try {
          // Force token refresh so Firestore rules receive the latest auth token claims.
          await nextUser.getIdToken(true);

          const normalizedEmail = normalizeAdminEmail(nextUser.email ?? "");
          const authorizationResult = await resolveAdminAuthorization(normalizedEmail);

          if (!mounted || requestId !== authorizationRequestId) {
            return;
          }

          if (!authorizationResult.authorized || !authorizationResult.entry) {
            setAdminProfile(null);
            setAuthError("Tu correo no esta autorizado para ingresar al panel admin.");
            await signOut(firebaseAuth);
            return;
          }

          setAdminProfile(authorizationResult.entry);
        } catch (error) {
          if (!mounted || requestId !== authorizationRequestId) {
            return;
          }

          console.error("No se pudo validar autorizacion admin:", error);
          setAdminProfile(null);
          if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "permission-denied"
          ) {
            setAuthError("Tu correo no esta autorizado para ingresar al panel admin.");
          } else {
            setAuthError("No se pudo validar tu acceso admin. Intenta nuevamente.");
          }
          await signOut(firebaseAuth);
        } finally {
          if (mounted && requestId === authorizationRequestId) {
            setLoadingAuthorization(false);
          }
        }
      })();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const firebaseAuth = auth;
    if (!firebaseAuth) {
      throw new Error("Firebase Auth no esta disponible. Revisa la configuracion.");
    }

    setAuthError("");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(firebaseAuth, provider);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError("");
  }, []);

  const logout = useCallback(async () => {
    const firebaseAuth = auth;
    if (!firebaseAuth) return;
    setAuthError("");
    setAdminProfile(null);
    await signOut(firebaseAuth);
  }, []);

  const loading = loadingAuth || loadingAuthorization;
  const isAuthorizedAdmin = Boolean(user && adminProfile?.active);
  const isOwner = adminProfile?.role === "owner";

  const value = useMemo(
    () => ({
      user,
      adminProfile,
      loadingAuth,
      loadingAuthorization,
      loading,
      isAuthorizedAdmin,
      isOwner,
      authError,
      loginWithGoogle,
      clearAuthError,
      logout,
    }),
    [
      adminProfile,
      authError,
      clearAuthError,
      isAuthorizedAdmin,
      isOwner,
      loading,
      loadingAuth,
      loadingAuthorization,
      loginWithGoogle,
      logout,
      user,
    ],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth debe usarse dentro de AdminAuthProvider.");
  }
  return context;
}
