// frontend/src/utils/chart-options.js

// function to build the option for the trend chart
export function createTrendChartOption(dates = [], inData = [], outData = []) {
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['In', 'Out'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'In',
        type: 'line',
        data: inData,
        smooth: true,
        itemStyle: { color: '#67C23A' },
      },
      {
        name: 'Out',
        type: 'line',
        data: outData,
        smooth: true,
        itemStyle: { color: '#E6A23C' },
      },
    ],
  }
}

// function to build the option for the composition chart
export function createCompositionChartOption(data = []) {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: data.map((item) => item.name),
    },
    series: [
      {
        name: 'Stock',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '30',
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: data,
      },
    ],
  }
}

export function createAnomalyChartOption(supplierNames = [], anomalyScores = []) {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
    },
    yAxis: {
      type: 'category',
      data: supplierNames,
    },
    series: [
      {
        name: 'Anomaly Score',
        type: 'bar',
        data: anomalyScores,
        itemStyle: {
          color: '#F56C6C',
        },
      },
    ],
  }
}

// ... (future: add more chart options)
