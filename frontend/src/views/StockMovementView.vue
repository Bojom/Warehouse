<template>
  <div class="stock-movement-view">
    <el-card>
      <div class="scanner-container">
        <h2>{{ $t('stock_movement.scan_barcode') }}</h2>
              <el-input
          ref="barcodeInputRef"
          v-model="barcode"
          :placeholder="$t('stock_movement.scan_or_enter')"
          @keyup.enter="handleBarcodeScan"
                clearable
          class="barcode-input"
              >
          <template #prepend>
                    <el-icon><Search /></el-icon>
                </template>
              </el-input>
      </div>

      <!-- Part Details & Transaction Form -->
      <el-card v-if="scannedPart" class="details-card">
        <el-row :gutter="20">
          <!-- Part Info Display -->
          <el-col :span="12">
            <h3>{{ $t('stock_movement.part_details') }}</h3>
            <p><strong>{{ $t('stock_movement.part_name') }}:</strong> {{ scannedPart.part_name }}</p>
            <p><strong>{{ $t('stock_movement.part_number') }}:</strong> {{ scannedPart.part_number }}</p>
            <p><strong>{{ $t('stock_movement.current_stock') }}:</strong> {{ scannedPart.stock }}</p>
          </el-col>
          <!-- Transaction Form -->
          <el-col :span="12">
            <el-form ref="transactionFormRef" :model="transactionForm" :rules="transactionRules" label-position="top">
              <el-form-item :label="$t('stock_movement.transaction_type')" prop="trans_type">
                <el-radio-group v-model="transactionForm.trans_type">
                  <el-radio-button label="IN">{{ $t('stock_movement.inbound') }}</el-radio-button>
                  <el-radio-button label="OUT">{{ $t('stock_movement.outbound') }}</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item :label="$t('stock_movement.quantity')" prop="quantity">
                <el-input-number v-model="transactionForm.quantity" :min="1" style="width: 100%;" />
              </el-form-item>

              <el-form-item :label="$t('stock_movement.remarks')" prop="remarks">
                <el-input v-model="transactionForm.remarks" type="textarea" :rows="2" />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">{{ $t('stock_movement.confirm') }}</el-button>
                <el-button @click="resetForm">{{ $t('stock_movement.cancel') }}</el-button>
              </el-form-item>
            </el-form>
          </el-col>
        </el-row>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getPartBySku } from '@/api/part.api.js'
import { createTransaction } from '@/api/transaction.api.js'
import { useUserStore } from '@/stores/user'
import { Search } from '@element-plus/icons-vue'

const { t } = useI18n()
const userStore = useUserStore()

const barcode = ref('')
const barcodeInputRef = ref(null)
const scannedPart = ref(null)
const isSubmitting = ref(false)
const transactionFormRef = ref(null)

const transactionForm = reactive({
  part_id: null,
  trans_type: 'IN', // Default to IN
  quantity: 1,
  remarks: '',
  user_id: userStore.user?.id,
})

const transactionRules = computed(() => ({
  trans_type: [
    { required: true, message: t('stock_movement.type_required'), trigger: 'change' },
  ],
  quantity: [
    { required: true, message: t('stock_movement.quantity_required'), trigger: 'blur' },
    { type: 'number', min: 1, message: t('stock_movement.quantity_must_be_positive'), trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (transactionForm.trans_type === 'OUT' && value > scannedPart.value.stock) {
          callback(new Error(t('stock_movement.outbound_quantity_error', { stock: scannedPart.value.stock })))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}))

const handleBarcodeScan = async () => {
  if (!barcode.value) return

  try {
    const response = await getPartBySku(barcode.value)
    scannedPart.value = response.data
    transactionForm.part_id = response.data.id
  } catch (error) {
    console.error('Error fetching part by SKU:', error)
    ElMessage.error(t('stock_movement.fetch_by_sku_fail') + ` ${barcode.value}`)
    resetForm()
  }
}

const handleSubmit = async () => {
  if (!transactionFormRef.value) return

  await transactionFormRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true
      try {
        await createTransaction(transactionForm)
        ElMessage.success(t('stock_movement.transaction_success'))
        resetForm() // Reset form and hide details card
      } catch (error) {
        console.error('Transaction failed:', error)
        ElMessage.error(t('stock_movement.transaction_fail'))
      } finally {
        isSubmitting.value = false
      }
    }
  })
}

const resetForm = () => {
  barcode.value = ''
  scannedPart.value = null
  transactionForm.part_id = null
  transactionForm.trans_type = 'IN'
  transactionForm.quantity = 1
  transactionForm.remarks = ''
  if (transactionFormRef.value) {
    transactionFormRef.value.resetFields()
  }
  if (barcodeInputRef.value) {
    barcodeInputRef.value.focus()
  }
}
</script>

<style scoped>
.stock-movement-view {
  padding: 20px;
}
.scanner-container {
  text-align: center;
  margin-bottom: 2rem;
}
.barcode-input {
  max-width: 500px;
  margin-top: 1rem;
}
.details-card {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

