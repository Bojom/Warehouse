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
          type="success"
          @click="handleBulkDownload"
          :disabled="selectedParts.length === 0"
          data-cy="download-selected-button"
        >
          {{ $t('parts.download_selected') }} ({{ selectedParts.length }})
        </el-button>
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
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
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
        <el-table-column :label="$t('parts.barcode_title')" width="150">
          <template #default="scope">
            <el-button size="small" @click="handleShowBarcode(scope.row)">
              {{ $t('parts.show_barcode') }}
            </el-button>
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

    <!-- newly created part details dialog -->
    <el-dialog v-model="detailsDialogVisible" :title="$t('parts.new_part_details')" width="400px">
      <div v-if="detailsPart" ref="barcodeContainerRef" class="details-content">
        <p>
          <strong>{{ $t('parts.part_name') }}:</strong> {{ detailsPart.part_name }}
        </p>
        <p>
          <strong>{{ $t('parts.part_number') }} (SKU):</strong> {{ detailsPart.part_number }}
        </p>
        <div class="barcode-container">
          <svg ref="barcodeSvgRef"></svg>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailsDialogVisible = false">{{ $t('parts.close') }}</el-button>
        <el-button type="primary" @click="handleDownloadBarcode">{{ $t('parts.download') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import PartForm from '@/components/PartForm.vue'
import BaseChart from '@/components/charts/BaseChart.vue'
import { getParts, createPart, updatePart, deletePart } from '@/api/part.api.js'
import { getSuppliers } from '@/api/supplier.api.js'
import api from '@/utils/api' // Import the generic api utility
import html2canvas from 'html2canvas'
import JsBarcode from 'jsbarcode'
import jsPDF from 'jspdf'

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
const selectedParts = ref([])

// --- dialog state ---
const dialogVisible = ref(false)
const isSubmitting = ref(false)
const currentPart = ref(null)
const partFormRef = ref(null)
const suppliersList = ref([])
const detailsDialogVisible = ref(false)
const detailsPart = ref(null)
const barcodeContainerRef = ref(null)
const barcodeSvgRef = ref(null)

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
const handleSelectionChange = (val) => {
  selectedParts.value = val
}

const handleOpenAddDialog = () => {
  currentPart.value = {} // 重置
  dialogVisible.value = true
}

const handleOpenEditDialog = (part) => {
  currentPart.value = { ...part }
  dialogVisible.value = true
}

const handleShowBarcode = (part) => {
  detailsPart.value = part
  detailsDialogVisible.value = true
}

watch(detailsPart, (newVal) => {
  if (newVal && barcodeSvgRef.value) {
    nextTick(() => {
      JsBarcode(barcodeSvgRef.value, newVal.part_number, {
        format: 'CODE128',
        lineColor: '#000',
        width: 1.5,
        height: 40,
        displayValue: false,
      })
    })
  }
})

const handleDownloadBarcode = async () => {
  if (!barcodeContainerRef.value) return

  const canvas = await html2canvas(barcodeContainerRef.value)
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `${detailsPart.value.part_number}-barcode.png`
  link.click()
}

const handleBulkDownload = async () => {
  if (selectedParts.value.length === 0) {
    ElMessage.warning('Please select at least one part to download.')
    return
  }

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [60, 40],
  })

  for (let i = 0; i < selectedParts.value.length; i++) {
    const part = selectedParts.value[i]

    if (i > 0) {
      pdf.addPage([60, 40], 'l')
    }

    // Create a temporary, off-screen element styled for the sticker layout
    const stickerContainer = document.createElement('div')
    stickerContainer.style.position = 'absolute'
    stickerContainer.style.left = '-9999px'
    stickerContainer.style.width = '580px' // Use pixel dimensions that match the 60x40 aspect ratio
    stickerContainer.style.height = '380px'
    stickerContainer.style.padding = '20px'
    stickerContainer.style.background = 'white'
    stickerContainer.style.display = 'flex'
    stickerContainer.style.flexDirection = 'column'
    stickerContainer.style.justifyContent = 'center'
    stickerContainer.style.alignItems = 'center'
    stickerContainer.style.boxSizing = 'border-box'
    document.body.appendChild(stickerContainer)

    stickerContainer.innerHTML = `
      <p style="margin: 0; font-family: sans-serif; font-size: 30px; text-align: center;">${part.part_name}</p>
      <p style="margin: 0 0 10px 0; font-family: sans-serif; font-size: 24px; text-align: center;">SKU: ${part.part_number}</p>
    `
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    stickerContainer.appendChild(svg)

    JsBarcode(svg, part.part_number, {
      format: 'CODE128',
      width: 2,
      height: 120,
      displayValue: false,
    })

    const canvas = await html2canvas(stickerContainer, { scale: 2 })
    document.body.removeChild(stickerContainer) // Clean up

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 60, 40)
  }

  pdf.save('stickers.pdf')
}

const handleCloseDialog = () => {
  dialogVisible.value = false
  currentPart.value = null
}

const handleSubmit = async () => {
  try {
    const formData = await partFormRef.value.validate()
    isSubmitting.value = true

    if (currentPart.value.id) {
      // edit mode
      await updatePart(currentPart.value.id, formData)
      ElMessage.success(t('parts.update_success'))
      handleCloseDialog()
      fetchParts()
    } else {
      // new mode
      await createPart(formData)
      ElMessage.success(t('parts.add_success'))
      handleCloseDialog()
      fetchParts()
    }
  } catch (error) {
    if (typeof error === 'string') {
      ElMessage.error(error || 'Operation failed')
    } else {
      console.error('Operation failed:', error)
      ElMessage.error(
        error?.response?.data?.message || 'Network or server error',
      )
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleViewDetails = (part) => {
  ElMessage.info(t('parts.details_info', { partName: part.part_name }))
}

const handleDelete = async (part) => {
  try {
    await ElMessageBox.confirm(
      t('parts.delete_confirm_message', { partName: part.part_name }), // prompt content
      t('parts.warning'), // title
      {
        confirmButtonText: t('parts.confirm_delete'),
        cancelButtonText: t('parts.cancel'),
        type: 'warning',
      },
    )
    await deletePart(part.id)
    ElMessage.success(t('parts.delete_success'))
    fetchParts() // refresh list
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Deletion failed:', error)
      ElMessage.error('Deletion failed')
    }
  }
}

const handleExpandChange = async (part, expandedRows) => {
  const isOpening = expandedRows.some((row) => row.id === part.id)
  if (!isOpening) return

  // Prevent re-fetching if data already exists
  if (part.chartOption) return

  try {
    const response = await api.get(`/parts/${part.id}/history`)
    const { dates, inboundData, outboundData } = response.data

    part.chartOption = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['Inbound', 'Outbound'],
      },
      xAxis: {
        type: 'category',
        data: dates,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: 'Inbound',
          type: 'line',
          data: inboundData,
        },
        {
          name: 'Outbound',
          type: 'line',
          data: outboundData,
        },
      ],
    }
  } catch (error) {
    console.error('Failed to load chart data:', error)
    ElMessage.error('Failed to load chart data')
  }
}

const handleSearch = () => {
  queryParams.value.page = 1
  fetchParts()
}

const resetQuery = () => {
  queryParams.value.page = 1
  queryParams.value.search = ''
  fetchParts()
}

const handlePageChange = (page) => {
  queryParams.value.page = page
  fetchParts()
}

// --- lifecycle hooks ---
onMounted(() => {
  fetchParts()
  fetchSuppliers()
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

.details-content {
  text-align: center;
}
.barcode-container {
  margin-top: 20px;
}
</style>
