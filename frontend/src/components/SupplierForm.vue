<!-- frontend/src/components/SupplierForm.vue -->
<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="150px">
    <el-form-item :label="$t('supplier_form.supplier_name')" prop="supplier_name">
      <el-input
        v-model="form.supplier_name"
        :placeholder="$t('supplier_form.enter_supplier_name')"
        data-cy="supplier-form-name-input"
      ></el-input>
    </el-form-item>
    <el-form-item :label="$t('supplier_form.contact')" prop="contact">
      <el-input
        v-model="form.contact"
        :placeholder="$t('supplier_form.enter_contact')"
        data-cy="supplier-form-contact-input"
      ></el-input>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      supplier_name: '',
      contact: '', // Simplified to one field
    }),
  },
})

const formRef = ref(null)
const form = ref({ ...props.initialData })

const rules = computed(() => ({
  supplier_name: [{ required: true, message: t('supplier_form.supplier_name_required'), trigger: 'blur' }],
}))

watch(
  () => props.initialData,
  (newData) => {
    form.value = { ...newData }
  },
  { deep: true, immediate: true },
)

defineExpose({
  validate: () => {
    return formRef.value.validate()
  },
  getFormData: () => {
    return form.value
  },
})
</script>
