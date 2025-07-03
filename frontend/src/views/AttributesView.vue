<template>
  <div class="attributes-view">
    <h1>{{ $t('attributes.title') }}</h1>
    <el-tabs v-model="activeTab" class="attribute-tabs">
      <!-- Brands Tab -->
      <el-tab-pane :label="$t('attributes.brands')" name="brands">
        <el-button type="primary" @click="openForm('brand')">{{ $t('attributes.addBrand') }}</el-button>
        <el-table :data="brands" stripe class="attribute-table">
          <el-table-column prop="name" :label="$t('attributes.name')"></el-table-column>
          <el-table-column :label="$t('attributes.actions')" width="180">
            <template #default="scope">
              <el-button size="small" @click="openForm('brand', scope.row)">{{ $t('attributes.edit') }}</el-button>
              <el-button size="small" type="danger" @click="handleDelete('brand', scope.row.id)">{{ $t('attributes.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Models Tab -->
      <el-tab-pane :label="$t('attributes.models')" name="models">
        <el-button type="primary" @click="openForm('model')">{{ $t('attributes.addModel') }}</el-button>
        <el-table :data="models" stripe class="attribute-table">
          <el-table-column prop="name" :label="$t('attributes.name')"></el-table-column>
          <el-table-column prop="brand.name" :label="$t('attributes.brand')"></el-table-column>
          <el-table-column :label="$t('attributes.actions')" width="180">
            <template #default="scope">
              <el-button size="small" @click="openForm('model', scope.row)">{{ $t('attributes.edit') }}</el-button>
              <el-button size="small" type="danger" @click="handleDelete('model', scope.row.id)">{{ $t('attributes.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Part Types Tab -->
      <el-tab-pane :label="$t('attributes.partTypes')" name="partTypes">
        <el-button type="primary" @click="openForm('partType')">{{ $t('attributes.addPartType') }}</el-button>
        <el-table :data="partTypes" stripe class="attribute-table">
          <el-table-column prop="name" :label="$t('attributes.name')"></el-table-column>
          <el-table-column prop="code" :label="$t('attributes.code')"></el-table-column>
          <el-table-column :label="$t('attributes.actions')" width="180">
            <template #default="scope">
              <el-button size="small" @click="openForm('partType', scope.row)">{{ $t('attributes.edit') }}</el-button>
              <el-button size="small" type="danger" @click="handleDelete('partType', scope.row.id)">{{ $t('attributes.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Colours Tab -->
      <el-tab-pane :label="$t('attributes.colours')" name="colours">
        <el-button type="primary" @click="openForm('colour')">{{ $t('attributes.addColour') }}</el-button>
        <el-table :data="colours" stripe class="attribute-table">
          <el-table-column prop="name" :label="$t('attributes.name')"></el-table-column>
          <el-table-column prop="code" :label="$t('attributes.code')"></el-table-column>
          <el-table-column :label="$t('attributes.actions')" width="180">
            <template #default="scope">
              <el-button size="small" @click="openForm('colour', scope.row)">{{ $t('attributes.edit') }}</el-button>
              <el-button size="small" type="danger" @click="handleDelete('colour', scope.row.id)">{{ $t('attributes.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Generic Form Dialog -->
    <el-dialog v-model="dialogVisible" :title="formTitle" width="30%">
      <el-form :model="formData" ref="formRef" label-position="top">
        <el-form-item v-if="currentType === 'model'" :label="$t('attributes.brand')" prop="brand_id" required>
          <el-select v-model="formData.brand_id" :placeholder="$t('attributes.selectBrand')">
            <el-option v-for="brand in brands" :key="brand.id" :label="brand.name" :value="brand.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('attributes.name')" prop="name" required>
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <el-form-item v-if="currentType === 'partType' || currentType === 'colour'" :label="$t('attributes.code')" prop="code" required>
          <el-input v-model="formData.code"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ $t('attributes.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmit">{{ $t('attributes.save') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as api from '@/api/dimensions.api.js'

const { t } = useI18n()

const activeTab = ref('brands')
const brands = ref([])
const models = ref([])
const partTypes = ref([])
const colours = ref([])

const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentType = ref('')
const currentId = ref(null)
const formData = ref({})
const formRef = ref(null)

const formTitle = computed(() => {
  const action = isEditMode.value ? t('attributes.edit') : t('attributes.add')
  const type = t(`attributes.${currentType.value}`)
  return `${action} ${type}`
})

const fetchData = async () => {
  try {
    const [brandsRes, modelsRes, partTypesRes, coloursRes] = await Promise.all([
      api.getBrands(),
      api.getModels(),
      api.getPartTypes(),
      api.getColours(),
    ])
    brands.value = brandsRes.data
    // This is a bit of a hack to include brand name in model data for display
    models.value = modelsRes.data.map(m => ({...m, brand: brands.value.find(b => b.id === m.brand_id)}))
    partTypes.value = partTypesRes.data
    colours.value = coloursRes.data
  } catch (error) {
    ElMessage.error(t('attributes.fetchError'))
  }
}

const openForm = (type, item = null) => {
  currentType.value = type
  isEditMode.value = !!item
  if (item) {
    currentId.value = item.id
    formData.value = { ...item }
  } else {
    formData.value = { name: '', code: '', brand_id: null }
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    const apiMap = {
      brand: isEditMode.value ? api.updateBrand : api.createBrand,
      model: isEditMode.value ? api.updateModel : api.createModel,
      partType: isEditMode.value ? api.updatePartType : api.createPartType,
      colour: isEditMode.value ? api.updateColour : api.createColour,
    }
    const callApi = apiMap[currentType.value]
    const payload = { ...formData.value }
    delete payload.brand // remove joined data before sending

    if (isEditMode.value) {
      await callApi(currentId.value, payload)
    } else {
      await callApi(payload)
    }

    ElMessage.success(t('attributes.saveSuccess'))
    dialogVisible.value = false
    fetchData()
  } catch (error) {
     if (error === false) return // Form validation failed
     ElMessage.error(t('attributes.saveError'))
  }
}

const handleDelete = async (type, id) => {
  try {
    await ElMessageBox.confirm(
      t('attributes.deleteConfirm'),
      t('attributes.warning'),
      {
        confirmButtonText: t('attributes.ok'),
        cancelButtonText: t('attributes.cancel'),
        type: 'warning',
      }
    )

    const apiMap = {
      brand: api.deleteBrand,
      model: api.deleteModel,
      partType: api.deletePartType,
      colour: api.deleteColour,
    }
    await apiMap[type](id)

    ElMessage.success(t('attributes.deleteSuccess'))
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('attributes.deleteError'))
    }
  }
}

onMounted(fetchData)
</script>

<style scoped>
.attributes-view {
  padding: 20px;
}
.attribute-table {
  margin-top: 20px;
}
</style>
