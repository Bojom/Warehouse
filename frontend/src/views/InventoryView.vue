<template>
  <div class="inventory-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('inventory.title') }}</span>
        </div>
      </template>

      <!-- quick filter -->
      <div class="filter-controls">
        <el-radio-group v-model="filterStatus">
          <el-radio-button :label="$t('inventory.all')" value="all" />
          <el-radio-button :label="$t('inventory.out_of_stock')" value="out_of_stock" />
          <el-radio-button :label="$t('inventory.low_stock')" value="low_stock" />
          <el-radio-button :label="$t('inventory.over_stock')" value="over_stock" />
          <el-radio-button :label="$t('inventory.normal')" value="normal" />
        </el-radio-group>
      </div>

      <!-- data table and visualization warning -->
      <el-table
        v-loading="loading"
        :data="filteredInventory"
        style="width: 100%; margin-top: 20px"
        border
      >
        <el-table-column prop="part_number" :label="$t('inventory.part_number')" width="200" />
        <el-table-column prop="part_name" :label="$t('inventory.part_name')" width="200" />
        <el-table-column prop="current_stock" :label="$t('inventory.current_stock')" width="150" />
        <el-table-column prop="min_stock" :label="$t('inventory.min_stock')" width="150" />
        <el-table-column prop="max_stock" :label="$t('inventory.max_stock')" width="150" />
        <el-table-column prop="Supplier.supplier_name" :label="$t('inventory.supplier')" />
        <el-table-column :label="$t('inventory.status')" align="center">
          <template #default="scope">
            <!-- use el-tag for visualization warning -->
            <el-tag v-if="scope.row.status === 'out_of_stock'" type="info"
              >{{ $t('inventory.out_of_stock') }}</el-tag
            >
            <el-tag v-else-if="scope.row.status === 'low_stock'" type="danger"
              >{{ $t('inventory.low_stock') }}</el-tag
            >
            <el-tag v-else-if="scope.row.status === 'over_stock'" type="warning"
              >{{ $t('inventory.over_stock') }}</el-tag
            >
            <el-tag v-else-if="scope.row.status === 'normal'" type="success">{{ $t('inventory.normal') }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getInventoryDetails } from '@/api/inventory.api'
import { ElMessage } from 'element-plus'

const inventoryList = ref([])
const loading = ref(false)
const filterStatus = ref('all')

const fetchInventoryDetails = async () => {
  loading.value = true
  try {
    const response = await getInventoryDetails()
    inventoryList.value = response.data
  } catch (error) {
    console.error('Failed to fetch inventory status:', error)
    ElMessage.error('Failed to load inventory data.')
  } finally {
    loading.value = false
  }
}

const filteredInventory = computed(() => {
  if (filterStatus.value === 'all') {
    return inventoryList.value
  }
  return inventoryList.value.filter((item) => item.status === filterStatus.value)
})

onMounted(() => {
  fetchInventoryDetails()
})
</script>

<style scoped>
.inventory-view {
  padding: 20px;
}
.card-header {
  font-size: 18px;
  font-weight: bold;
}
.filter-controls {
  margin-bottom: 20px;
}
</style>
