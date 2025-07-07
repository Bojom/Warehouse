<template>
  <div>
    <div class="toolbar">
      <h3>{{ title }}</h3>
      <el-button v-if="userStore.isAdmin" type="primary" @click="openDialog()">{{ $t('attributes.add') }}</el-button>
    </div>
    <el-table :data="items" v-loading="loading" border>
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="$t(column.label)"
      ></el-table-column>
      <el-table-column v-if="userStore.isAdmin" :label="$t('attributes.actions')" width="180">
        <template #default="scope">
          <el-button size="small" @click="openDialog(scope.row)">{{ $t('attributes.edit') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">{{ $t('attributes.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px" @close="resetForm">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-position="top">
        <el-form-item
          v-for="field in formFields"
          :key="field.name"
          :label="field.label.includes('attributes.') ? $t(field.label) : field.label"
          :prop="field.name"
        >
          <el-input v-if="field.type === 'text'" v-model="formData[field.name]"></el-input>
          <el-select
            v-else-if="field.type === 'select'"
            v-model="formData[field.name]"
            :placeholder="$t('attributes.select_brand')"
            style="width: 100%;"
          >
            <el-option
              v-for="option in field.options.value"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('attributes.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ $t('attributes.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineProps } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user';
import { ElMessage, ElMessageBox } from 'element-plus';

const { t } = useI18n();
const userStore = useUserStore();

const props = defineProps({
  title: String,
  columns: Array,
  fetchData: Function,
  createItem: Function,
  updateItem: Function,
  deleteItem: Function,
  formFields: Array,
  selectOptions: Object,
});

const items = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentId = ref(null);
const formData = ref({});
const formRef = ref(null);

const dialogTitle = computed(() => {
  const action = isEdit.value ? t('attributes.edit') : t('attributes.add');
  return `${action} ${props.title}`;
});

const formRules = computed(() => {
  const rules = {};
  props.formFields.forEach(field => {
    if (field.required) {
      rules[field.name] = [{ required: true, message: t('attributes.required_field'), trigger: 'blur' }];
    }
  });
  return rules;
});

const loadData = async () => {
  loading.value = true;
  try {
    const response = await props.fetchData();
    items.value = response.data;
  } catch (error) {
    console.error("Failed to load data:", error);
    ElMessage.error(t('attributes.fetch_fail'));
  } finally {
    loading.value = false;
  }
};

const openDialog = (item = null) => {
  isEdit.value = !!item;
  if (item) {
    currentId.value = item.id;
    // Use reduce to create a new object with only the required fields
    formData.value = props.formFields.reduce((acc, field) => {
      acc[field.name] = item[field.name];
      return acc;
    }, {});
  } else {
    resetForm();
  }
  dialogVisible.value = true;
};

const resetForm = () => {
  formData.value = {};
  currentId.value = null;
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await props.updateItem(currentId.value, formData.value);
        } else {
          await props.createItem(formData.value);
        }
        ElMessage.success(t('attributes.save_success'));
        dialogVisible.value = false;
        loadData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || t('attributes.save_fail'));
      }
    }
  });
};

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(t('attributes.delete_confirm'), t('attributes.warning'), {
      confirmButtonText: t('attributes.confirm'),
      cancelButtonText: t('attributes.cancel'),
      type: 'warning',
    });
    await props.deleteItem(id);
    ElMessage.success(t('attributes.delete_success'));
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('attributes.delete_fail'));
    }
  }
};

onMounted(loadData);
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
