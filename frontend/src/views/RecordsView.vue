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
        <el-form-item :label="$t('records.part')">
          <el-select
            v-model="queryParams.partIds"
            :placeholder="$t('records.select_part')"
            clearable
            filterable
            multiple
            collapse-tags
          >
            <el-option
              v-for="part in partsForSelect"
              :key="part.id"
              :label="`${part.part_name} (${part.part_number})`"
              :value="part.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('records.operation_type')">
          <el-select
            v-model="queryParams.type"
            :placeholder="$t('records.select_type')"
            clearable
          >
            <el-option :label="$t('records.in')" value="IN" />
            <el-option :label="$t('records.out')" value="OUT" />
            <el-option :label="$t('records.anomaly')" value="ANOMALY" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ $t('records.search') }}</el-button>
          <el-button @click="resetQuery">{{ $t('records.reset') }}</el-button>
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
            {{ formatDateTime(scope.row.transaction_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="Part.part_number" :label="$t('records.part_number')" width="200" />
        <el-table-column prop="Part.part_name" :label="$t('records.part_name')" />
        <el-table-column :label="$t('records.type')" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.type)">
              {{ getTypeText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" :label="$t('records.quantity')" align="center" width="100" />
        <el-table-column prop="User.username" :label="$t('records.operator')" width="120" />
        <el-table-column prop="remarks" :label="$t('records.remarks')" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'
import { useI18n } from 'vue-i18n'
import { getParts } from '@/api/part.api' // 引入配件API
import { exportTransactions } from '@/api/transaction.api' // 引入导出API
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
  if (type === 'IN') return t('records.in')
  if (type === 'OUT') return t('records.out')
  if (type === 'ANOMALY') return t('records.anomaly')
  return t('records.unknown')
}

// --- state management ---
const recordsList = ref([])
const total = ref(0)
const loading = ref(false)
const partsForSelect = ref([]) // used for part dropdown selection
const dateRange = ref([]) // used for storing the value of the date range selector
const chartOption = ref(null)

// query parameters
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  partIds: [],
  type: '',
  startDate: '',
  endDate: '',
})

// --- data fetching ---
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

  // prepare parameters to send, partIds needs special handling
  const paramsToSend = { ...queryParams }
  if (paramsToSend.partIds && paramsToSend.partIds.length > 0) {
    // backend needs partId, value is a comma-separated string
    paramsToSend.partId = paramsToSend.partIds.join(',')
  }
  delete paramsToSend.partIds // delete old partIds property

  try {
    const response = await api.get('/transactions', { params: paramsToSend })
    recordsList.value = response.data.transactions
    total.value = response.data.totalItems
  } catch (error) {
    console.error('Failed to fetch records:', error)
  } finally {
    loading.value = false
  }
}

const fetchChartData = async () => {
  try {
    const response = await api.get('/transactions/summary')
    processChartData(response.data)
  } catch (error) {
    console.error('Failed to fetch chart data:', error)
  }
}

const processChartData = (data) => {
  const dates = [...new Set(data.map((item) => new Date(item.date).toLocaleDateString()))]
  const series = {
    IN: { name: t('records.in'), type: 'line', data: new Array(dates.length).fill(0) },
    OUT: { name: t('records.out'), type: 'line', data: new Array(dates.length).fill(0) },
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

// get parts list for filtering (no pagination)
const fetchAllPartsForSelect = async () => {
  try {
    // assume getParts supports a large pageSize to get all
    const response = await getParts({ pageSize: 10000 })
    partsForSelect.value = response.data.parts
  } catch (error) {
    console.error('Failed to fetch parts for select:', error)
  }
}

// --- event handling ---
const handleSearch = () => {
  queryParams.page = 1
  fetchRecords()
}

const handleExport = async () => {
  try {
    console.log('Current locale:', locale.value) // Debug log
    const response = await exportTransactions(queryParams, locale.value)

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    // Dynamically generate file name, can be customized
    link.setAttribute('download', `records-${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()

    ElMessage.success(t('records.export_started'))
  } catch (error) {
    console.error('Failed to export:', error)
    ElMessage.error(t('records.export_failed'))
  }
}

const resetQuery = () => {
  queryParams.page = 1
  queryParams.partIds = []
  queryParams.type = ''
  dateRange.value = []
  fetchRecords()
}

const handlePageChange = (newPage) => {
  queryParams.page = newPage
  fetchRecords()
}

// --- lifecycle hooks ---
onMounted(() => {
  fetchRecords()
  fetchAllPartsForSelect()
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
