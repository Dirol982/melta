// Всплывающая форма заявки: открывается со всех кнопок прайса (ссылки на #price) на любой странице варианта 7.
// Направление берётся из data-direction или ?goal= в ссылке, товар — из data-product.
(() => {
  const GOALS = ['Мыльные основы', 'Бытовая химия', 'Косметика', 'Косметика для животных', 'Мыло ручной работы',
    'Контрактное производство', 'Сотрудничество (экспорт)', 'Пожелания и предложения'];

  const dlg = document.createElement('dialog');
  dlg.className = 'modal';
  dlg.setAttribute('aria-labelledby', 'modal-title');
  dlg.innerHTML = `
    <button class="modal__close" type="button" aria-label="Закрыть">×</button>
    <span class="hand modal__hand">ответим в рабочее время</span>
    <h2 class="modal__title" id="modal-title">Запросить прайс</h2>
    <p class="modal__lead">Оставьте контакты — менеджер пришлёт прайс и&nbsp;условия. Пн–пт&nbsp;8:30–17:00.</p>
    <p class="modal__product" hidden></p>
    <form class="form modal__form" novalidate>
      <label>Имя<input name="name" type="text" autocomplete="name" required></label>
      <label>Телефон<input name="phone" type="tel" autocomplete="tel" placeholder="+375 …" required></label>
      <label class="form__full">Электронная почта<input name="email" type="email" autocomplete="email"></label>
      <label class="form__full">Направление
        <select name="goal">${GOALS.map((g) => `<option>${g}</option>`).join('')}</select>
      </label>
      <label class="form__full">Комментарий<textarea name="comment" rows="3" placeholder="Объёмы, регион поставки, вопросы"></textarea></label>
      <label class="check form__full"><input name="agree" type="checkbox" required> Даю согласие на обработку персональных данных</label>
      <button class="btn btn--orange form__full" type="submit">Отправить заявку</button>
      <p class="form__msg form__full" role="status" aria-live="polite"></p>
    </form>
    <p class="modal__contacts"><a href="tel:+375291041703">+375 (29) 104-17-03</a> · <a href="mailto:sales@agnex.by">sales@agnex.by</a></p>`;
  document.body.appendChild(dlg);

  const form = dlg.querySelector('form');
  const msg = dlg.querySelector('.form__msg');
  const productLine = dlg.querySelector('.modal__product');
  let product = '';

  function open(trigger) {
    const href = trigger.getAttribute('href') || '';
    const goal = trigger.dataset.direction || new URL(href, location.href).searchParams.get('goal');
    if (goal && GOALS.includes(goal)) form.goal.value = goal;
    product = trigger.dataset.product || '';
    productLine.hidden = !product;
    productLine.textContent = product ? `Товар: ${product}` : '';
    msg.textContent = '';
    msg.className = 'form__msg form__full';
    dlg.showModal();
    document.documentElement.classList.add('modal-open');
    form.name.focus();
  }

  dlg.addEventListener('close', () => document.documentElement.classList.remove('modal-open'));
  dlg.querySelector('.modal__close').addEventListener('click', () => dlg.close());
  // клик по затемнению вокруг окна закрывает его
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href$="#price"], [data-popup="price"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    open(a);
  });

  // сайт статический: форма открывает почтовую программу с готовым письмом в отдел продаж
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
      `Направление: ${data.get('goal')}`,
      product ? `Товар: ${product}` : '',
      data.get('comment') ? `Комментарий: ${data.get('comment')}` : '',
    ].filter(Boolean).join('\n');
    window.location.href = 'mailto:sales@agnex.by?subject=' + encodeURIComponent('Запрос прайса с сайта melta.by')
      + '&body=' + encodeURIComponent(body);
    msg.textContent = 'Открываем почтовую программу с готовым письмом…';
    msg.className = 'form__msg form__full is-ok';
  });
})();
