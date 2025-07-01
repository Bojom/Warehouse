<template>
  <div class="stock-movement-view">
    <el-card>
      <el-tabs v-model="activeTab">
        <!-- Tab 1: IN/OUT Registration -->
        <el-tab-pane :label="$t('stock_movement.in_out_registration')" name="in-out">
          <el-form
            ref="formInOutRef"
            :model="formInOut"
            :rules="rulesInOut"
            label-width="180px"
            class="form-container"
          >
            <!-- 操作类型 -->
            <el-form-item :label="$t('stock_movement.action_type')" prop="trans_type">
              <el-radio-group v-model="formInOut.trans_type">
                <el-radio-button :label="$t('stock_movement.out')" value="OUT" />
                <el-radio-button :label="$t('stock_movement.in')" value="IN" />
              </el-radio-group>
            </el-form-item>

            <!-- 配件信息 -->
            <el-divider content-position="left">{{ $t('stock_movement.part_info') }}</el-divider>
            <el-form-item :label="$t('stock_movement.part_number')" prop="part_id" class="left-align-label">
              <el-input
                ref="partNumberInputRef"
                v-model="partNumberSearch"
                :placeholder="$t('stock_movement.scan_placeholder')"
                @keydown.enter.prevent="handlePartNumberInput"
                :loading="isSearching"
                clearable
              >
                <template #append>
                  <el-button @click="handlePartNumberInput" :loading="isSearching">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item :label="$t('stock_movement.part_name')">
              <el-input :value="foundPartInOut?.part_name" disabled />
            </el-form-item>
            <el-form-item :label="$t('stock_movement.current_stock')">
              <el-input :value="foundPartInOut?.stock" disabled />
            </el-form-item>

            <!-- 操作信息 -->
            <el-divider content-position="left">{{ $t('stock_movement.operation_info') }}</el-divider>
            <el-form-item :label="$t('stock_movement.quantity')" prop="quantity">
              <el-input-number
                ref="quantityInputRef"
                v-model="formInOut.quantity"
                :min="1"
                @keydown.enter.prevent="handleSubmitInOut"
              />
            </el-form-item>
            <el-form-item :label="$t('stock_movement.handler')">
              <el-input :value="userStore.user?.username" disabled />
            </el-form-item>
            <el-form-item :label="$t('stock_movement.remarks')">
              <el-input v-model="formInOut.remarks" type="textarea" :rows="3" />
            </el-form-item>

            <!-- 操作区 -->
            <el-form-item>
              <el-button type="primary" @click="handleSubmitInOut" :loading="isSubmitting">{{ $t('stock_movement.submit') }}</el-button>
              <el-button @click="handleResetInOut">{{ $t('stock_movement.reset') }}</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Tab 2: Anomaly Report -->
        <el-tab-pane :label="$t('stock_movement.report_anomaly')" name="anomaly">
          <el-form
            ref="formAnomalyRef"
            :model="formAnomaly"
            :rules="rulesAnomaly"
            label-width="180px"
            class="form-container"
          >
            <!-- Part Info -->
            <el-divider content-position="left">{{ $t('stock_movement.part_info') }}</el-divider>
            <el-form-item :label="$t('stock_movement.part_number')" prop="part_id">
              <el-select
                v-model="formAnomaly.part_id"
                :placeholder="$t('stock_movement.search_select_part')"
                filterable
                remote
                :remote-method="searchParts"
                :loading="isSearching"
                @change="handleAnomalyPartSelect"
                style="width: 100%"
              >
                <el-option
                  v-for="part in foundParts"
                  :key="part.id"
                  :label="`${part.part_name} (${part.part_number})`"
                  :value="part.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('stock_movement.current_stock')">
              <el-input :value="selectedAnomalyPart?.stock" disabled />
            </el-form-item>

            <!-- Operation Info -->
            <el-divider content-position="left">{{ $t('stock_movement.operation_info') }}</el-divider>
            <el-form-item :label="$t('stock_movement.anomaly_quantity')" prop="quantity">
              <el-input-number
                v-model="formAnomaly.quantity"
                :min="1"
                :max="selectedAnomalyPart?.stock"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item :label="$t('stock_movement.remarks')" prop="remarks">
              <el-input v-model="formAnomaly.remarks" type="textarea" :rows="3" />
            </el-form-item>

            <!-- Actions -->
            <el-form-item>
              <el-button type="primary" @click="handleAnomalySubmit" :loading="isSubmitting">{{ $t('stock_movement.submit') }}</el-button>
              <el-button @click="handleAnomalyReset">{{ $t('stock_movement.reset') }}</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getParts, getPartByNumber } from '@/api/part.api.js'
import { createTransaction } from '@/api/transaction.api.js'

const { t } = useI18n()
const userStore = useUserStore()
const activeTab = ref('in-out')
const isSubmitting = ref(false)
const isSearching = ref(false)

const formInOutRef = ref(null)
const partNumberInputRef = ref(null)
const quantityInputRef = ref(null)
const formInOut = reactive({
  trans_type: 'OUT',
  part_id: null,
  quantity: 1,
  remarks: '',
})
const rulesInOut = computed(() => ({
  trans_type: [{ required: true, message: t('stock_movement.action_type_required') }],
  part_id: [{ required: true, message: t('stock_movement.part_required') }],
  quantity: [{ required: true, message: t('stock_movement.quantity_required') }],
}))

const partNumberSearch = ref('')
const foundPartInOut = ref(null)

const formAnomalyRef = ref(null)
const formAnomaly = reactive({
  part_id: null,
  quantity: 1,
  remarks: '',
})

const rulesAnomaly = computed(() => ({
  part_id: [{ required: true, message: t('stock_movement.part_select_required') }],
  quantity: [{ required: true, message: t('stock_movement.anomaly_quantity_required') }],
  remarks: [{ required: true, message: t('stock_movement.remarks_required') }],
}))

const foundParts = ref([])
const selectedAnomalyPart = ref(null)

const handlePartNumberInput = async () => {
  if (!partNumberSearch.value) {
    return
  }
  isSearching.value = true
  foundPartInOut.value = null
  formInOut.part_id = null
  try {
    const response = await getPartByNumber(partNumberSearch.value)
    foundPartInOut.value = response.data
    formInOut.part_id = response.data.id
    ElMessage.success(t('stock_movement.part_found', { partName: response.data.part_name }))
    quantityInputRef.value.focus()
  } catch {
    ElMessage.error(t('stock_movement.part_not_found'))
  } finally {
    isSearching.value = false
  }
}

const handleSubmitInOut = async () => {
  if (!formInOutRef.value) return
  await formInOutRef.value.validate(async (valid) => {
    if (valid) {
      if (formInOut.trans_type === 'OUT' && formInOut.quantity > foundPartInOut.value.stock) {
        ElMessage.warning(
          t('stock_movement.quantity_exceeds_stock'),
        )
        return
      }

      isSubmitting.value = true
      try {
        await createTransaction(formInOut)
        ElMessage.success(t('stock_movement.operation_successful'))
        handleResetInOut()
      } catch (error) {
        const errorMsg = error.response?.data?.error || t('stock_movement.operation_failed')
        ElMessage.error(errorMsg)
      } finally {
        isSubmitting.value = false
      }
    } else {
      ElMessage.error(t('stock_movement.check_form_input'))
    }
  })
}

const handleResetInOut = () => {
  formInOutRef.value.resetFields()
  partNumberSearch.value = ''
  foundPartInOut.value = null
  formInOut.remarks = ''
  partNumberInputRef.value.focus()
}

const searchParts = async (query) => {
  if (!query) {
    foundParts.value = []
    return
  }
  isSearching.value = true
  try {
    const response = await getParts({ search: query, pageSize: 20 })
    foundParts.value = response.data.parts
  } catch {
    ElMessage.error(t('stock_movement.search_parts_failed'))
  } finally {
    isSearching.value = false
  }
}

const handleAnomalyPartSelect = (partId) => {
  selectedAnomalyPart.value = foundParts.value.find((p) => p.id === partId)
}

const handleAnomalySubmit = async () => {
  if (!formAnomalyRef.value) return
  await formAnomalyRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true
      try {
        await createTransaction({
          ...formAnomaly,
          trans_type: 'ANOMALY',
        })
        ElMessage.success(t('stock_movement.operation_successful'))
        handleAnomalyReset()
      } catch (error) {
        const errorMsg = error.response?.data?.error || t('stock_movement.operation_failed')
        ElMessage.error(errorMsg)
      } finally {
        isSubmitting.value = false
      }
    } else {
      ElMessage.error(t('stock_movement.check_form_input'))
    }
  })
}

const handleAnomalyReset = () => {
  formAnomalyRef.value.resetFields()
  formAnomaly.remarks = ''
  foundParts.value = []
  selectedAnomalyPart.value = null
}

onMounted(() => {
  partNumberInputRef.value.focus()
})
</script>

<style scoped>
.stock-movement-view {
  padding: 20px;
}
.form-container {
  max-width: 600px;
  margin: auto;
}
.left-align-label .el-form-item__label {
  text-align: left;
}
</style>
