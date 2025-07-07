<template>
  <div class="attributes-view">
    <!-- Search Section -->
    <el-card class="search-card">
      <el-form :inline="true" @submit.prevent="handleSearch">
        <el-form-item :label="$t('attributes.search_by_code')">
          <el-input
            v-model="searchQuery"
            :placeholder="$t('attributes.enter_code_placeholder')"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="searchLoading">{{
            $t('parts.search')
          }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- Brands Tab -->
      <el-tab-pane :label="$t('attributes.brands')" name="brands">
        <CrudTable
          :title="$t('attributes.brands')"
          :columns="brandColumns"
          :fetch-data="fetchBrands"
          :create-item="(data) => createOrUpdateItem('brands', data)"
          :update-item="(id, data) => createOrUpdateItem('brands', data, id)"
          :delete-item="(id) => deleteItem('brands', id)"
          :form-fields="brandFormFields"
        />
      </el-tab-pane>

      <!-- Models Tab -->
      <el-tab-pane :label="$t('attributes.models')" name="models">
        <CrudTable
          :title="$t('attributes.models')"
          :columns="modelColumns"
          :fetch-data="fetchModels"
          :create-item="(data) => createOrUpdateItem('models', data)"
          :update-item="(id, data) => createOrUpdateItem('models', data, id)"
          :delete-item="(id) => deleteItem('models', id)"
          :form-fields="modelFormFields"
          :select-options="{ brands: brandOptions }"
        />
      </el-tab-pane>

      <!-- Part Types Tab -->
      <el-tab-pane :label="$t('attributes.part_types')" name="partTypes">
        <CrudTable
          :title="$t('attributes.part_types')"
          :columns="commonColumns"
          :fetch-data="fetchPartTypes"
          :create-item="(data) => createOrUpdateItem('part-types', data)"
          :update-item="(id, data) => createOrUpdateItem('part-types', data, id)"
          :delete-item="(id) => deleteItem('part-types', id)"
          :form-fields="commonFormFields"
        />
      </el-tab-pane>

      <!-- Colours Tab -->
      <el-tab-pane :label="$t('attributes.colours')" name="colours">
        <CrudTable
          :title="$t('attributes.colours')"
          :columns="commonColumns"
          :fetch-data="fetchColours"
          :create-item="(data) => createOrUpdateItem('colours', data)"
          :update-item="(id, data) => createOrUpdateItem('colours', data, id)"
          :delete-item="(id) => deleteItem('colours', id)"
          :form-fields="commonFormFields"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- Search Results Dialog -->
    <el-dialog v-model="resultsDialogVisible" :title="$t('attributes.search_results')" width="60%">
      <div v-if="searchResults.length > 0">
        <el-table :data="searchResults" border>
          <el-table-column :label="$t('attributes.type')" prop="type" width="120"></el-table-column>
          <el-table-column :label="$t('attributes.name')" prop="name"></el-table-column>
          <el-table-column
            :label="$t('attributes.brand')"
            prop="Brand.name"
          ></el-table-column>
          <el-table-column :label="$t('attributes.code')" prop="code" width="120"></el-table-column>
        </el-table>
      </div>
      <div v-else class="no-results">
        <p>{{ $t('attributes.no_results_found') }}</p>
      </div>
      <template #footer>
        <el-button @click="resultsDialogVisible = false">{{ $t('attributes.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/utils/api';
import CrudTable from '@/components/CrudTable.vue';
import { searchByCode } from '@/api/dimensions.api';
import { ElMessage } from 'element-plus';

const activeTab = ref('brands');
const brands = ref([]);

// --- Search State ---
const searchQuery = ref('');
const searchLoading = ref(false);
const resultsDialogVisible = ref(false);
const searchResults = ref([]);

// --- Data Fetching Functions ---
const fetchBrands = async () => api.get('/dimensions/brands');
const fetchModels = async () => api.get('/dimensions/models');
const fetchPartTypes = async () => api.get('/dimensions/part-types');
const fetchColours = async () => api.get('/dimensions/colours');

// --- Generic CRUD Functions ---
const createOrUpdateItem = (type, data, id) => {
  const url = id ? `/dimensions/${type}/${id}` : `/dimensions/${type}`;
  const method = id ? 'put' : 'post';
  return api[method](url, data);
};

const deleteItem = (type, id) => {
  return api.delete(`/dimensions/${type}/${id}`);
};

// --- Search Handler ---
const handleSearch = async () => {
  if (!searchQuery.value) return;
  searchLoading.value = true;
  try {
    const response = await searchByCode(searchQuery.value);
    searchResults.value = response.data;
    resultsDialogVisible.value = true;
  } catch {
    ElMessage.error('Search failed');
  } finally {
    searchLoading.value = false;
  }
};

// --- Table and Form Definitions ---
const commonColumns = [
  { prop: 'name', label: 'attributes.name' },
  { prop: 'code', label: 'attributes.code' },
];

const brandColumns = [...commonColumns];

const modelColumns = [
  { prop: 'Brand.name', label: 'attributes.brand' }, // Use singular 'brand'
  { prop: 'name', label: 'attributes.name' },
  { prop: 'code', label: 'attributes.code' },
];

const commonFormFields = [
  { name: 'name', label: 'attributes.name', type: 'text', required: true },
  { name: 'code', label: 'attributes.code', type: 'text', required: true },
];

const brandFormFields = [...commonFormFields];

const brandOptions = computed(() =>
  brands.value.map(b => ({ label: b.name, value: b.id }))
);

const modelFormFields = [
  { name: 'brand_id', label: 'attributes.brand', type: 'select', options: brandOptions, required: true },
  { name: 'name', label: 'attributes.name', type: 'text', required: true },
  { name: 'code', label: 'attributes.code', type: 'text', required: true },
];


// Fetch brands on mount to populate the select dropdown in the models form
onMounted(async () => {
  try {
    const response = await fetchBrands();
    brands.value = response.data;
  } catch {
    ElMessage.error('Failed to fetch brands for model form');
    }
});
</script>

<style scoped>
.attributes-view {
  padding: 20px;
}
.search-card {
  margin-bottom: 20px;
}
.no-results {
  text-align: center;
  color: #909399;
  padding: 20px;
}
</style>
