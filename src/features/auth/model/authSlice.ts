import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/shared/types/library";

type AuthState = {
    token: string | null;
    user: AuthUser | null;
    initialized: boolean;
};

const initialState: AuthState = {
    token: null,
    user: null,
    initialized: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setSession(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.initialized = true;
        },
        clearSession(state) {
            state.token = null;
            state.user = null;
            state.initialized = true;
        },
        markInitialized(state) {
            state.initialized = true;
        },
    },
});

export const { setSession, clearSession, markInitialized } = authSlice.actions;
export const authReducer = authSlice.reducer;
