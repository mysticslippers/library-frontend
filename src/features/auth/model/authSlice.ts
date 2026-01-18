import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/shared/types/library";

type AuthState = {
    token: string | null;
    user: AuthUser | null;
};

const initialState: AuthState = {
    token: null,
    user: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setSession(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
            state.token = action.payload.token;
            state.user = action.payload.user;
        },
        clearSession(state) {
            state.token = null;
            state.user = null;
        },
    },
});

export const { setSession, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
