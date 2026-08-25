(async function () {
  'use strict';
  const backend = window.FUTMAC_SUPABASE;
  const form = document.querySelector('[data-password-reset-form]');
  const message = document.querySelector('[data-password-reset-message]');
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;

  const secureAuthContext = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!secureAuthContext) {
    message.textContent = 'Parola yenileme yalnızca güvenli HTTPS bağlantısında kullanılabilir.';
    return;
  }

  if (!backend || !backend.enabled) {
    message.textContent = 'Parola yenileme yalnızca Supabase bağlantısı açıkken kullanılabilir.';
    return;
  }

  try {
    const session = await backend.getSession();
    if (!session) {
      message.textContent = 'Bu parola yenileme bağlantısı geçersiz veya süresi dolmuş. Yönetici girişinden yeni bağlantı isteyin.';
      return;
    }
    submit.disabled = false;
    message.textContent = 'Bağlantı doğrulandı. Yeni parolanızı belirleyebilirsiniz.';
  } catch (error) {
    message.textContent = 'Bağlantı doğrulanamadı. Yönetici girişinden yeni parola bağlantısı isteyin.';
    return;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const password = form.elements.password.value;
    const confirmation = form.elements.passwordConfirm.value;
    if (password !== confirmation) {
      message.textContent = 'Parolalar birbiriyle eşleşmiyor.';
      form.elements.passwordConfirm.focus();
      return;
    }
    submit.disabled = true;
    message.textContent = 'Parola güncelleniyor…';
    try {
      await backend.updatePassword(password);
      form.reset();
      message.innerHTML = 'Parolanız güncellendi. <a href="admin.html">Yönetici paneline devam edin.</a>';
    } catch (error) {
      const detail = String(error && error.message || '');
      message.textContent = detail.toLowerCase().includes('password')
        ? 'Parola güvenlik koşullarını karşılamıyor. Daha güçlü bir parola deneyin.'
        : 'Bağlantı geçersiz veya süresi dolmuş. Yönetici girişinden yeni bağlantı isteyin.';
    } finally {
      submit.disabled = false;
    }
  });
}());
