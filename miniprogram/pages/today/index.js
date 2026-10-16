const environment = require('../../config/environment.local');
const journal = require('../../modules/journal/service');
const { createJournalController } = require('../../modules/journal/controller');
const { createMemoryJournalService } = require('../../modules/journal/demo-service');
// 回顾刷新事件（W1 Z05）：保存/编辑/删除成功后同步回顾演示数据源并发布失效事件。
// 真实架构中该同步由服务端数据与接口约定完成，演示仅连接本地内存数据源。
const { reviewStore } = require('../../modules/review/demo-store');
const { SEED_ENTRIES } = require('../../modules/review/demo-data');
const ICONS = { SUNNY: '☀', PARTLY_CLOUDY: '⛅', CLOUDY: '☁', RAINY: '☂', STORMY: '⛈' };

Page({
  data: { weatherOptions: [], tagOptions: [], phase: 'loading', recordStatus: '正在读取' },
  onLoad() {
    const isDemo = environment.journalDemo === true && environment.cloudEnabled === false;
    this._demo = isDemo ? createMemoryJournalService({ seedEntries: SEED_ENTRIES }) : null;
    this._journal = createJournalController({
      service: this._demo || journal,
      isDemo,
      onChanged: (info) => this._onJournalChanged(info),
      onChange: (state) =>
        this.setData({
          ...state,
          weatherOptions: state.weatherOptions.map((item) => ({ ...item, icon: ICONS[item.code] })),
        }),
    });
    this._journal.loadDate();
  },
  onShow() {
    if (this._journal) {
      this._journal.refreshToday();
    }
  },
  onUnload() {
    if (this._journal) {
      this._journal.dispose();
    }
    if (this._demo) {
      this._demo.clear();
    }
  },
  onWeather(event) {
    this._journal.chooseWeather(event.currentTarget.dataset.code);
  },
  onTag(event) {
    this._journal.toggleTag(event.currentTarget.dataset.id);
  },
  onText(event) {
    this._journal.setText(event.detail.value);
  },
  onDate(event) {
    return this._journal.loadDate(event.detail.value);
  },
  onPreviousDate() {
    return this._journal.moveDate(-1);
  },
  onNextDate() {
    return this._journal.moveDate(1);
  },
  onToday() {
    return this._journal.moveDate('today');
  },
  onSave() {
    return this._journal.save();
  },
  onRetry() {
    return this._journal.retry();
  },
  onReload() {
    return this._journal.loadDate();
  },
  onDelete() {
    this._journal.requestDelete();
  },
  onConfirmDelete() {
    return this._journal.confirmDelete();
  },
  onConfirmReload() {
    return this._journal.confirmReload();
  },
  onCancel() {
    this._journal.cancelConfirm();
  },
  onDemoFailure() {
    if (this._demo && this._journal.getState().canSave) {
      this._demo.failNext('after-save');
      return this._journal.save();
    }
  },
  // W1 Z05：kind 为 'saved' / 'deleted'。读取该日最新记录同步到回顾演示数据源，
  // 由 reviewStore 发布失效事件，月历、月份档案与卡片页面订阅后重新渲染。
  _onJournalChanged(info) {
    if (!this._demo || !info || typeof info.date !== 'string') {
      return;
    }
    this._demo
      .get(info.date)
      .then((result) => {
        const entry = result && result.ok === true && result.data ? result.data.entry : null;
        reviewStore.applyChange({ date: info.date, kind: info.kind, entry });
      })
      .catch(() => {});
  },
});
