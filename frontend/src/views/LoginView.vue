<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('app.title') }}</span>
        </div>
      </template>

      <!--
        1. bind ref: ref="loginFormRef"
        2. bind data object: :model="loginForm"
        3. bind validation rules: :rules="loginRules"
      -->

      <!-- login form -->
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules">
        <!-- username input -->
        <el-form-item :label="$t('login.username')" prop="user_name">
          <el-input
            v-model="loginForm.user_name"
            :placeholder="$t('login.username')"
            data-cy="login-username-input"
          ></el-input>
        </el-form-item>

        <!-- password input -->
        <el-form-item :label="$t('login.password')" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            :placeholder="$t('login.password')"
            show-password
            data-cy="login-password-input"
          ></el-input>
        </el-form-item>

        <!-- login button -->
        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            @click="handleLogin"
            data-cy="login-submit-button"
            >{{ $t('login.login_button') }}</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/utils/api.js'
import { useRouter } from 'vue-router' // import Vue Router's useRouter
import { ElMessage } from 'element-plus' // import Element Plus's message component
import { useUserStore } from '@/stores/user'

// --- data and references ---
const loginForm = ref({
  user_name: '', // note: the field name must match the body field name in the backend API
  password: '',
})
const loginFormRef = ref(null)
const router = useRouter() // get router instance, used for page navigation

const userStore = useUserStore()

// --- validation rules ---
const loginRules = {
  user_name: [{ required: true, message: 'Enter username', trigger: 'blur' }],
  password: [{ required: true, message: 'Enter password', trigger: 'blur' }],
}

// --- core: login event handler ---
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      // --- task 1: implement API request ---
      try {
        const response = await api.post('/users/login', loginForm.value)
        const token = response.data.token

        // 1. Set the token in the store
        userStore.setToken(token)

        // 2. Fetch user profile
        await userStore.fetchUser()

        // --- task 2: handle successful response ---
        // 1. display success message
        ElMessage.success('Login successful!')

        // 2. redirect to dashboard page
        router.push('/dashboard')
      } catch (error) {
        // --- task 3: handle failed response ---
        console.error('Login failed:', error)

        // display a clear error message
        ElMessage.error('Username or password is incorrect, please try again!')
      }
    } else {
      console.log('Form validation failed')
      return false
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 400px;
}

.card-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}
</style>
