<template>
  <div class="records-view">
    <!-- 1. top filter section -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryParams">
        <el-form-item :label="$t('records.time_range')">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            :range-separator="$t('records.to')"
            :start-placeholder="$t('records.start_date')"
            :end-placeholder="$t('records.end_date')"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <!-- New Brand/Model/PartType Filters -->
        <el-form-item :label="$t('attributes.brands')">
          <el-select
            v-model="queryParams.brandId"
            :placeholder="$t('attributes.select_brand')"
            clearable
            filterable
            @change="handleBrandChange"
          >
            <el-option v-for="brand in brands" :key="brand.id" :label="brand.name" :value="brand.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('attributes.models')">
          <el-select
            v-model="queryParams.modelId"
            :placeholder="$t('attributes.select_model')"
            clearable
            filterable
            :disabled="!queryParams.brandId"
          >
            <el-option v-for="model in filteredModels" :key="model.id" :label="model.name" :value="model.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('attributes.part_types')">
          <el-select
            v-model="queryParams.partTypeId"
            :placeholder="$t('attributes.select_part_type')"
            clearable
            filterable
          >
            <el-option v-for="pt in partTypes" :key="pt.id" :label="pt.name" :value="pt.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('records.trans_type')">
          <el-select v-model="queryParams.type" :placeholder="$t('records.select_type')" clearable>
            <el-option :label="$t('stock_movement.inbound')" value="IN" />
            <el-option :label="$t('stock_movement.outbound')" value="OUT" />
            <el-option :label="$t('records.anomaly')" value="ANOMALY" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ $t('parts.search') }}</el-button>
          <el-button @click="resetQuery">{{ $t('parts.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. action section -->
    <el-card class="action-card">
      <el-button type="success" @click="handleExport">{{ $t('records.export_excel') }}</el-button>
    </el-card>

    <!-- NEW: Chart Card -->
    <el-card class="chart-card">
      <template #header>
        <span>{{ $t('records.daily_trend') }}</span>
      </template>
      <BaseChart v-if="chartOption" :option="chartOption" height="400px" />
      <div v-else class="chart-placeholder">{{ $t('records.loading_chart') }}</div>
    </el-card>

    <!-- 3. data table and pagination -->
    <el-card>
      <el-table v-loading="loading" :data="recordsList" border>
        <el-table-column :label="$t('records.operation_time')" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.trans_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="part_number" :label="$t('parts.part_number')" width="200" />
        <el-table-column prop="part_name" :label="$t('parts.part_name')" />
        <el-table-column :label="$t('records.trans_type')" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.trans_type)">
              {{ getTypeText(scope.row.trans_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" :label="$t('records.quantity')" align="center" width="100" />
        <el-table-column prop="operator" :label="$t('records.operator')" width="120" />
        <el-table-column prop="remarks" :label="$t('records.remarks')" />
        <el-table-column :label="$t('records.actions')" align="center" width="150">
          <template #default="scope">
            <el-button
              v-if="scope.row.trans_type === 'OUT'"
              type="danger"
              size="small"
              @click="openAnomalyDialog(scope.row)"
              >{{ $t('records.report_anomaly') }}</el-button
            >
          </template>
        </el-table-column>
      </el-table>

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

    <!-- anomaly dialog -->
    <el-dialog v-model="anomalyDialogVisible" :title="$t('records.report_anomaly_title')">
      <el-form :model="anomalyForm" label-position="top">
        <el-form-item :label="$t('records.part_name')">
          <el-input :value="selectedTransaction.part_name" disabled />
        </el-form-item>
        <el-form-item :label="$t('records.outbound_quantity')">
          <el-input :value="selectedTransaction.quantity" disabled />
        </el-form-item>
        <el-form-item :label="$t('records.anomaly_quantity')" required>
          <el-input-number v-model="anomalyForm.quantity" :min="1" :max="selectedTransaction.quantity" />
        </el-form-item>
        <el-form-item :label="$t('records.remarks')">
          <el-input v-model="anomalyForm.remarks" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="anomalyDialogVisible = false">{{ $t('parts.cancel') }}</el-button>
        <el-button type="primary" @click="handleReportAnomaly">{{ $t('parts.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'
import { useI18n } from 'vue-i18n'
import { exportTransactions, createTransaction } from '@/api/transaction.api' // 引入导出API
import { getBrands, getModels, getPartTypes } from '@/api/dimensions.api'
import BaseChart from '@/components/charts/BaseChart.vue'

const { t, locale } = useI18n()

// --- utility functions ---
const formatDateTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)

  // 1. use local time formatter to format date and time components
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  // 2. calculate UTC offset
  // getTimezoneOffset() returns the difference in minutes between local time and UTC time
  // the sign is opposite to the conventional agreement (e.g. UTC+2 returns -120)
  const offsetMinutes = date.getTimezoneOffset()
  const offsetHours = -offsetMinutes / 60

  // 3. create offset string (e.g. "UTC+2" or "UTC-5")
  const offsetSign = offsetHours >= 0 ? '+' : '-'
  // for integer hours, we don't need the decimal part
  const offsetValue = Number.isInteger(offsetHours)
    ? Math.abs(offsetHours)
    : Math.abs(offsetHours).toFixed(2)
  const offsetString = `UTC${offsetSign}${offsetValue}`

  // 4. combine and return the final string
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${offsetString}`
}

const getTagType = (type) => {
  if (type === 'IN') return 'success'
  if (type === 'OUT') return 'warning'
  if (type === 'ANOMALY') return 'danger'
  return ''
}

const getTypeText = (type) => {
  if (type === 'IN') return t('stock_movement.inbound')
  if (type === 'OUT') return t('stock_movement.outbound')
  if (type === 'ANOMALY') return t('records.anomaly')
  return t('records.unknown')
}

// --- state management ---
const recordsList = ref([])
const total = ref(0)
const loading = ref(false)
const dateRange = ref([])
const chartOption = ref(null)

// --- dimension filters state ---
const brands = ref([])
const allModels = ref([])
const filteredModels = ref([])
const partTypes = ref([])

// --- anomaly dialog state ---
const anomalyDialogVisible = ref(false)
const selectedTransaction = ref({})
const anomalyForm = reactive({
  quantity: 1,
  remarks: '',
})

// query parameters
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  type: '',
  startDate: '',
  endDate: '',
  brandId: null,
  modelId: null,
  partTypeId: null,
})


const handleExport = async () => {
  try {
    const loadingMessage = ElMessage({
      message: t('records.exporting'),
      type: 'info',
      duration: 0,
    });

    const params = {
      ...queryParams,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
    };

    const { blob, filename } = await exportTransactions(params, locale.value);

    const link = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([blob]));
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    loadingMessage.close();
  } catch (error) {
    console.error('Failed to export records:', error)
    ElMessage.error(t('records.export_failed'));
  }
};

// --- watcher for cascading model dropdown ---
watch(
  () => queryParams.brandId,
  (newBrandId) => {
    queryParams.modelId = null // Reset model when brand changes
    if (newBrandId) {
      filteredModels.value = allModels.value.filter((model) => model.brand_id === newBrandId)
    } else {
      filteredModels.value = []
    }
  },
)

// --- data fetching ---
const fetchDimensions = async () => {
  try {
    const [brandsRes, modelsRes, partTypesRes] = await Promise.all([
      getBrands(),
      getModels(),
      getPartTypes(),
    ])
    brands.value = brandsRes.data
    allModels.value = modelsRes.data
    partTypes.value = partTypesRes.data
  } catch (error) {
    ElMessage.error(t('attributes.fetch_fail'))
    console.error('Failed to fetch dimensions:', error)
  }
}

const fetchRecords = async () => {
  loading.value = true
  // update queryParams from dateRange
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.startDate = dateRange.value[0]
    queryParams.endDate = dateRange.value[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }

  // prepare parameters to send, remove null/empty values
  const paramsToSend = Object.entries(queryParams).reduce((acc, [key, value]) => {
    if (value !== null && value !== '') {
      acc[key] = value
  }
    return acc
  }, {})

  try {
    const response = await api.get('/transactions', { params: paramsToSend })
    recordsList.value = response.data.data
    total.value = response.data.total
  } catch (error) {
    console.error('Failed to fetch records:', error)
  } finally {
    loading.value = false
  }
}

const fetchChartData = async () => {
  try {
    // Pass the same filters to the summary endpoint
    const paramsToSend = { ...queryParams };
    delete paramsToSend.partTypeId; // remove original array

    if (queryParams.partTypeId) {
      paramsToSend.partTypeId = queryParams.partTypeId;
    }

    const response = await api.get('/transactions/summary', { params: paramsToSend });
    processChartData(response.data);
  } catch (error) {
    console.error('Failed to fetch chart data:', error);
  }
};

const processChartData = (data) => {
  const dates = [...new Set(data.map((item) => new Date(item.date).toLocaleDateString()))]
  const series = {
    IN: { name: t('stock_movement.inbound'), type: 'line', data: new Array(dates.length).fill(0) },
    OUT: { name: t('stock_movement.outbound'), type: 'line', data: new Array(dates.length).fill(0) },
    ANOMALY: { name: t('records.anomaly'), type: 'line', data: new Array(dates.length).fill(0) },
  }

  data.forEach((item) => {
    const dateIndex = dates.indexOf(new Date(item.date).toLocaleDateString())
    if (series[item.trans_type]) {
      series[item.trans_type].data[dateIndex] = parseInt(item.total_quantity, 10)
    }
  })

  chartOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: Object.values(series).map((s) => s.name) },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: dates },
    yAxis: { type: 'value' },
    series: Object.values(series),
  }
}

// --- event handling ---
const handleBrandChange = () => {
  // The watcher already handles the logic, this function is just to trigger it
}

const openAnomalyDialog = (transaction) => {
  selectedTransaction.value = transaction
  anomalyForm.quantity = 1
  anomalyForm.remarks = ''
  anomalyDialogVisible.value = true
}

const handleReportAnomaly = async () => {
  if (!anomalyForm.quantity || anomalyForm.quantity <= 0) {
    ElMessage.error(t('records.error_quantity_invalid'))
    return
  }
  if (anomalyForm.quantity > selectedTransaction.value.quantity) {
    ElMessage.error(t('records.error_anomaly_quantity_exceeds'))
    return
  }

  try {
    await createTransaction({
      part_id: selectedTransaction.value.part_id,
      trans_type: 'ANOMALY',
      quantity: anomalyForm.quantity,
      remarks: anomalyForm.remarks,
    })
    ElMessage.success(t('records.report_anomaly_success'))
    anomalyDialogVisible.value = false
    fetchRecords() // refresh data
    fetchChartData()
  } catch (error) {
    console.error('Failed to report anomaly:', error)
    ElMessage.error(error.response?.data?.message || t('records.report_anomaly_fail'))
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchRecords()
  fetchChartData()
}

const resetQuery = () => {
  dateRange.value = []
  queryParams.page = 1
  queryParams.type = ''
  queryParams.startDate = ''
  queryParams.endDate = ''
  queryParams.brandId = null
  queryParams.modelId = null
  queryParams.partTypeId = null
  fetchRecords()
  fetchChartData()
}

const handlePageChange = (page) => {
  queryParams.page = page
  fetchRecords()
}

// --- lifecycle hooks ---
onMounted(() => {
  fetchDimensions()
  fetchRecords()
  fetchChartData()
})
</script>

<style scoped>
.records-view {
  padding: 20px;
}
.filter-card,
.action-card,
.chart-card {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  justify-content: center;
}
.chart-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #909399;
}
</style>
