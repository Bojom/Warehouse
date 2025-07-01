<template>
  <div class="parts-view">
    <!-- 1. top toolbar: search and action buttons -->
    <el-card class="toolbar">
      <el-form :inline="true" :model="queryParams">
        <el-form-item :label="$t('parts.search_parts')">
          <el-input
            v-model="queryParams.search"
            :placeholder="$t('parts.search_placeholder')"
            @keyup.enter="handleSearch"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ $t('parts.search') }}</el-button>
          <el-button @click="resetQuery">{{ $t('parts.reset') }}</el-button>
        </el-form-item>
      </el-form>
      <div>
        <el-button
          type="primary"
          v-if="userStore.isAdmin"
          @click="handleOpenAddDialog"
          data-cy="add-part-button"
          >{{ $t('parts.add_part') }}</el-button
        >
      </div>
    </el-card>

    <!-- 2. data table -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="partsList"
        style="width: 100%"
        @expand-change="handleExpandChange"
        row-key="id"
        data-cy="parts-table"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="expand-content">
              <h4>{{ $t('parts.trend_title', { partName: props.row.part_name }) }}</h4>
              <BaseChart
                v-if="props.row.chartOption"
                :option="props.row.chartOption"
                height="300px"
              />
              <div v-else>{{ $t('parts.loading_chart') }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="part_number" :label="$t('parts.part_number')" width="180" />
        <el-table-column prop="part_name" :label="$t('parts.part_name')" width="180" />
        <el-table-column prop="spec" :label="$t('parts.spec')" width="120" />
        <el-table-column prop="stock" :label="$t('parts.stock')" width="120" />
        <el-table-column prop="stock_min" :label="$t('parts.min_stock')" width="150" />
        <el-table-column prop="stock_max" :label="$t('parts.max_stock')" width="150" />
        <el-table-column prop="Supplier.supplier_name" :label="$t('parts.supplier')" width="180" />
        <el-table-column :label="$t('parts.actions')" width="150">
          <template #default="scope">
            <div class="action-buttons" v-if="userStore.isAdmin">
              <el-button
                size="small"
                @click="handleOpenEditDialog(scope.row)"
                data-cy="edit-part-button"
                >{{ $t('parts.edit') }}</el-button
              >
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(scope.row)"
                data-cy="delete-part-button"
                >{{ $t('parts.delete') }}</el-button
              >
            </div>
            <div v-else-if="userStore.user?.role === 'operator'">
              <el-button size="small" @click="handleViewDetails(scope.row)">{{ $t('parts.check') }}</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 3. pagination component -->
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

    <!-- add/edit part dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="50%" @close="handleCloseDialog">
      <PartForm
        v-if="dialogVisible"
        ref="partFormRef"
        :initial-data="currentPart"
        :suppliers="suppliersList"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">{{ $t('parts.cancel') }}</el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="isSubmitting"
            data-cy="part-form-submit-button"
          >
            {{ $t('parts.confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import PartForm from '@/components/PartForm.vue'
import BaseChart from '@/components/charts/BaseChart.vue'
import { getParts, createPart, updatePart, deletePart } from '@/api/part.api.js'
import { getSuppliers } from '@/api/supplier.api.js'
import api from '@/utils/api' // Import the generic api utility

const { t } = useI18n()

// --- state management ---
const partsList = ref([]) // 存储配件列表
const total = ref(0) // 总记录数
const loading = ref(false) // 控制表格加载状态
const queryParams = ref({
  page: 1,
  pageSize: 10,
  search: '',
})
const userStore = useUserStore()

// --- dialog state ---
const dialogVisible = ref(false)
const isSubmitting = ref(false)
const currentPart = ref(null)
const partFormRef = ref(null)
const suppliersList = ref([])

const dialogTitle = computed(() =>
  currentPart.value && currentPart.value.id ? t('parts.edit_part') : t('parts.add_part'),
)

// --- core function to fetch data ---
const fetchParts = async () => {
  loading.value = true
  try {
    const response = await getParts(queryParams.value)
    partsList.value = response.data.parts
    total.value = response.data.totalItems
  } catch (error) {
    console.error('Failed to fetch parts list:', error)
    ElMessage.error(t('parts.load_fail'))
  } finally {
    loading.value = false
  }
}

const fetchSuppliers = async () => {
  try {
    const response = await getSuppliers()
    suppliersList.value = response.data.suppliers
  } catch (error) {
    console.error('Failed to fetch suppliers list:', error)
    ElMessage.error('Failed to load suppliers list, please try again.')
  }
}

// --- event handling ---
const handleOpenAddDialog = () => {
  currentPart.value = {} // 重置
  dialogVisible.value = true
}

const handleOpenEditDialog = (part) => {
  currentPart.value = { ...part }
  dialogVisible.value = true
}

const handleCloseDialog = () => {
  dialogVisible.value = false
  currentPart.value = null
}

const handleSubmit = async () => {
  try {
    const formData = await partFormRef.value.validate()
    isSubmitting.value = true // start submitting, show loading state

    if (currentPart.value.id) {
      // edit mode
      await updatePart(currentPart.value.id, formData)
      ElMessage.success(t('parts.update_success'))
    } else {
      // new mode
      await createPart(formData)
      ElMessage.success(t('parts.add_success'))
    }

    handleCloseDialog() // close dialog
    fetchParts() // reload list
  } catch (error) {
    // validation failed or API request failed
    if (typeof error === 'string') {
      ElMessage.error(error || 'Operation failed')
    } else {
      console.error('Operation failed:', error)
      ElMessage.error(
        error?.response?.data?.message || 'Network or server error',
      )
    }
  } finally {
    isSubmitting.value = false // end submitting
  }
}

const handleViewDetails = (part) => {
  ElMessage.info(t('parts.details_info', { partName: part.part_name }))
}

// ... (handleSearch, handleDelete, resetQuery, handlePageChange remain the same)
// search button click event
const handleSearch = () => {
  queryParams.value.page = 1 // always start from the first page
  fetchParts()
}

const handleDelete = (part) => {
  // use ElMessageBox.confirm to show a confirmation dialog
  ElMessageBox.confirm(
    t('parts.delete_confirm_message', { partName: part.part_name }), // prompt content
    t('parts.warning'), // title
    {
      confirmButtonText: t('parts.confirm_delete'),
      cancelButtonText: t('parts.cancel'),
      type: 'warning', // warning type, icon will change
    },
  )
    .then(async () => {
      // user clicked "确定删除"
      try {
        await deletePart(part.id)
        ElMessage.success(t('parts.delete_success'))
        fetchParts() // reload list after successful deletion
      } catch (error) {
        console.error('Failed to delete part:', error)
        ElMessage.error(error?.response?.data?.message || 'Deletion failed')
      }
    })
    .catch(() => {
      // user clicked "取消" or closed the dialog
      ElMessage.info('Delete cancelled')
    })
}

// reset button click event
const resetQuery = () => {
  queryParams.value.page = 1
  queryParams.value.search = ''
  fetchParts()
}

// pagination page number change event
const handlePageChange = (newPage) => {
  queryParams.value.page = newPage
  fetchParts()
}

const handleExpandChange = async (row, expandedRows) => {
  const isExpanded = expandedRows.some((r) => r.id === row.id)

  if (isExpanded && !row.chartOption) {
    try {
      const response = await api.get(`/parts/${row.id}/history`)
      const { dates, inboundData, outboundData } = response.data
      row.chartOption = createTrendChartOption(dates, inboundData, outboundData)
    } catch (error) {
      console.error('Failed to fetch part history data:', error)
      ElMessage.error('Failed to load trend chart')
    }
  }
}

const createTrendChartOption = (dates, inData, outData) => {
  return reactive({
    tooltip: { trigger: 'axis' },
    legend: { data: ['Inbound', 'Outbound'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Inbound',
        type: 'line',
        data: inData,
        smooth: true,
        areaStyle: {},
      },
      {
        name: 'Outbound',
        type: 'line',
        data: outData,
        smooth: true,
        areaStyle: {},
      },
    ],
  })
}

// --- lifecycle hooks ---
onMounted(() => {
  fetchParts()
  fetchSuppliers() // <-- add this line to get supplier data
})
</script>

<style scoped>
.parts-view {
  padding: 20px;
}
.toolbar {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.expand-content {
  padding: 15px;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons > .el-button {
  width: 100%;
  margin-left: 0;
}
</style>
