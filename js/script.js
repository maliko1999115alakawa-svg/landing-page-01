/**
 * LP のスクリプト
 *
 * 追加する挙動は3つだけ。
 *   1. SPのハンバーガーメニューの開閉
 *   2. 講師紹介カルーセルの送り
 *   3. FAQ（<details>）を一度にひとつだけ開く
 *
 * FAQ の開閉自体は <details> が担うので、JS が止まっても内容は読める。
 */
(function () {
    "use strict";

    /* ----------------------------------------------------------------------
       1. ハンバーガーメニュー
       ---------------------------------------------------------------------- */
    function initNavToggle() {
        var toggle = document.querySelector(".header__toggle");
        var nav = document.getElementById("global-nav");

        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener("click", function () {
            var isOpen = toggle.getAttribute("aria-expanded") === "true";

            toggle.setAttribute("aria-expanded", String(!isOpen));
            nav.setAttribute("data-open", String(!isOpen));
            toggle.querySelector(".visually-hidden").textContent = isOpen
                ? "メニューを開く"
                : "メニューを閉じる";
        });

        // メニュー内のリンクを踏んだら閉じる
        nav.addEventListener("click", function (event) {
            if (event.target.closest("a")) {
                toggle.setAttribute("aria-expanded", "false");
                nav.setAttribute("data-open", "false");
            }
        });
    }

    /* ----------------------------------------------------------------------
       2. 講師紹介カルーセル
       画面幅で見えている枚数が変わるので、1枚の幅から毎回計算する。
       ---------------------------------------------------------------------- */
    function initCarousel(root) {
        var track = root.querySelector("[data-carousel-track]");
        var prev = root.querySelector("[data-carousel-prev]");
        var next = root.querySelector("[data-carousel-next]");
        var items = track ? track.children : [];
        var spStart = parseInt(root.getAttribute("data-carousel-sp-start") || "0", 10);
        var index = 0;

        if (!track || items.length === 0) {
            return;
        }

        function visibleCount() {
            var trackWidth = track.getBoundingClientRect().width;
            var itemWidth = items[0].getBoundingClientRect().width;
            return Math.max(1, Math.round(trackWidth / itemWidth));
        }

        function maxIndex() {
            return Math.max(0, items.length - visibleCount());
        }

        function render() {
            var styles = window.getComputedStyle(track);
            var gap = parseFloat(styles.columnGap || styles.gap) || 0;
            var step = items[0].getBoundingClientRect().width + gap;

            index = Math.min(index, maxIndex());
            track.style.transform = "translateX(" + -step * index + "px)";

            if (prev) {
                prev.disabled = index === 0;
            }
            if (next) {
                next.disabled = index >= maxIndex();
            }
        }

        if (prev) {
            prev.addEventListener("click", function () {
                index = Math.max(0, index - 1);
                render();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                index = Math.min(maxIndex(), index + 1);
                render();
            });
        }

        window.addEventListener("resize", function () {
            /* SP(1枚表示)になったときだけ spStart を適用 */
            if (visibleCount() === 1) {
                index = spStart;
            } else {
                index = 0;
            }
            render();
        });

        /* 初期表示: 1枚表示なら spStart から */
        if (visibleCount() === 1) {
            index = spStart;
        }
        render();
    }

    /* ----------------------------------------------------------------------
       3. FAQ は同時にひとつだけ開く
       ---------------------------------------------------------------------- */
    function initFaq() {
        var items = document.querySelectorAll(".faq__item");

        Array.prototype.forEach.call(items, function (item) {
            item.addEventListener("toggle", function () {
                if (!item.open) {
                    return;
                }
                Array.prototype.forEach.call(items, function (other) {
                    if (other !== item) {
                        other.open = false;
                    }
                });
            });
        });
    }

    /* ----------------------------------------------------------------------
       4. 試験日程
       SPは直近の1件だけを開き、もう片方を開いたら前のものを閉じる。
       PCはカンプ同様2枚とも開いたままにしたいので、閉じられても開き直す。
       ---------------------------------------------------------------------- */
    function initSchedule() {
        var cards = document.querySelectorAll("[data-schedule-card]");
        var sp = window.matchMedia("(max-width: 767px)");

        if (cards.length === 0) {
            return;
        }

        function closeOthers(current) {
            Array.prototype.forEach.call(cards, function (other) {
                if (other !== current) {
                    other.open = false;
                }
            });
        }

        function sync() {
            if (!sp.matches) {
                Array.prototype.forEach.call(cards, function (card) {
                    card.open = true;
                });
                return;
            }
            // SPへ戻ったときは、開いているものの先頭だけを残す
            var opened = Array.prototype.filter.call(cards, function (card) {
                return card.open;
            });
            closeOthers(opened[0] || cards[0]);
            (opened[0] || cards[0]).open = true;
        }

        Array.prototype.forEach.call(cards, function (card) {
            card.addEventListener("toggle", function () {
                if (!sp.matches) {
                    // PCでは閉じさせない
                    card.open = true;
                    return;
                }
                if (card.open) {
                    closeOthers(card);
                }
            });
        });

        sp.addEventListener("change", sync);
        sync();
    }

    document.addEventListener("DOMContentLoaded", function () {
        initNavToggle();
        initFaq();
        initSchedule();
        Array.prototype.forEach.call(
            document.querySelectorAll("[data-carousel]"),
            initCarousel
        );
    });
})();
