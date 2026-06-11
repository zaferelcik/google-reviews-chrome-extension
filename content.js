(() => {
  if (window.__googleReviewsExporterLoaded) return;
  window.__googleReviewsExporterLoaded = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function cleanText(value) {
    return (value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function textOf(element) {
    return cleanText(element?.innerText || element?.textContent || "");
  }

  function parseRating(label) {
    if (!label) return "";
    const normalized = label.replace(",", ".");
    const match = normalized.match(/(\d+(?:\.\d+)?)/);
    return match ? match[1] : "";
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function getPlaceInfo() {
    const h1 = document.querySelector("h1.DUwDvf, h1[aria-level='1'], h1");
    const name = textOf(h1) || document.title.replace(/ - Google Maps.*$/i, "");
    return {
      name: cleanText(name),
      url: location.href
    };
  }

  function getTopLevelReviewCards() {
    const cards = Array.from(document.querySelectorAll("[data-review-id]"));
    return cards.filter((card) => card.closest("[data-review-id]") === card && isVisible(card));
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function findFirstText(card, selectors) {
    for (const selector of selectors) {
      const node = card.querySelector(selector);
      const text = textOf(node);
      if (text) return text;
    }
    return "";
  }

  function getReviewText(card) {
    const preferred = card.querySelector(".MyEned .wiI7pd, .MyEned span.wiI7pd, [data-expandable-section] .wiI7pd");
    if (textOf(preferred)) return textOf(preferred);

    const candidates = Array.from(card.querySelectorAll(".wiI7pd, span[class*='wiI7pd']"));
    for (const node of candidates) {
      if (node.closest(".CDe7pd")) continue;
      const text = textOf(node);
      if (text) return text;
    }
    return "";
  }

  function getOwnerAnswer(card) {
    return findFirstText(card, [
      ".CDe7pd .wiI7pd",
      ".CDe7pd span",
      "[class*='owner'] .wiI7pd",
      "[aria-label*='Response from the owner' i]"
    ]);
  }

  function getAuthorName(card) {
    return findFirstText(card, [
      ".d4r55",
      "button[aria-label][data-href*='/maps/contrib']",
      "a[href*='/maps/contrib']",
      "button[jsaction*='reviewerLink']"
    ]);
  }

  function getAuthorLink(card) {
    const link = card.querySelector("a[href*='/maps/contrib'], a[href*='contrib']");
    return link?.href || "";
  }

  function getRating(card) {
    const ratingNode = card.querySelector("span[role='img'][aria-label*='star' i], span[aria-label*='stars' i], span[aria-label*='yıldız' i], span[aria-label*='estrella' i], span[aria-label*='étoile' i], span[aria-label*='Stern' i], span.kvMYJc[aria-label]");
    const label = ratingNode?.getAttribute("aria-label") || "";
    return { rating: parseRating(label), rating_label: cleanText(label) };
  }

  function getReviewDate(card) {
    return findFirstText(card, [
      ".rsqaWe",
      "span.rsqaWe",
      "span[class*='rsqa']"
    ]);
  }

  function getLikes(card) {
    const buttons = Array.from(card.querySelectorAll("button[aria-label], button"));
    for (const button of buttons) {
      const label = `${button.getAttribute("aria-label") || ""} ${textOf(button)}`;
      if (/like|helpful|beğen|yararlı/i.test(label)) {
        const match = label.match(/\d+/);
        if (match) return match[0];
      }
    }
    return "";
  }

  function getImageUrls(card) {
    const urls = Array.from(card.querySelectorAll("img"))
      .filter((img) => {
        const rect = img.getBoundingClientRect();
        return rect.width >= 64 && rect.height >= 64;
      })
      .map((img) => img.currentSrc || img.src)
      .filter((src) => src && !src.startsWith("data:"));
    return unique(urls).join(" | ");
  }

  function extractReviews() {
    const place = getPlaceInfo();
    const cards = getTopLevelReviewCards();
    const rows = [];
    const seen = new Set();

    for (const card of cards) {
      const reviewId = card.getAttribute("data-review-id") || "";
      const authorName = getAuthorName(card);
      const authorLink = getAuthorLink(card);
      const ratingInfo = getRating(card);
      const reviewDate = getReviewDate(card);
      const reviewText = getReviewText(card);
      const ownerAnswer = getOwnerAnswer(card);
      const likes = getLikes(card);
      const imageUrls = getImageUrls(card);

      const dedupeKey = reviewId || [authorName, ratingInfo.rating, reviewDate, reviewText.slice(0, 80)].join("|");
      if (!dedupeKey.trim() || seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      rows.push({
        place_name: place.name,
        place_url: place.url,
        review_id: reviewId,
        author_name: authorName,
        author_link: authorLink,
        rating: ratingInfo.rating,
        rating_label: ratingInfo.rating_label,
        review_date: reviewDate,
        review_text: reviewText,
        owner_answer: ownerAnswer,
        likes,
        review_image_urls: imageUrls
      });
    }

    return { place, reviews: rows };
  }

  function getReviewDedupeKey(row) {
    return cleanText(
      row.review_id ||
      [row.author_name, row.author_link, row.rating, row.review_date, row.review_text.slice(0, 160)].join("|")
    );
  }

  function findScrollableReviewsContainer() {
    // Google Maps usually renders reviews inside a virtualized, scrollable feed.
    // Prefer that feed; otherwise pick the scrollable ancestor that contains the most reviews.
    const feed = document.querySelector("div[role='feed']");
    if (feed && feed.scrollHeight > feed.clientHeight + 80 && isVisible(feed)) return feed;

    const ariaReviewContainers = Array.from(document.querySelectorAll("div[aria-label*='review' i], div[aria-label*='yorum' i], div[aria-label*='reseña' i], div[aria-label*='avis' i]"))
      .filter((node) => node.scrollHeight > node.clientHeight + 80 && isVisible(node));
    if (ariaReviewContainers.length) {
      return ariaReviewContainers.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    }

    const reviewCards = getTopLevelReviewCards();
    const candidates = new Map();

    for (const card of reviewCards) {
      let node = card.parentElement;
      while (node && node !== document.body) {
        if (node.scrollHeight > node.clientHeight + 80) {
          candidates.set(node, (candidates.get(node) || 0) + 1);
        }
        node = node.parentElement;
      }
    }

    let best = null;
    let bestScore = -1;
    for (const [node, count] of candidates.entries()) {
      const score = count * 100000 + node.scrollHeight;
      if (score > bestScore && isVisible(node)) {
        best = node;
        bestScore = score;
      }
    }

    if (best) return best;

    const fallback = Array.from(document.querySelectorAll("div, main, section"))
      .filter((node) => node.scrollHeight > node.clientHeight + 300 && isVisible(node))
      .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];

    return fallback || document.scrollingElement || document.documentElement;
  }

  async function expandVisibleReviewText() {
    const moreText = /^(more|show more|read more|daha fazla|devamı|devamını oku|más|ver más|plus|en savoir plus|mehr|altro|mais|もっと)$/i;
    const buttons = Array.from(document.querySelectorAll("button"));
    let clicked = 0;

    for (const button of buttons) {
      if (!isVisible(button)) continue;
      const label = cleanText(`${button.innerText || ""} ${button.getAttribute("aria-label") || ""}`);
      const isReviewMoreButton = button.classList.contains("w8nwRe") || moreText.test(label);
      const looksLikeMenu = /options|menu|seçenek|menü/i.test(label);
      if (isReviewMoreButton && !looksLikeMenu) {
        button.click();
        clicked += 1;
        await sleep(30);
      }
    }

    if (clicked) await sleep(250);
    return clicked;
  }

  async function autoScrollAndExtract({ maxScrolls = 80, delayMs = 1200, expand = true } = {}) {
    const container = findScrollableReviewsContainer();
    const collected = new Map();
    let lastScrollTop = -1;
    let lastScrollHeight = -1;
    let lastCollectedCount = -1;
    let stableRounds = 0;
    let scrollsDone = 0;

    function collectCurrentReviews() {
      const current = extractReviews();
      for (const row of current.reviews) {
        const key = getReviewDedupeKey(row);
        if (key && !collected.has(key)) collected.set(key, row);
      }
      return current.place;
    }

    // Start from the top of the review feed so repeated runs are deterministic.
    try {
      container.scrollTop = 0;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
      await sleep(Math.max(350, Math.floor(delayMs / 2)));
    } catch (_) {}

    let place = collectCurrentReviews();

    for (let i = 0; i < maxScrolls; i += 1) {
      if (expand) await expandVisibleReviewText();
      place = collectCurrentReviews();

      const beforeTop = container.scrollTop;
      const beforeHeight = container.scrollHeight;
      const beforeCount = collected.size;

      const step = Math.max(Math.floor(container.clientHeight * 0.85), 700);
      container.scrollTop = beforeTop + step;
      container.dispatchEvent(new WheelEvent("wheel", { deltaY: step, bubbles: true, cancelable: true }));
      container.dispatchEvent(new Event("scroll", { bubbles: true }));

      scrollsDone += 1;
      await sleep(delayMs);

      if (expand) await expandVisibleReviewText();
      place = collectCurrentReviews();

      const afterTop = container.scrollTop;
      const afterHeight = container.scrollHeight;
      const afterCount = collected.size;
      const didMove = afterTop !== lastScrollTop || afterTop !== beforeTop || afterHeight !== beforeHeight;
      const didGrow = afterHeight !== lastScrollHeight || afterCount !== lastCollectedCount || afterCount !== beforeCount;

      if (!didMove && !didGrow) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
      }

      lastScrollTop = afterTop;
      lastScrollHeight = afterHeight;
      lastCollectedCount = afterCount;

      // Google Maps may pause lazy-loading for a moment. Give it a few chances before stopping.
      if (stableRounds >= 5) break;
    }

    if (expand) await expandVisibleReviewText();
    place = collectCurrentReviews();

    return {
      place,
      reviews: Array.from(collected.values()),
      scrolls_done: scrollsDone
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
      if (message?.type === "GRX_PING") return { ok: true };
      if (message?.type === "GRX_EXTRACT") {
        if (message.payload?.expand) await expandVisibleReviewText();
        return extractReviews();
      }
      if (message?.type === "GRX_SCROLL_EXTRACT") {
        return autoScrollAndExtract(message.payload || {});
      }
      return { error: "Unknown command" };
    })()
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message || String(error), reviews: [] }));
    return true;
  });
})();
