// Mobile menu
const burger = document.querySelector('.burger');
const nav = document.getElementById('nav');

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});

nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

// Price request: the site is static, so the form opens the visitor's mail client
// with a ready letter to the sales department.
const form = document.getElementById('price-form');
const msg = form.querySelector('.form__msg');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = (data.get('name') || '').trim();
  const phone = (data.get('phone') || '').trim();

  if (!name || !phone) {
    msg.textContent = 'Укажите имя и телефон.';
    msg.className = 'form__msg form__full is-error';
    return;
  }
  if (!data.get('agree')) {
    msg.textContent = 'Нужно согласие на обработку персональных данных.';
    msg.className = 'form__msg form__full is-error';
    return;
  }

  const body = [
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `E-mail: ${data.get('email') || '—'}`,
    `Цель запроса: ${data.get('goal')}`,
  ].join('\n');

  window.location.href =
    'mailto:sales@agnex.by?subject=' + encodeURIComponent('Запрос прайса с сайта melta.by') +
    '&body=' + encodeURIComponent(body);

  msg.textContent = 'Открываем почтовую программу с готовым письмом…';
  msg.className = 'form__msg form__full is-ok';
});
