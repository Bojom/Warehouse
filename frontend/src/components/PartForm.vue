<!-- frontend/src/components/PartForm.vue -->
<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="200px">
    <el-form-item :label="$t('part_form.part_number')" prop="part_number">
      <el-input
        v-model="form.part_number"
        :placeholder="$t('part_form.enter_part_number')"
        data-cy="part-form-number-input"
      ></el-input>
    </el-form-item>
    <el-form-item :label="$t('part_form.part_name')" prop="part_name">
      <el-input
        v-model="form.part_name"
        :placeholder="$t('part_form.enter_part_name')"
        data-cy="part-form-name-input"
      ></el-input>
    </el-form-item>
    <el-form-item :label="$t('part_form.spec')" prop="spec">
      <el-input
        v-model="form.spec"
        :placeholder="$t('part_form.enter_spec')"
        data-cy="part-form-spec-input"
      ></el-input>
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
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// --- Props ---
// define the data that the parent component can pass to this component
const props = defineProps({
  // the initial data for the form, used to display the form when editing
  initialData: {
    type: Object,
    default: () => ({
      part_number: '',
      part_name: '',
      spec: '',
      stock: 0,
      stock_min: 0,
      stock_max: 0,
      supplier_id: null,
    }),
  },
  // supplier list, passed by the parent component
  suppliers: {
    type: Array,
    required: true,
  },
})

// --- form data and references ---
const formRef = ref(null)
const form = ref({ ...props.initialData })

// --- validation rules ---
const rules = computed(() => ({
  part_number: [
    { required: true, message: t('part_form.part_number_required'), trigger: 'blur' },
  ],
  part_name: [
    { required: true, message: t('part_form.part_name_required'), trigger: 'blur' },
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
  (newData) => {
    form.value = { ...newData }
  },
  { deep: true },
) // deep watch for object changes

// --- expose methods to the parent component ---
// use defineExpose to allow the parent component to call these methods via ref
defineExpose({
  // validate the form
  validate: () => {
    return new Promise((resolve, reject) => {
      formRef.value.validate((valid) => {
        if (valid) {
          resolve(form.value) // validation successful, return form data
        } else {
          reject(t('part_form.validation_failed'))
        }
      })
    })
  },
  // reset the form
  reset: () => {
    formRef.value.resetFields()
  },
})
</script>
