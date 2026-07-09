import { supabase } from './supabase.js';

// 顶栏滚动阴影
const header = document.getElementById('site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// 留资表单:提交写入 Supabase leads 表
const form = document.getElementById('lead-form');
const success = document.getElementById('form-success');
const errorTip = document.getElementById('form-error');
const fillAgain = document.getElementById('fill-again');
const submitBtn = form.querySelector('button[type="submit"]');
const submitStatus = document.getElementById('submit-status');

const MSG_INVALID = '请填写姓名和有效的邮箱地址。';
const MSG_FAILED = '提交失败,请检查网络后重试。';
const MSG_TOO_LONG = '内容过长,请精简后重试。';
const MSG_BAD_EMAIL = '邮箱格式不正确,请检查后重试。';

// 由 JS 接管校验;若 JS 未加载,浏览器原生 required/email 校验仍能兜底
form.noValidate = true;

let submitting = false;

const clearInvalidMarks = () => {
  form.querySelectorAll('[aria-invalid]').forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });
};

const markInvalid = (el) => {
  el.setAttribute('aria-invalid', 'true');
  el.setAttribute('aria-describedby', 'form-error');
};

const showError = (message) => {
  errorTip.textContent = message;
  errorTip.hidden = false;
};

const showSuccess = () => {
  form.hidden = true;
  success.hidden = false;
  success.focus();
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitting) return;

  clearInvalidMarks();
  errorTip.hidden = true;

  if (!form.checkValidity()) {
    showError(MSG_INVALID);
    const invalidFields = form.querySelectorAll(':invalid');
    invalidFields.forEach(markInvalid);
    invalidFields[0]?.focus();
    return;
  }

  const data = new FormData(form);
  const name = String(data.get('name')).trim();
  const email = String(data.get('email')).trim();

  // 纯空格能通过 required 校验,trim 后需再确认非空
  if (!name || !email) {
    showError(MSG_INVALID);
    const field = document.getElementById(!name ? 'name' : 'email');
    markInvalid(field);
    field.focus();
    return;
  }

  // 蜜罐字段有值 → 机器人,静默按成功处理,不写库
  if (String(data.get('hp_field') || '').trim()) {
    showSuccess();
    return;
  }

  if (!supabase) {
    showError(MSG_FAILED);
    return;
  }

  // 用 in-flight 标志 + aria-disabled 防连点,保住按钮焦点不丢
  submitting = true;
  submitBtn.setAttribute('aria-disabled', 'true');
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = '提交中…';
  submitStatus.textContent = '正在提交,请稍候';

  const { error } = await supabase
    .from('leads')
    .insert({
      name,
      email,
      role: String(data.get('role') || '').trim() || null,
      message: String(data.get('message') || '').trim() || null,
    })
    .abortSignal(AbortSignal.timeout(15000));

  submitting = false;
  submitBtn.removeAttribute('aria-disabled');
  submitBtn.textContent = originalLabel;
  submitStatus.textContent = '';

  if (error) {
    // 按约束区分提示:邮箱格式 / 内容过长(23514=check 约束,22001=超列宽)/ 其余按网络类处理
    let msg = MSG_FAILED;
    if (/leads_email_format/.test(error.message || '')) {
      msg = MSG_BAD_EMAIL;
    } else if (error.code === '23514' || error.code === '22001') {
      msg = MSG_TOO_LONG;
    }
    showError(msg);
    if (document.activeElement === document.body) submitBtn.focus();
    return;
  }

  showSuccess();
});

fillAgain.addEventListener('click', () => {
  form.reset();
  clearInvalidMarks();
  errorTip.hidden = true;
  form.hidden = false;
  success.hidden = true;
  document.getElementById('name').focus();
});

// 页脚年份
document.getElementById('year').textContent = new Date().getFullYear();
