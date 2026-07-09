// 顶栏滚动阴影
const header = document.getElementById('site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// 留资表单:暂不接后端,提交后在页面内展示成功状态
const form = document.getElementById('lead-form');
const success = document.getElementById('form-success');
const errorTip = document.getElementById('form-error');
const fillAgain = document.getElementById('fill-again');

// 由 JS 接管校验;若 JS 未加载,浏览器原生 required/email 校验仍能兜底
form.noValidate = true;

const clearInvalidMarks = () => {
  form.querySelectorAll('[aria-invalid]').forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearInvalidMarks();

  if (!form.checkValidity()) {
    errorTip.hidden = false;
    const invalidFields = form.querySelectorAll(':invalid');
    invalidFields.forEach((el) => {
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', 'form-error');
    });
    invalidFields[0]?.focus();
    return;
  }

  errorTip.hidden = true;
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
