"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { dashboardApi, type DashboardSummary } from "./dashboard-client";
type State = {
  data: DashboardSummary | null;
  loading: boolean;
  error: string;
  year: number | undefined;
  setYear: (year: number) => void;
  retry: () => void;
};
const DashboardContext = createContext<State>({
  data: null,
  loading: true,
  error: "",
  year: undefined,
  setYear: () => {},
  retry: () => {},
});
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardSummary | null>(null),
    [year, setYear] = useState<number>(),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      setData(null);
      try {
        const value = await dashboardApi.summary(year);
        if (active) setData(value);
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Dashboard unavailable");
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [year, revision]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("finance-settings-saved", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("finance-settings-saved", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return (
    <DashboardContext.Provider
      value={{
        data,
        year,
        setYear,
        loading,
        error,
        retry: () => setRevision((v) => v + 1),
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
export const useDashboard = () => useContext(DashboardContext);
