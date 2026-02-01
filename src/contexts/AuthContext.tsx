import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "moderator" | "user" | "parent" | "school_admin" | "partner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  isSchoolAdmin: boolean;
  isPartner: boolean;
  isParent: boolean;
  schoolId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role checks with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkUserRoles(session.user.id);
          }, 0);
        } else {
          resetRoles();
        }
      }
    );

    // Async initialization
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkUserRoles(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const resetRoles = () => {
    setRoles([]);
    setIsAdmin(false);
    setIsSchoolAdmin(false);
    setIsPartner(false);
    setIsParent(false);
    setSchoolId(null);
  };

  const checkUserRoles = async (userId: string) => {
    try {
      // Fetch all user roles in one query
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role, school_id")
        .eq("user_id", userId);

      if (userRoles && userRoles.length > 0) {
        // Cast roles to AppRole (database may have more roles than TypeScript knows)
        const roleList = userRoles.map(r => r.role as unknown as AppRole);
        setRoles(roleList);
        
        // Set convenience booleans
        setIsAdmin(roleList.includes("admin"));
        setIsSchoolAdmin(roleList.includes("school_admin"));
        setIsPartner(roleList.includes("partner"));
        setIsParent(roleList.includes("parent") || roleList.includes("user"));
        
        // Get school_id for school admins - cast role for comparison
        const schoolAdminRole = userRoles.find(r => (r.role as unknown as string) === "school_admin");
        setSchoolId(schoolAdminRole?.school_id ?? null);
      } else {
        // Default to parent role for authenticated users without explicit roles
        setRoles(["parent"]);
        setIsParent(true);
        setIsAdmin(false);
        setIsSchoolAdmin(false);
        setIsPartner(false);
        setSchoolId(null);
      }
    } catch (error) {
      console.error("Error checking user roles:", error);
      resetRoles();
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role) || isAdmin; // Admin has all roles
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signInWithMagicLink = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    resetRoles();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        isAdmin,
        isSchoolAdmin,
        isPartner,
        isParent,
        schoolId,
        isLoading,
        signIn,
        signUp,
        signInWithMagicLink,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
