import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./tailwind.css";
import "./index.scss";
import { StoreProvider } from "./app/providers/StoreProvider";
import { getCurrentSession } from "./shared/api/authApi";
import { store } from "./app/store";
import { markInitialized, setSession } from "./features/auth/model/authSlice";

const session = getCurrentSession();
if (session) {
    store.dispatch(setSession(session));
} else {
    store.dispatch(markInitialized());
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <StoreProvider>
            <App />
        </StoreProvider>
    </React.StrictMode>
);
