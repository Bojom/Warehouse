<template>
  <div class="register-view">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('register.create_new_user') }}</span>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="registerFormRef" label-width="200px">
        <el-form-item :label="$t('register.username')" prop="username">
          <el-input v-model="form.username" :placeholder="$t('register.enter_username')"></el-input>
        </el-form-item>
        <el-form-item :label="$t('register.password')" prop="password">
          <el-input
            type="password"
            v-model="form.password"
            :placeholder="$t('register.enter_password')"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('register.confirm_password')" prop="confirmPassword">
          <el-input
            type="password"
            v-model="form.confirmPassword"
            :placeholder="$t('register.confirm_your_password')"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('register.role')" prop="role">
          <el-select v-model="form.role" :placeholder="$t('register.select_role')">
            <el-option :label="$t('register.admin')" value="admin"></el-option>
            <el-option :label="$t('register.operator')" value="operator"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">{{
            $t('register.create_user')
          }}</el-button>
          <el-button @click="handleReset">{{ $t('register.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { registerUser } from '@/api/user.api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const registerFormRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  role: 'operator',
})

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error(t('register.confirm_password_required')))
  } else if (value !== form.password) {
    callback(new Error(t('register.passwords_dont_match')))
  } else {
    callback()
  }
}

const rules = computed(() => ({
  username: [{ required: true, message: t('register.username_required'), trigger: 'blur' }],
  password: [
    { required: true, message: t('register.password_required'), trigger: 'blur' },
    { min: 6, message: t('register.password_min_length'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('register.confirm_password_required'), trigger: 'blur' },
    { validator: validatePass, trigger: 'blur' },
  ],
  role: [{ required: true, message: t('register.role_required'), trigger: 'change' }],
}))

const handleSubmit = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const userData = {
          user_name: form.username,
          password: form.password,
          user_role: form.role,
        }
        await registerUser(userData)
        ElMessage.success(t('register.user_created_successfully'))
        handleReset() // Clear form for next entry
      } catch (error) {
        ElMessage.error(error.response?.data?.message || t('register.failed_to_create_user'))
      } finally {
        loading.value = false
      }
    }
  })
}

const handleReset = () => {
  if (!registerFormRef.value) return
  registerFormRef.value.resetFields()
}
</script>

<style scoped>
.register-view {
  padding: 20px;
}
.form-card {
  max-width: 600px;
  margin: 0 auto;
}
</style>
