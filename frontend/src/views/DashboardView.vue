<template>
  <div class="dashboard-view" v-loading="loading" ref="exportAreaRef">
    <!-- 1. top title and export button -->
    <el-card class="page-header-card">
      <div class="card-header">
        <span>{{ $t('dashboard.title') }}</span>
        <el-button type="primary" :loading="isExporting" @click="handleExportPDF">
          {{ $t('dashboard.export_pdf') }}
        </el-button>
      </div>
    </el-card>

    <!-- 2. top KPI and status chart -->
    <el-row :gutter="20">
      <!-- KPI card section -->
      <el-col :span="16">
        <el-row :gutter="20" class="kpi-cards">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="card-content">
                <div class="label">{{ $t('dashboard.total_part_varieties') }}</div>
                <div class="value">{{ dashboardData?.partVarietyCount ?? 'N/A' }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="card-content">
                <div class="label">{{ $t('dashboard.today_in_count') }}</div>
                <div class="value">{{ dashboardData?.todayInCount ?? 'N/A' }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="card-content">
                <div class="label">{{ $t('dashboard.today_out_count') }}</div>
                <div class="value">{{ dashboardData?.todayOutCount ?? 'N/A' }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" body-style="background-color: #fef0f0;">
              <div class="card-content">
                <div class="label" style="color: #f56c6c">{{ $t('dashboard.low_stock_warning_count') }}</div>
                <div class="value" style="color: #f56c6c">
                  {{ dashboardData?.lowStockItems?.length ?? 'N/A' }}
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
      <!-- stock status bar chart -->
      <el-col :span="8">
        <el-card class="chart-section" style="margin-top: 0">
          <BaseChart :option="statusChartOption" :loading="statusChartLoading" height="120px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- chart area: put two charts in the same row -->
    <el-row :gutter="20">
      <!-- trend chart -->
      <el-col :span="12">
        <el-card class="chart-section">
          <template #header>
            <div class="card-header">
              <span>{{ $t('dashboard.last_30_days_trend') }}</span>
            </div>
          </template>
          <BaseChart :option="trendChartOption" :loading="trendChartLoading" height="350px" />
        </el-card>
      </el-col>

      <!-- anomaly supplier ranking -->
      <el-col :span="12">
        <el-card class="chart-section">
          <template #header>
            <div class="card-header">
              <span>{{ $t('dashboard.top_anomaly_suppliers') }}</span>
            </div>
          </template>
          <BaseChart :option="anomalyChartOption" :loading="anomalyChartLoading" height="350px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 4. warning information section -->
    <el-card class="warning-section">
      <template #header>
        <div class="card-header">
          <span>{{ $t('dashboard.low_stock_warning') }}</span>
          <router-link to="/inventory">
            <el-button text>{{ $t('dashboard.view_all') }}</el-button>
          </router-link>
        </div>
      </template>
      <el-table :data="dashboardData?.lowStockItems" style="width: 100%" height="250">
        <el-table-column prop="part_number" :label="$t('dashboard.part_number')" />
        <el-table-column prop="part_name" :label="$t('dashboard.part_name')" />
        <el-table-column prop="stock" :label="$t('dashboard.current_stock')" />
        <el-table-column prop="stock_min" :label="$t('dashboard.stock_min')" />
      </el-table>
      <div v-if="!dashboardData?.lowStockItems?.length" class="empty-text">
        {{ $t('dashboard.no_low_stock') }}
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/utils/api'
import BaseChart from '@/components/charts/BaseChart.vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { createTrendChartOption, createAnomalyChartOption } from '@/utils/chart-options.js'

const { t } = useI18n()
const exportAreaRef = ref(null)
const isExporting = ref(false)
const dashboardData = ref(null)
const loading = ref(true)
const trendChartLoading = ref(false)
const statusChartLoading = ref(false)
const anomalyChartLoading = ref(false)

const trendChartOption = reactive(createTrendChartOption())
const anomalyChartOption = reactive(createAnomalyChartOption())

const statusChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 0, right: 0, top: 10, bottom: 0, containLabel: true },
  xAxis: {
    type: 'category',
    data: [t('dashboard.low_stock'), t('dashboard.normal_stock'), t('dashboard.over_stock')],
    axisLabel: { interval: 0 }, // ensure all labels are displayed
  },
  yAxis: { type: 'value', show: false }, // hide y-axis
  series: [
    {
      name: t('dashboard.part_varieties'),
      type: 'bar',
      data: statusChartData.value,
      // set different colors for different bars
      itemStyle: {
        color: (params) => {
          const colorList = ['#F56C6C', '#67C23A', '#E6A23C']
          return colorList[params.dataIndex]
        },
      },
    },
  ],
}))

const statusChartData = ref([])

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const response = await api.get('/dashboard')
    dashboardData.value = response.data
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const fetchTrendsData = async () => {
  trendChartLoading.value = true
  try {
    const response = await api.get('/dashboard/trends', { params: { days: 30 } })
    const { dates, inboundData, outboundData } = response.data

    const newOptions = createTrendChartOption(dates, inboundData, outboundData)

    trendChartOption.xAxis.data = newOptions.xAxis.data
    trendChartOption.series[0].data = newOptions.series[0].data
    trendChartOption.series[1].data = newOptions.series[1].data
  } catch (error) {
    console.error('Failed to fetch trends data:', error)
  } finally {
    trendChartLoading.value = false
  }
}

const fetchStockStatusData = async () => {
  statusChartLoading.value = true
  try {
    const response = await api.get('/dashboard/stock-status')
    const { lowStock, normalStock, overStock } = response.data
    statusChartData.value = [lowStock, normalStock, overStock]
  } catch (error) {
    console.error('Failed to fetch stock status data:', error)
  } finally {
    statusChartLoading.value = false
  }
}

const fetchAnomalyData = async () => {
  anomalyChartLoading.value = true
  try {
    const response = await api.get('/dashboard/top-anomaly-suppliers')
    const { supplierNames, anomalyScores } = response.data
    const newOptions = createAnomalyChartOption(supplierNames, anomalyScores)
    anomalyChartOption.xAxis.data = newOptions.xAxis.data
    anomalyChartOption.series[0].data = newOptions.series[0].data
  } catch (error) {
    console.error('Failed to fetch anomaly data:', error)
  } finally {
    anomalyChartLoading.value = false
  }
}

const handleExportPDF = async () => {
  if (!exportAreaRef.value) {
    console.error('Export area DOM element not found.')
    return
  }

  isExporting.value = true
  try {
    const canvas = await html2canvas(exportAreaRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const contentWidth = canvas.width
    const contentHeight = canvas.height
    const pageData = canvas.toDataURL('image/jpeg', 1.0)

    const PDF_PAGE_WIDTH = 595.28

    const margin = 20
    const imgWidth = PDF_PAGE_WIDTH - margin * 2
    const imgHeight = (imgWidth / contentWidth) * contentHeight

    const pdf = new jsPDF('p', 'pt', 'a4')

    pdf.addImage(pageData, 'JPEG', margin, margin, imgWidth, imgHeight)

    pdf.save('Dashboard Report.pdf')
  } catch (error) {
    console.error('Failed to export PDF:', error)
    ElMessage.error('Failed to export PDF.')
  } finally {
    isExporting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([
    fetchDashboardData(),
    fetchTrendsData(),
    fetchStockStatusData(),
    fetchAnomalyData(),
  ])
  loading.value = false
})
</script>

<style scoped>
.dashboard-view {
  padding: 20px;
}
.kpi-cards {
  margin-bottom: 20px;
}
.card-content {
  text-align: center;
}
.card-content .label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}
.card-content .value {
  font-size: 24px;
  font-weight: bold;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.empty-text {
  text-align: center;
  color: #909399;
  padding: 20px;
}
.chart-section {
  margin-top: 20px;
  margin-bottom: 20px;
}
.page-header-card {
  margin-bottom: 20px;
}
</style>
