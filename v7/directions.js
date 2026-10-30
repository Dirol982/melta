// Кнопки «Запросить прайс» в блоках направлений выбирают направление в форме заявки
document.querySelectorAll('[data-direction]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const select = document.querySelector('#price-form select[name="goal"]');
    if (select) select.value = btn.dataset.direction;
  });
});

// Переход со страницы товара: index.html?goal=Косметика#price
const goal = new URLSearchParams(location.search).get('goal');
const goalSelect = document.querySelector('#price-form select[name="goal"]');
if (goal && goalSelect) goalSelect.value = goal;
