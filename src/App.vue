<template>
  <div class="easyCSV">
    <h1>EasyCSV</h1>
    <div class="select-wrapper">
      <v-select
        v-model="templateSelect"
        label="使用模板"
        hide-details
        :items="templateSelectList"
        item-title="name"
        item-value="id"
        return-object
      >
      </v-select>
      <v-btn color="error" @click="deleteTemplate" v-show="templateSelect.id != 0">刪除模板</v-btn>
    </div>
    <div class="template-wrapper">
      <v-text-field v-model="templateName" variant="outlined" label="模板名稱" hide-details></v-text-field>
      <div class="template-wrapper-row">
        <v-btn color="primary" class="upload">
          <v-file-input
            v-model="uploadTempalteFile"
            accept=".json"
            hide-details
            @change="uploadTemplateJSON"
          ></v-file-input>
          上傳JSON
        </v-btn>
      </div>
      <v-textarea
        v-model="templateString"
        label="模板輸入區塊"
        placeholder="請輸入模板..."
        spellcheck="false"
        hide-details
      ></v-textarea>
      <div class="template-wrapper-row text-right">
        <v-btn color="primary" @click="saveTemplate">儲存模板</v-btn>
      </div>
    </div>
    <div class="flex-area">
      <div class="col-8 textarea-wrapper">
        <div class="textarea-wrapper-row">
          <v-btn color="primary" class="upload">
            <v-file-input
              v-model="uploadResultFile"
              accept=".json"
              hide-details
              @change="uploadResultJSON"
            ></v-file-input>
            上傳JSON
          </v-btn>
        </div>
        <div class="source-wrapper">
          <v-textarea
            v-model="resourceJSON"
            label="來源資料區塊"
            placeholder="請貼上要處理的資料"
            hide-details
          ></v-textarea>
        </div>
      </div>
      <div class="col-4 row-wrapper">
        <div class="role-area">
          <div class="role-area-header">
            <div class="role-area-header-title">篩選器設定</div>
            <div class="role-area-header-button">
              <v-btn color="primary" @click="createTemplateToFilter">讀取模板</v-btn>
            </div>
          </div>
          <v-expansion-panels v-model="filterExpansionList" density="comfortable" multiple>
            <template v-for="(item, index) in filterItem" :key="`filterItem_${index}`">
              <v-expansion-panel class="role-area-item" :title="item.sourceName" density="comfortable">
                <v-expansion-panel-text>
                  <div class="filter">
                    <div class="filter-control">
                      <v-text-field v-model="item.reName" label="別名" variant="outlined" hide-details></v-text-field>
                      <v-select
                        v-model="item.type"
                        :items="filterTypeList"
                        label="過濾模式"
                        variant="outlined"
                        hide-details
                      ></v-select>
                      <v-select
                        v-model="item.include"
                        :items="filterIncludeList"
                        label="包含內容"
                        variant="outlined"
                        hide-details
                      ></v-select>
                    </div>
                    <div class="filter-number" v-show="item.type == 'number'">
                      <v-text-field
                        v-model="item.number.min"
                        type="number"
                        label="最小值"
                        variant="outlined"
                        hide-details
                      ></v-text-field>
                      <v-text-field
                        v-model="item.number.max"
                        type="number"
                        label="最大值"
                        variant="outlined"
                        hide-details
                      ></v-text-field>
                    </div>
                    <div class="filter-content" v-show="item.type == 'text'">
                      <v-combobox
                        v-model="item.textfield"
                        label="篩選文字"
                        variant="outlined"
                        multiple
                        hide-details
                        placeholder="點擊 Enter 儲存 Chip"
                      >
                        <template v-slot:selection="data">
                          <v-chip size="small" v-bind="data.attrs" :model-value="data.selected">
                            <template v-slot:append>
                              <v-icon icon="mdi-close" @click="item.textfield.splice(data.index, 1)"></v-icon>
                            </template>
                            {{ data.item.title }}
                          </v-chip>
                        </template>
                      </v-combobox>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </template>
          </v-expansion-panels>
        </div>
        <div class="button-area text-right">
          <v-btn color="primary" @click="readSourceAndFilterToView">資料生成</v-btn>
        </div>
      </div>
    </div>
    <div class="download-area" v-show="preViewHeader.length != 0">
      <v-btn color="primary" @click="downloadCsv">Download CSV</v-btn>
    </div>
    <div class="preview-area" v-show="preViewHeader.length != 0">
      <v-table>
        <thead>
          <tr>
            <th v-for="(item, index) in preViewHeader" :key="`preViewHeader_${index}`">{{ item }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in preViewData" :key="`previewList_${index}`">
            <td v-for="(headerItem, headerIndex) in preViewDataHeader" :key="`previewData_${headerIndex}`">
              {{ item[headerItem] }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <v-snackbar v-model="isSnackbarOpen" location="top" :color="feebackType" timeout="3000">{{
      feebackContent
    }}</v-snackbar>
  </div>
</template>
<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
// snackbar feeback
let isSnackbarOpen = ref(false);
let feebackType = ref('success');
let feebackContent = ref('成功！');
// 透過 cookie 獲得模板列表
let templateSelect = ref({ id: '0', name: '不使用', value: '' });
let templateSelectList = ref([{ id: '0', name: '不使用', value: '' }]);
const readTemplate = changeItem => {
  if (document.cookie.split(';'.length != 0)) {
    let template = document.cookie.split(';').find(item => item.trim().indexOf('json2csv') == 0);
    if (template) {
      let list = template.trim().substring('json2csv='.length);
      templateSelectList.value = JSON.parse(decodeURIComponent(list));
      if (changeItem) {
        templateSelect.value = changeItem;
      }
    }
  }
};
onMounted(() => {
  readTemplate();
});
const changeTemplate = obj => {
  templateName.value = obj.name;
  templateString.value = obj.value;
  createTemplateToFilter();
};
// 選擇模板
watch(templateSelect, val => {
  changeTemplate(val);
});
// 儲存模板
let templateName = ref([]);
const saveTemplate = async () => {
  if (templateName.value.trim().length != 0) {
    try {
      let item = {};
      let sourceObjIndex = templateSelectList.value.findIndex(item => item.name == templateName.value.id);
      if (sourceObjIndex != -1) {
        templateSelectList.value[sourceObjIndex].value = templateString.value.trim();
        item = templateSelectList.value[sourceObjIndex];
      } else {
        let length = templateSelectList.value.length;
        item = {
          id: String(length),
          name: templateName.value,
          value: templateString.value.trim()
        };
        templateSelectList.value.push(item);
      }
      let string = encodeURIComponent(JSON.stringify(templateSelectList.value));
      document.cookie = `json2csv=${string}`;
      readTemplate(item);
      isSnackbarOpen.value = true;
      feebackType.value = 'success';
      feebackContent.value = '成功儲存模板！';
    } catch (error) {
      isSnackbarOpen.value = true;
      feebackType.value = 'error';
      feebackContent.value = '請確認模板是否符合格式';
    }
  } else {
    isSnackbarOpen.value = true;
    feebackType.value = 'info';
    feebackContent.value = '請填入模板名稱';
  }
};
// 刪除模板
const deleteTemplate = () => {
  if (templateSelectList.value.length != 1) {
    let itemIndex = templateSelectList.value.findIndex(item => item.id == templateSelect.value.id);
    if (itemIndex != -1) {
      console.log(itemIndex);
      templateSelectList.value.splice(itemIndex, 1);
      let string = encodeURIComponent(JSON.stringify(templateSelectList.value));
      document.cookie = `json2csv=${string}`;
      readTemplate(templateSelectList.value[0]);
    }
  }
};
// 透過 upload 建立模板
let uploadTempalteFile = ref('');
const uploadTemplateJSON = event => {
  let file = event.target.files[0];
  let fileReader = new FileReader();
  fileReader.readAsText(file, 'utf-8');
  fileReader.onload = readerEvent => {
    let result = fileReader.result;
    try {
      result = JSON.parse(result);
      let singleArrayMapping = null;
      let resultString = '';
      let resultMapping = {
        key: Object.keys(result),
        value: Object.values(result)
      };
      let mappingStatus = true;
      const createTemplateColumn = function (item, index, result) {
        if (typeof item == 'object') {
          if (Array.isArray(item) && !singleArrayMapping) {
            singleArrayMapping = {
              key: Object.keys(item[0]),
              value: Object.values(item[0])
            };
            if (singleArrayMapping.key.length == 0) {
              resultString += `${resultMapping.key[index]};`;
            } else {
              resultString += `${resultMapping.key[index]}:`;
              singleArrayMapping.key.forEach((secItem, secIndex) => {
                resultString += `${secItem}`;
                if (secIndex != singleArrayMapping.key.length - 1) {
                  resultString += `,`;
                } else {
                  resultString += `;`;
                }
              });
            }
          } else if (Array.isArray(item.isArray) && singleArrayMapping) {
            isSnackbarOpen.value = true;
            feebackType.value = 'info';
            feebackContent.value = '目前僅接受包含一個陣列！';
            mappingStatus = false;
            return false;
          } else {
            isSnackbarOpen.value = true;
            feebackType.value = 'info';
            feebackContent.value = '目前尚未接受內部包含物件！';
            mappingStatus = false;
            return false;
          }
        } else {
          resultString += `${resultMapping.key[index]};`;
        }
        return true;
      };
      resultMapping.value.every((item, index) => {
        return createTemplateColumn(item, index);
      });
      if (mappingStatus) {
        templateString.value = resultString;
        createTemplateToFilter();
      }
    } catch (error) {
      isSnackbarOpen.value = true;
      feebackType.value = 'error';
      feebackContent.value = '請確認上傳的 JSON 檔案為物件！';
    }
  };
};
// 透過 textarea 建立模板，建立後顯示表格 title 出來
const resultTemplateStringToHeader = function (txt) {
  let txtList = txt.split(';');
  let resultArray = [];
  try {
    txtList.forEach(item => {
      // 目前僅處理雙層 JSON，以冒號表示巢狀第一層內容
      let itemList = item.split(':');
      if (itemList.length == 1 && item.trim().length != 0) {
        resultArray.push(item.trim());
      } else if (itemList.length == 2) {
        itemList[1].split(',').forEach(secItem => {
          if (secItem.trim().length != 0) {
            let tempStr = `${itemList[0].trim()}:${secItem.trim()}`;
            resultArray.push(tempStr);
          }
        });
      }
    });
    return resultArray;
  } catch (error) {
    isSnackbarOpen.value = true;
    feebackType.value = 'error';
    feebackContent.value = '模板表頭建立錯誤，請確認模板內容!';
    return [];
  }
};
let templateString = ref('name;age;class:teacher,day;gender');
// 建立模板來設定篩選器
let filterExpansionList = ref([]);
let filterItem = ref([]);
let filterMapping = ref({});
let filterTypeList = ['none', 'number', 'text'];
let filterIncludeList = ['include', 'exclude'];
const createTemplateToFilter = () => {
  let tempFilterItem = resultTemplateStringToHeader(templateString.value);
  filterItem.value = [];
  tempFilterItem.forEach((item, index) => {
    let objItem = {
      sourceName: item,
      reName: item,
      type: 'none', // none: 不設定; number: 數值區間; text: 文字連級
      include: 'include', // include: 包含; exclude: 不包含
      number: {
        min: 0,
        max: 999
      },
      textfield: []
    };
    filterItem.value.push(objItem);
    filterMapping.value[objItem.sourceName] = index;
    preViewHeader.value = [];
    preViewDataHeader.value = [];
    preViewData.value = [];
  });
};
// 讀取篩選器來查看資料
let resourceJSON = ref('');
let uploadResultFile = ref([]);
let resultData = ref([]);
let preViewHeader = ref([]);
let preViewDataHeader = ref([]);
let preViewData = ref([]);
const uploadResultJSON = event => {
  let file = event.target.files[0];
  let fileReader = new FileReader();
  fileReader.readAsText(file, 'utf-8');
  fileReader.onload = readerEvent => {
    let result = fileReader.result;
    try {
      resourceJSON.value = result;
    } catch (error) {
      isSnackbarOpen.value = true;
      feebackType.value = 'error';
      feebackContent.value = '上傳檔案無法轉換成 JSON';
    }
  };
};
const readSourceAndFilterToView = async () => {
  try {
    let tempArray = JSON.parse(resourceJSON.value);
    resultData.value = [];
    let tempHeader = resultTemplateStringToHeader(templateString.value);
    let arrayColumn = tempHeader.find(headerItem => headerItem.split(':').length == 2);
    if (arrayColumn) {
      let muliColumn = arrayColumn.split(':')[0];
      let filterStatus = true;
      tempArray.forEach(item => {
        if (item[muliColumn].length == 0) {
          let tempItem = {};
          tempHeader.every((headerItem, headerIndex) => {
            let splitItem = headerItem.split(':');
            if (splitItem.length == 1) {
              if (filterItem.value[headerIndex].type == 'none') {
                tempItem[headerItem] = item[headerItem];
              } else if (filterItem.value[headerIndex].type == 'number') {
                if (filterItem.value[headerIndex].include == 'include') {
                  if (
                    Number(item[headerItem]) >= filterItem.value[headerIndex].number.min &&
                    Number(item[headerItem]) <= filterItem.value[headerIndex].number.max
                  ) {
                    tempItem[headerItem] = item[headerItem];
                  } else {
                    filterStatus = false;
                    return false;
                  }
                } else if (filterItem.value[headerIndex].include == 'exclude') {
                  if (
                    !(
                      Number(item[headerItem]) >= filterItem.value[headerIndex].number.min &&
                      Number(item[headerItem] <= filterItem.value[headerIndex].number.max)
                    )
                  ) {
                    tempItem[headerItem] = item[headerItem];
                  } else {
                    filterStatus = false;
                    return false;
                  }
                }
              } else if (filterItem.value[headerIndex].type == 'text') {
                if (filterItem.value[headerIndex].include == 'include') {
                  let isInclude = false;
                  filterItem.value[headerIndex].textfield.forEach((stringItem, stringIndex) => {
                    if (item[headerItem].indexOf(stringItem) == -1 && !isInclude) {
                      isInclude = false;
                    } else {
                      isInclude = true;
                    }
                  });
                  if (isInclude) {
                    tempItem[headerItem] = item[headerItem];
                  } else {
                    filterStatus = false;
                    return false;
                  }
                } else if (filterItem.value[headerIndex].include == 'exclude') {
                  let isInclude = false;
                  filterItem.value[headerIndex].textfield.every((stringItem, stringIndex) => {
                    if (item[headerItem].indexOf(stringItem) != -1 && !isInclude) {
                      isInclude = false;
                    } else {
                      isInclude = true;
                    }
                  });
                  if (isInclude) {
                    tempItem[headerItem] = item[headerItem];
                  } else {
                    filterStatus = false;
                    return false;
                  }
                }
              }
            } else if (splitItem.length == 2) {
              if (filterItem.value[headerIndex].type == 'none') {
                tempItem[`${splitItem[0]}:${splitItem[1]}`] = '';
              } else if (filterItem.value[headerIndex].type == 'number') {
                if (filterItem.value[headerIndex].include == 'include') {
                  filterStatus = false;
                  return false;
                } else if (filterItem.value[headerIndex].include == 'exclude') {
                  tempItem[`${splitItem[0]}:${splitItem[1]}`] = '';
                }
              } else if (filterItem.value[headerIndex].type == 'text') {
                if (filterItem.value[headerIndex].include == 'include') {
                  if (filterItem.value[headerIndex].textfield.length != 0) {
                    tempItem[`${splitItem[0]}:${splitItem[1]}`] = '';
                  } else {
                    filterStatus = false;
                    return false;
                  }
                } else if (filterItem.value[headerIndex].include == 'exclude') {
                  tempItem[`${splitItem[0]}:${splitItem[1]}`] = '';
                }
              }
            }
            return true;
          });
          if (filterStatus) {
            resultData.value.push(tempItem);
          } else {
            filterStatus = true;
          }
        } else {
          let muliStatus = true;
          item[muliColumn].forEach((muliItem, muliIndex) => {
            let tempItem = {};
            tempHeader.every((headerItem, headerIndex) => {
              let splitItem = headerItem.split(':');
              if (splitItem.length == 1) {
                if (filterItem.value[headerIndex].type == 'none') {
                  tempItem[headerItem] = item[headerItem];
                } else if (filterItem.value[headerIndex].type == 'number') {
                  if (filterItem.value[headerIndex].include == 'include') {
                    if (
                      Number(item[headerItem]) >= filterItem.value[headerIndex].number.min &&
                      Number(item[headerItem]) <= filterItem.value[headerIndex].number.max
                    ) {
                      tempItem[headerItem] = item[headerItem];
                    } else {
                      muliStatus = false;
                      filterStatus = false;
                      return false;
                    }
                  } else if (filterItem.value[headerIndex].include == 'exclude') {
                    if (
                      !(
                        Number(value) >= filterItem.value[headerIndex].number.min &&
                        Number(value) <= filterItem.value[headerIndex].number.max
                      )
                    ) {
                      tempItem[headerItem] = item[headerItem];
                    } else {
                      muliStatus = false;
                      filterStatus = false;
                      return false;
                    }
                  }
                } else if (filterItem.value[headerIndex].type == 'text') {
                  if (filterItem.value[headerIndex].include == 'include') {
                    let isInclude = false;
                    filterItem.value[headerIndex].textfield.forEach((stringItem, stringIndex) => {
                      if (item[headerItem].indexOf(stringItem) == -1 && !isInclude) {
                        isInclude = false;
                      } else {
                        isInclude = true;
                      }
                    });
                    if (isInclude) {
                      tempItem[headerItem] = item[headerItem];
                    } else {
                      muliStatus = false;
                      filterStatus = false;
                      return false;
                    }
                  } else if (filterItem.value[headerIndex].include == 'exclude') {
                    let isInclude = false;
                    filterItem.value[headerIndex].textfield.every((stringItem, stringIndex) => {
                      if (item[headerItem].indexOf(stringItem) != -1 && !isInclude) {
                        isInclude = false;
                      } else {
                        isInclude = true;
                      }
                    });
                    if (isInclude) {
                      tempItem[headerItem] = item[headerItem];
                    } else {
                      muliStatus = false;
                      filterStatus = false;
                      return false;
                    }
                  }
                }
              } else if (splitItem.length == 2) {
                let columnName = `${splitItem[0]}:${splitItem[1]}`;
                let value = item[splitItem[0]][muliIndex][splitItem[1]];
                // tempItem[`${splitItem[0]}:${splitItem[1]}`] = item[splitItem[0]][muliIndex][splitItem[1]];
                if (filterItem.value[headerIndex].type == 'none') {
                  tempItem[columnName] = value;
                } else if (filterItem.value[headerIndex].type == 'number') {
                  if (filterItem.value[headerIndex].include == 'include') {
                    if (
                      Number(value) >= filterItem.value[headerIndex].number.min &&
                      Number(value) <= filterItem.value[headerIndex].number.max
                    ) {
                      tempItem[columnName] = value;
                    } else {
                      filterStatus = false;
                      return false;
                    }
                  } else if (filterItem.value[headerIndex].include == 'exclude') {
                    if (
                      !(
                        Number(value) >= filterItem.value[headerIndex].number.min &&
                        Number(value) <= filterItem.value[headerIndex].number.max
                      )
                    ) {
                      tempItem[column] = value;
                    } else {
                      filterStatus = false;
                      return false;
                    }
                  }
                } else if (filterItem.value[headerIndex].type == 'text') {
                  if (filterItem.value[headerIndex].include == 'include') {
                    let isInclude = false;
                    filterItem.value[headerIndex].textfield.forEach((stringItem, stringIndex) => {
                      if (value.indexOf(stringItem) == -1 && !isInclude) {
                        isInclude = false;
                      } else {
                        isInclude = true;
                      }
                    });
                    if (isInclude) {
                      tempItem[columnName] = value;
                    } else {
                      filterStatus = false;
                      return false;
                    }
                  } else if (filterItem.value[headerIndex].include == 'exclude') {
                    let isInclude = false;
                    filterItem.value[headerIndex].textfield.every((stringItem, stringIndex) => {
                      if (value.indexOf(stringItem) != -1 && !isInclude) {
                        isInclude = false;
                      } else {
                        isInclude = true;
                      }
                    });
                    if (isInclude) {
                      tempItem[columnName] = value;
                    } else {
                      filterStatus = false;
                      return false;
                    }
                  }
                }
              }
              return true;
            });
            if (muliStatus && filterStatus) {
              resultData.value.push(tempItem);
            } else {
              filterStatus = true;
              muliStatus = true;
            }
          });
        }
      });
    } else {
      let filterStatus = true;
      tempArray.forEach(item => {
        let tempItem = {};
        if (filterStatus) {
          tempHeader.every((headerItem, headerIndex) => {
            let splitItem = headerItem.split(':');
            if (splitItem.length == 1) {
              if (filterItem.value[headerIndex].type == 'none') {
                tempItem[headerItem] = item[headerItem];
              } else if (filterItem.value[headerIndex].type == 'number') {
                if (filterItem.value[headerIndex].include == 'include') {
                  if (
                    Number(item[headerItem]) >= filterItem.value[headerIndex].number.min &&
                    Number(item[headerItem] <= filterItem.value[headerIndex].number.max)
                  ) {
                    tempItem[headerItem] = item[headerItem];
                  } else {
                    filterStatus = false;
                    return false;
                  }
                } else if (filterItem.value[headerIndex].include == 'exclude') {
                  if (
                    !(
                      Number(item[headerItem]) >= filterItem.value[headerIndex].number.min &&
                      Number(item[headerItem] <= filterItem.value[headerIndex].number.max)
                    )
                  ) {
                    tempItem[headerItem] = item[headerItem];
                  } else {
                    filterStatus = false;
                    return false;
                  }
                }
              } else if (filterItem.value[headerIndex].type == 'text') {
                if (filterItem.value[headerIndex].include == 'include') {
                  let isInclude = false;
                  filterItem.value[headerIndex].textfield.forEach((stringItem, stringIndex) => {
                    if (item[headerItem].indexOf(stringItem) == -1 && !isInclude) {
                      isInclude = false;
                    } else {
                      isInclude = true;
                    }
                  });
                  if (isInclude) {
                    tempItem[headerItem] = item[headerItem];
                  } else {
                    filterStatus = false;
                    return false;
                  }
                } else if (filterItem.value[headerIndex].include == 'exclude') {
                  let isInclude = false;
                  filterItem.value[headerIndex].textfield.every((stringItem, stringIndex) => {
                    if (item[headerItem].indexOf(stringItem) != -1 && !isInclude) {
                      isInclude = false;
                    } else {
                      isInclude = true;
                    }
                  });
                  if (isInclude) {
                    tempItem[headerItem] = item[headerItem];
                  } else {
                    filterStatus = false;
                    return false;
                  }
                }
              }
            }
            return true;
          });
        }
        if (filterStatus) {
          resultData.value.push(tempItem);
        } else {
          filterStatus = true;
        }
      });
    }
    preViewHeader.value = filterItem.value.map(item => item.reName);
    preViewDataHeader.value = filterItem.value.map(item => item.sourceName);
    preViewData.value = resultData.value.slice(0, 10);
    await nextTick();
    let downloadTop = document.querySelector('.download-area button').offsetTop;
    window.scrollTo({ behavior: 'smooth', top: downloadTop - 20 });
  } catch (error) {
    console.log(error);
    isSnackbarOpen.value = true;
    feebackType.value = 'error';
    feebackContent.value = '無法生成資料，請檢查資料與模板是否匹配！';
  }
};
// 下載檔案
const downloadCsv = () => {
  try {
    let csvContent = '';
    let header = filterItem.value.map(item => item.reName);
    let dataHeader = filterItem.value.map(item => item.sourceName);
    csvContent += `${header.toString()}\n`;
    resultData.value.forEach(item => {
      dataHeader.forEach((headerItem, headerIndex) => {
        csvContent += item[headerItem];
        if (headerIndex != header.length - 1) {
          csvContent += ',';
        } else {
          csvContent += '\n';
        }
      });
    });
    let fileName = `下載資料${new Date().getTime()}.csv`;
    let link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURI(csvContent));
    link.setAttribute('download', fileName);
    link.click();
    isSnackbarOpen.value = true;
    feebackType.value = 'success';
    feebackContent.value = '成功下載檔案!';
  } catch (error) {
    isSnackbarOpen.value = true;
    feebackType.value = 'error';
    feebackContent.value = '處理失敗!';
  }
};
</script>
<style lang="scss">
@mixin infoText() {
  font-size: 12px;
  color: #999999;
}
.select-wrapper {
  margin: 24px 0;
  display: flex;
  align-items: center;
  .v-select {
    max-width: 400px;
    margin-right: 12px;
  }
}
.example-wrapper {
  margin: 24px;
  &-rule {
    margin-bottom: 8px;
    @include infoText();
  }
}
.template-wrapper {
  display: flex;
  flex-direction: column;
  &-row {
    margin: 12px 0;
    .v-btn.upload {
      user-select: none;
      .v-file-input {
        opacity: 0;
        width: 100%;
        position: absolute;
        cursor: pointer;
        overflow: hidden;
        .v-input__prepend {
          display: none;
        }
      }
    }
  }
  &-save {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    .v-text-field {
      margin-right: 8px;
    }
  }
}
.flex-area {
  display: flex;
  margin: 0 -12px;
  width: calc(100% - 24px);
  & > div {
    flex: 0 0 auto;
    margin: 0 12px;
  }
  .col-4 {
    width: 33.33%;
  }
  .col-8 {
    width: 66.66%;
  }
}
.textarea-wrapper {
  display: flex;
  flex-direction: column;
  & > .source-wrapper {
    flex: 1;
    width: 100%;
    & > .v-input {
      height: 100%;
      display: block;
      .v-input__control,
      textarea {
        height: 100%;
      }
    }
  }
  &-row {
    margin: 12px 0;
    .v-btn.upload {
      user-select: none;
      .v-file-input {
        opacity: 0;
        width: 100%;
        position: absolute;
        cursor: pointer;
        overflow: hidden;
        .v-input__prepend {
          display: none;
        }
      }
    }
  }
}
.row-wrapper {
  .button-area {
    margin-top: 12px;
  }
  .role-area {
    margin-top: 52px;
    height: 400px;
    border: 1px solid;
    border-color: rgba(0, 0, 0, 0.38);
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    &-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .v-expansion-panels {
      max-height: 336px;
      overflow: auto;
    }
    &-item {
      margin-bottom: 8px;
      &:last-of-type {
        margin-bottom: 0;
      }
      .v-expansion-panel:not(:first-child)::after {
        display: none;
      }
      .v-expansion-panel-title {
        min-height: 0 !important;
        max-height: 32px;
        background-color: #eaeaea;
      }
      .filter {
        & > div {
          margin: 8px 0;
          &:last-of-type {
            margin-bottom: 0;
          }
        }
        &-control {
          display: flex;
          align-items: center;
          justify-content: space-between;
          & > * {
            width: 33.33%;
            padding: 0 4px;
          }
        }
        &-number {
          display: flex;
          align-items: center;
          justify-content: space-between;
          & > * {
            width: 50%;
            padding: 0 4px;
          }
        }
        &-content {
          & > * {
            padding: 0 4px;
          }
        }
      }
    }
  }
}

.download-area {
  margin: 24px 0;
}

.easyCSV {
  .v-table {
    border: 1px solid #acacac;
    border-radius: 4px;
    background-color: unset;
    margin: 8px 0;
    th,
    td {
      vertical-align: middle;
    }
  }
}
</style>
