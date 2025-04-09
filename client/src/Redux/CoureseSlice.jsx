// coursesSlice.js
import { createSlice } from '@reduxjs/toolkit';

const coursesSlice = createSlice({
  name: 'courses',
  initialState: {
    lecturerCourses: [],
    studentCourses: [],
    loading: false,
    error: null
  },
  reducers: {
    setLecturerCourses: (state, action) => {
      state.lecturerCourses = action.payload;
    },
    setStudentCourses: (state, action) => {
      state.studentCourses = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { 
  setLecturerCourses, 
  setStudentCourses,
  setLoading,
  setError 
} = coursesSlice.actions;

export default coursesSlice.reducer;