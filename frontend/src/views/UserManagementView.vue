<template>
  <div class="user-management-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('user_management.title') }}</span>
        </div>
      </template>

      <el-table :data="users" v-loading="loading" border>
        <el-table-column prop="id" :label="$t('user_management.id')" width="80"></el-table-column>
        <el-table-column
          prop="user_name"
          :label="$t('user_management.username')"
        ></el-table-column>
        <el-table-column :label="$t('user_management.role')">
          <template #default="scope">
            <el-select
              :model-value="scope.row.user_role"
              @change="(newRole) => handleRoleChange(scope.row.id, newRole)"
              :disabled="scope.row.id === userStore.user?.id"
            >
              <el-option :label="$t('user_management.admin')" value="admin"></el-option>
              <el-option :label="$t('user_management.operator')" value="operator"></el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column :label="$t('user_management.status')">
          <template #default="scope">
            <el-select
              :model-value="scope.row.status"
              @change="(newStatus) => handleStatusChange(scope.row.id, newStatus)"
              :disabled="scope.row.id === userStore.user?.id"
            >
              <el-option :label="$t('user_management.active')" value="active"></el-option>
              <el-option :label="$t('user_management.pending')" value="pending"></el-option>
              <el-option :label="$t('user_management.paused')" value="paused"></el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column :label="$t('user_management.creation_time')" width="200">
          <template #default="scope">{{
            new Date(scope.row.creation_time).toLocaleString()
          }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { getAllUsers, updateUserRole, updateUserStatus } from '@/api/user.api'

const { t } = useI18n()
const users = ref([])
const loading = ref(false)
const userStore = useUserStore()

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await getAllUsers()
    users.value = response.data
  } catch {
    ElMessage.error(t('user_management.fetch_users_fail'))
  } finally {
    loading.value = false
  }
}

const handleRoleChange = async (userId, newRole) => {
  try {
    await updateUserRole(userId, newRole)
    ElMessage.success(t('user_management.update_role_success'))
    // Find the user and update their role locally to reflect the change immediately
    const user = users.value.find((u) => u.id === userId)
    if (user) user.user_role = newRole
  } catch {
    ElMessage.error(t('user_management.update_role_fail'))
    fetchUsers() // Refetch to revert optimistic update
  }
}

const handleStatusChange = async (userId, newStatus) => {
  try {
    await updateUserStatus(userId, newStatus)
    ElMessage.success(t('user_management.update_status_success'))
    // Find the user and update their status locally
    const user = users.value.find((u) => u.id === userId)
    if (user) user.status = newStatus
  } catch {
    ElMessage.error(t('user_management.update_status_fail'))
    fetchUsers() // Refetch to revert optimistic update
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management-view {
  padding: 20px;
}
</style>
