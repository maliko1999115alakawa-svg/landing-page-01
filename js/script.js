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
        var viewport = track ? track.parentNode : null;
        var prev = root.querySelector("[data-carousel-prev]");
        var next = root.querySelector("[data-carousel-next]");
        var spStart = parseInt(root.getAttribute("data-carousel-sp-start") || "0", 10);

        if (!track || track.children.length === 0) {
            return;
        }

        var originals = Array.prototype.slice.call(track.children);
        var count = originals.length;

        /* 前後に同じ並びを複製して置く。複製は読み上げ対象から外す */
        var head = document.createDocumentFragment();
        var tail = document.createDocumentFragment();

        originals.forEach(function (item) {
            var before = item.cloneNode(true);
            var after = item.cloneNode(true);

            before.setAttribute("aria-hidden", "true");
            after.setAttribute("aria-hidden", "true");
            head.appendChild(before);
            tail.appendChild(after);
        });
        track.insertBefore(head, track.firstChild);
        track.appendChild(tail);

        /* 前に count 枚足したので、本来の1枚目は count 番目にある */
        var index = count;

        function visibleCount() {
            var itemWidth = originals[0].getBoundingClientRect().width;

            if (!itemWidth) {
                return 1;
            }
            return Math.max(1, Math.round(viewport.getBoundingClientRect().width / itemWidth));
        }

        /* 全部見えているときは動かす意味がないので止めておく */
        function canScroll() {
            return visibleCount() < count;
        }

        function stepSize() {
            var styles = window.getComputedStyle(track);
            var gap = parseFloat(styles.columnGap || styles.gap) || 0;

            return originals[0].getBoundingClientRect().width + gap;
        }

        function place() {
            track.style.transform = "translateX(" + -stepSize() * index + "px)";
        }

        function render() {
            place();

            if (prev) {
                prev.disabled = !canScroll();
            }
            if (next) {
                next.disabled = !canScroll();
            }
        }

        /* transition なしで、見た目の同じ位置へ黙って移す */
        function jumpTo(next) {
            index = next;
            track.style.transition = "none";
            place();
            void track.offsetWidth; /* 位置を確定させてから戻す */
            track.style.transition = "";
        }

        function move(dir) {
            if (!canScroll()) {
                return;
            }

            /* 前回の移動で複製の側に来ていたら、動かす前に本体側へ戻しておく。
               複製と本体は見た目が同じなので、画面上は何も起きない。
               これで端に達しても巻き戻らず、そのまま回り続ける */
            if (index >= count * 2) {
                jumpTo(index - count);
            } else if (index < count) {
                jumpTo(index + count);
            }

            index += dir;
            render();
        }

        if (prev) {
            prev.addEventListener("click", function () {
                move(-1);
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                move(1);
            });
        }

        /* --- 指での横スワイプ（スマホ・タブレット） --------------------
           縦スクロールを邪魔しないよう、横の動きが縦より大きいときだけ拾う */
        var startX = 0;
        var startY = 0;
        var swiping = false;
        var SWIPE_MIN = 40;

        track.addEventListener("touchstart", function (event) {
            if (event.touches.length !== 1) {
                return;
            }
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
            swiping = true;
        }, { passive: true });

        track.addEventListener("touchmove", function (event) {
            if (!swiping) {
                return;
            }

            var dx = event.touches[0].clientX - startX;
            var dy = event.touches[0].clientY - startY;

            /* 縦に動かしているならページのスクロールに任せる */
            if (Math.abs(dy) > Math.abs(dx)) {
                swiping = false;
            }
        }, { passive: true });

        track.addEventListener("touchend", function (event) {
            if (!swiping) {
                return;
            }
            swiping = false;

            var dx = event.changedTouches[0].clientX - startX;

            /* 小さな動きはタップとみなして無視する */
            if (Math.abs(dx) < SWIPE_MIN) {
                return;
            }
            move(dx < 0 ? 1 : -1);
        });

        function reset() {
            index = count + (visibleCount() === 1 ? spStart : 0);
            track.style.transition = "none";
            render();
            void track.offsetWidth;
            track.style.transition = "";
        }

        window.addEventListener("resize", reset);
        reset();
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
