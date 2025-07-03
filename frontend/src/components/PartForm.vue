<!-- frontend/src/components/PartForm.vue -->
<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="200px">
    <!-- Generated Part Name Display -->
    <el-form-item :label="$t('part_form.part_name')">
      <el-input :value="generatedPartName" disabled />
    </el-form-item>

    <!-- Brand Dropdown -->
    <el-form-item :label="$t('part_form.brand')" prop="brand_id">
      <el-select
        v-model="form.brand_id"
        :placeholder="$t('part_form.select_brand')"
        style="width: 100%"
        @change="handleBrandChange"
      >
        <el-option
          v-for="item in brands"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

    <!-- Model Dropdown -->
    <el-form-item :label="$t('part_form.model')" prop="model_id">
      <el-select
        v-model="form.model_id"
        :placeholder="$t('part_form.select_model')"
        style="width: 100%"
        :disabled="!form.brand_id"
      >
        <el-option
          v-for="item in models"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

    <!-- Part Type Dropdown -->
    <el-form-item :label="$t('part_form.part_type')" prop="part_type_id">
      <el-select
        v-model="form.part_type_id"
        :placeholder="$t('part_form.select_part_type')"
        style="width: 100%"
      >
        <el-option
          v-for="item in partTypes"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

    <!-- Colour Dropdown -->
    <el-form-item :label="$t('part_form.colour')" prop="colour_id">
      <el-select
        v-model="form.colour_id"
        :placeholder="$t('part_form.select_colour')"
        style="width: 100%"
        clearable
      >
        <el-option
          v-for="item in colours"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item :label="$t('part_form.stock')" prop="stock">
      <el-input-number v-model="form.stock" :min="0" data-cy="part-form-stock-input" />
    </el-form-item>
    <el-form-item :label="$t('part_form.min_stock')" prop="stock_min">
      <el-input-number v-model="form.stock_min" :min="0" />
    </el-form-item>
    <el-form-item :label="$t('part_form.max_stock')" prop="stock_max">
      <el-input-number v-model="form.stock_max" :min="0" />
    </el-form-item>
    <el-form-item :label="$t('part_form.supplier')" prop="supplier_id">
      <el-select
        v-model="form.supplier_id"
        :placeholder="$t('part_form.select_supplier')"
        style="width: 100%"
        data-cy="part-form-supplier-select"
      >
        <!-- 这里的选项将由父组件传入 -->
        <el-option
          v-for="item in suppliers"
          :key="item.id"
          :label="item.supplier_name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  getBrands,
  getModels,
  getPartTypes,
  getColours,
} from '@/api/dimensions.api.js'

const { t } = useI18n()

// --- Props ---
const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      part_name: '',
      spec: '',
      stock: 0,
      stock_min: 0,
      stock_max: 0,
      supplier_id: null,
      brand_id: null,
      model_id: null,
      part_type_id: null,
      colour_id: null,
    }),
  },
  suppliers: {
    type: Array,
    required: true,
  },
})

// --- Computed property for generated part name ---
const generatedPartName = computed(() => {
  const brand = brands.value.find((b) => b.id === form.value.brand_id)
  const model = models.value.find((m) => m.id === form.value.model_id)
  const partType = partTypes.value.find((pt) => pt.id === form.value.part_type_id)
  const colour = colours.value.find((c) => c.id === form.value.colour_id)

  let name = ''
  if (brand && model && partType) {
    name = `${brand.name} ${model.name} ${partType.name}`
    if (colour) {
      name += ` - ${colour.name}`
    }
  }
  return name
})

// --- Dimension Data ---
const brands = ref([])
const models = ref([])
const partTypes = ref([])
const colours = ref([])

// --- form data and references ---
const formRef = ref(null)
const form = ref({ ...props.initialData })

// --- Fetch dimension data on mount ---
onMounted(async () => {
  try {
    const [brandsRes, partTypesRes, coloursRes] = await Promise.all([
      getBrands(),
      getPartTypes(),
      getColours(),
    ])
    brands.value = brandsRes.data
    partTypes.value = partTypesRes.data
    colours.value = coloursRes.data
  } catch (error) {
    console.error('Failed to fetch dimension data:', error)
  }
})

// --- Dynamic Model Loading ---
const handleBrandChange = async (brandId) => {
  form.value.model_id = null // Reset model selection
  models.value = []
  if (brandId) {
    try {
      const response = await getModels(brandId)
      models.value = response.data
    } catch (error) {
      console.error('Failed to fetch models:', error)
    }
  }
}

// --- validation rules ---
const rules = computed(() => ({
  brand_id: [
    { required: true, message: t('part_form.brand_required'), trigger: 'change' },
  ],
  model_id: [
    { required: true, message: t('part_form.model_required'), trigger: 'change' },
  ],
  part_type_id: [
    { required: true, message: t('part_form.part_type_required'), trigger: 'change' },
  ],
  stock_max: [
    {
      validator: (rule, value, callback) => {
        if (value < form.value.stock_min) {
          callback(new Error(t('part_form.max_stock_error')))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
  supplier_id: [
    {
      required: true,
      message: t('part_form.supplier_required'),
      trigger: 'change',
    },
  ],
}))

// --- watch for changes in initialData ---
// when the parent component changes initialData (e.g. clicking edit different rows), update the form content
watch(
  () => props.initialData,
  async (newData) => {
    form.value = { ...newData }
    if (newData.brand_id) {
      // If editing, load the models for the initial brand
      await handleBrandChange(newData.brand_id)
      form.value.model_id = newData.model_id //
    }
  },
  { deep: true, immediate: true }
)

// --- expose methods to the parent component ---
// use defineExpose to allow the parent component to call these methods via ref
defineExpose({
  // validate the form
  validate: () => {
    return new Promise((resolve, reject) => {
      // Manually set the generated part name before validation
      form.value.part_name = generatedPartName.value

      formRef.value.validate((valid) => {
        if (valid) {
          // Ensure part_name is not empty if it's required by the logic
          if (!form.value.part_name) {
            // This case should ideally not be hit if dropdowns are required
            reject(t('part_form.validation_failed'))
            return
          }
          resolve(form.value) // validation successful, return form data
        } else {
          reject(t('part_form.validation_failed'))
        }
      })
    })
  },
  // get the current form data
  getFormData: () => form.value,
})
</script>
