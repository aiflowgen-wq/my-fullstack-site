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

const MSG_INVALID = '请填写姓名和有效的邮箱地址。';
const MSG_FAILED = '提交失败,请检查网络后重试。';

// 由 JS 接管校验;若 JS 未加载,浏览器原生 required/email 校验仍能兜底
form.noValidate = true;

const clearInvalidMarks = () => {
  form.querySelectorAll('[aria-invalid]').forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });
};

const showError = (message) => {
  errorTip.textContent = message;
  errorTip.hidden = false;
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearInvalidMarks();
  errorTip.hidden = true;

  if (!form.checkValidity()) {
    showError(MSG_INVALID);
    const invalidFields = form.querySelectorAll(':invalid');
    invalidFields.forEach((el) => {
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', 'form-error');
    });
    invalidFields[0]?.focus();
    return;
  }

  if (!supabase) {
    showError(MSG_FAILED);
    return;
  }

  const data = new FormData(form);
  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = '提交中…';

  const { error } = await supabase.from('leads').insert({
    name: String(data.get('name')).trim(),
    email: String(data.get('email')).trim(),
    role: String(data.get('role') || '').trim() || null,
    message: String(data.get('message') || '').trim() || null,
  });

  submitBtn.disabled = false;
  submitBtn.textContent = originalLabel;

  if (error) {
    showError(MSG_FAILED);
    return;
  }

  form.hidden = true;
  success.hidden = false;
  success.focus();
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
