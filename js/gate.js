/*
 * 簡易パスワードゲート
 * ------------------------------------------------------------------
 * ページを開いた人にパスワードを求める。ブラウザ内だけで判定している
 * ので、あくまで「関係者以外がうっかり見てしまうのを防ぐ」目隠し。
 * 本気で隠したい情報を置く用途には使えない。
 *
 * パスワードを変えたいときは、下の PASSWORD の文字列だけ書き換える。
 */
(function () {
  var PASSWORD = 'ct-lp-2026';
  var STORAGE_KEY = 'lp-gate-unlocked';

  // 一度入力したらタブを閉じるまでは再入力させない
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
  } catch (e) {
    // プライベートブラウジング等で sessionStorage が使えない場合は毎回聞く
  }

  // CSS でページ本体を隠す。JS が動く前に付けたいので即座に実行する
  document.documentElement.classList.add('is-locked');

  function unlock() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {}
    document.documentElement.classList.remove('is-locked');
    var gate = document.getElementById('gate');
    if (gate) gate.remove();
  }

  function buildGate() {
    var gate = document.createElement('div');
    gate.id = 'gate';
    gate.innerHTML =
      '<form class="gate__box" novalidate>' +
      '  <p class="gate__title">このページは限定公開です</p>' +
      '  <p class="gate__lead">パスワードを入力してください。</p>' +
      '  <input class="gate__input" type="password" autocomplete="current-password"' +
      '         aria-label="パスワード" placeholder="パスワード">' +
      '  <p class="gate__error" role="alert" hidden>パスワードが違います。</p>' +
      '  <button class="gate__button" type="submit">表示する</button>' +
      '</form>';

    var form = gate.querySelector('form');
    var input = gate.querySelector('.gate__input');
    var error = gate.querySelector('.gate__error');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (input.value === PASSWORD) {
        unlock();
      } else {
        error.hidden = false;
        input.value = '';
        input.focus();
      }
    });

    input.addEventListener('input', function () {
      error.hidden = true;
    });

    document.body.appendChild(gate);
    input.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildGate);
  } else {
    buildGate();
  }
})();
