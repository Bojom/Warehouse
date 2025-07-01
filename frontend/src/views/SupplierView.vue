<!-- frontend/src/views/SupplierView.vue -->
<template>
  <div class="supplier-view">
    <!-- 1. Top Toolbar -->
    <el-card class="toolbar">
      <div>
        <el-button type="primary" @click="handleOpenAddDialog" data-cy="add-supplier-button">
          {{ $t('suppliers.add_supplier') }}
        </el-button>
      </div>
    </el-card>

    <!-- 2. Data Table -->
    <el-card>
      <el-table
        :data="suppliersList"
        v-loading="loading"
        style="width: 100%"
        data-cy="suppliers-table"
      >
        <el-table-column prop="supplier_name" :label="$t('suppliers.supplier_name')" />
        <el-table-column prop="contact" :label="$t('suppliers.contact')" />
        <el-table-column :label="$t('suppliers.actions')" width="150">
          <template #default="scope">
            <div class="action-buttons">
              <el-button
                size="small"
                @click="handleOpenEditDialog(scope.row)"
                data-cy="edit-supplier-button"
              >
                {{ $t('suppliers.edit') }}
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(scope.row)"
                data-cy="delete-supplier-button"
              >
                {{ $t('suppliers.delete') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 3. Pagination -->
      <el-pagination
        class="pagination"
        background
        layout="prev, pager, next, total"
        :total="total"
        :page-size="queryParams.pageSize"
        :current-page="queryParams.page"
        @current-change="handlePageChange"
      />
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleCloseDialog"
    >
      <SupplierForm v-if="dialogVisible" ref="supplierFormRef" :initial-data="currentSupplier" />
      <template #footer>
        <el-button @click="handleCloseDialog">{{ $t('suppliers.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
          {{ $t('suppliers.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier as apiDeleteSupplier,
} from '@/api/supplier.api.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import SupplierForm from '@/components/SupplierForm.vue' // Import the form component

const { t } = useI18n()

const suppliersList = ref([])
const loading = ref(false)
const total = ref(0)
const queryParams = ref({
  page: 1,
  pageSize: 10,
})

// --- Dialog State ---
const dialogVisible = ref(false)
const isSubmitting = ref(false)
const currentSupplier = ref(null)
const supplierFormRef = ref(null)

const dialogTitle = computed(() =>
  currentSupplier.value && currentSupplier.value.id
    ? t('suppliers.edit_supplier')
    : t('suppliers.add_supplier'),
)

const fetchSuppliers = async () => {
  loading.value = true
  try {
    const response = await getSuppliers(queryParams.value)
    suppliersList.value = response.data.suppliers
    total.value = response.data.totalItems
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
    ElMessage.error(t('suppliers.load_fail'))
  } finally {
    loading.value = false
  }
}

const handlePageChange = (newPage) => {
  queryParams.value.page = newPage
  fetchSuppliers()
}

const handleOpenAddDialog = () => {
  currentSupplier.value = {}
  dialogVisible.value = true
}

const handleOpenEditDialog = (supplier) => {
  currentSupplier.value = { ...supplier }
  dialogVisible.value = true
}

const handleCloseDialog = () => {
  dialogVisible.value = false
  currentSupplier.value = null
}

const handleSubmit = async () => {
  try {
    await supplierFormRef.value.validate()
    const formData = supplierFormRef.value.getFormData()
    isSubmitting.value = true

    if (currentSupplier.value && currentSupplier.value.id) {
      await updateSupplier(currentSupplier.value.id, formData)
      ElMessage.success(t('suppliers.update_success'))
    } else {
      await createSupplier(formData)
      ElMessage.success(t('suppliers.add_success'))
    }

    handleCloseDialog()
    fetchSuppliers()
  } catch (error) {
    console.error('Submit failed:', error)

    // Display more specific error message from backend if available
    let errorMessage = t('suppliers.operation_failed')
    if (error.response && error.response.data && error.response.data.message) {
      // Check for known Sequelize unique constraint error
      if (
        error.response.data.error &&
        error.response.data.error.includes('UniqueConstraintError')
      ) {
        errorMessage = t('suppliers.supplier_name_exists')
      } else {
        // Use the general message from the backend
        errorMessage = `${t('suppliers.operation_failed')} ${error.response.data.message}`
      }
    }
    ElMessage.error(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = (supplier) => {
  ElMessageBox.confirm(t('suppliers.delete_confirm_message', { supplierName: supplier.supplier_name }), t('suppliers.warning'), {
    confirmButtonText: t('suppliers.ok'),
    cancelButtonText: t('suppliers.cancel'),
    type: 'warning',
  })
    .then(async () => {
      try {
        await apiDeleteSupplier(supplier.id)
        ElMessage.success(t('suppliers.delete_success'))
        fetchSuppliers() // Refresh the list
      } catch (error) {
        console.error('Failed to delete supplier:', error)
        ElMessage.error(t('suppliers.delete_failed'))
      }
    })
    .catch(() => {
      ElMessage.info(t('suppliers.delete_canceled'))
    })
}

onMounted(() => {
  fetchSuppliers()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.action-buttons > .el-button {
  width: 100%;
  margin-left: 0 !important;
}
</style>
