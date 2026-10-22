import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { store as defaultStore } from "../store/store";
import type { AppStore } from "../store/store";

export function AppProviders({
  children,
  store = defaultStore,
}: {
  children: ReactNode;
  store?: AppStore;
}) {
  return <Provider store={store}>{children}</Provider>;
}
