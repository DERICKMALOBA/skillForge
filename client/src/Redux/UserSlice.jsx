import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // REGISTER
    registerStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    registerFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // LOGIN (these were missing)
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      sessionStorage.setItem("user", JSON.stringify(action.payload.user));
      sessionStorage.setItem("token", action.payload.token);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // LOGOUT
    logoutUser: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    },

    // ERROR CLEAR
    clearError: (state) => {
      state.error = null;
    },

    // LOCAL STORAGE LOAD
    setUserFromLocalStorage: (state) => {
      const user = JSON.parse( sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      if (user && token) {
        state.user = user;
        state.token = token;
      }
    },
  },
});

export const {
  registerStart,
  registerSuccess,
  registerFailure,
  loginStart,
  loginSuccess,
  loginFailure,
  logoutUser,
  clearError,
  setUserFromLocalStorage,
} = userSlice.actions;

export default userSlice.reducer;
