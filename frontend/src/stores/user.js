// frontend/src/stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

// 定义一个名为 'user' 的 store
export const useUserStore = defineStore('user', () => {
  // --- State ---
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  let fetchUserPromise = null;

  // --- Getters ---
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userName = computed(() => user.value?.user_name ?? 'N/A')

  // --- Actions ---
  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  function setUser(newUser) {
    user.value = newUser
    // Also store the role in localStorage for the router guard
    if (newUser && newUser.role) {
      localStorage.setItem('userRole', newUser.role)
    } else {
      localStorage.removeItem('userRole')
    }
  }

  async function fetchUser() {
    if (!token.value) {
      return Promise.resolve();
    }
    // if a fetch is already in progress, return the existing promise
    if (fetchUserPromise) {
      return fetchUserPromise;
    }

    // start a new fetch
    fetchUserPromise = (async () => {
      try {
        const response = await api.get('/users/profile');
        if (response.data && response.data.userProfile) {
          setUser(response.data.userProfile);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        logout();
      } finally {
        // after the fetch is complete, reset the promise
        fetchUserPromise = null;
      }
    })();
    return fetchUserPromise;
  }

  function logout() {
    setUser(null)
    setToken(null)
  }

  return { user, token, isAuthenticated, isAdmin, userName, setUser, setToken, fetchUser, logout }
})
