(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const soundToggle = $("#mute-toggle");
  const diyaButton = $("#diya-button");
  const diyaInstruction = $("#diya-instruction");
  const shareStatus = $("#share-status");
  const toast = $("#toast");
  const nameForm = $("#name-form");
  const nameInput = $("#guest-name");
  const envelopeStage = $("#envelope-stage");
  const personalMessage = $("#personal-message");
  const personalHint = $("#personal-hint");
  const anarSection = $("#grand-finale");
  const anarStatus = $("#anar-status");
  let personalFireworks;
  let envelopeTimer;
  let wishFireworkTimers = [];
  let wishFireworkLoopTimer;
  let wishFireworkFollowupTimer;
  let wishFireworksVisible = true;

  let audioContext;
  let masterGain;
  let muted = true;
  let anarFireworks;
  let toastTimer;
  let audioReady = false;

  function initializeAudio() {
    if (audioReady) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = muted ? 0 : 0.18;
    masterGain.connect(audioContext.destination);
    audioReady = true;
  }

  async function resumeAudio() {
    initializeAudio();
    if (audioContext?.state === "suspended") await audioContext.resume();
  }

  function playNote(frequency, start, duration, volume = 0.18, type = "sine") {
    if (!audioContext || !masterGain || muted) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  async function playLightingSound() {
    await resumeAudio();
    if (!muted && audioContext) {
      const now = audioContext.currentTime;
      playNote(880, now, 0.42, 0.13, "sine");
      playNote(1320, now + 0.035, 0.53, 0.075, "sine");
    }
  }

  function updateSoundButton() {
    const icon = $("i", soundToggle);
    const label = $(".sound-label", soundToggle);
    soundToggle.setAttribute("aria-pressed", String(!muted));
    soundToggle.setAttribute("aria-label", muted ? "Unmute sounds" : "Mute sounds");
    icon.className = muted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
    label.textContent = muted ? "Sound off" : "Sound on";
  }

  soundToggle.addEventListener("click", async () => {
    muted = !muted;
    await resumeAudio();
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(audioContext.currentTime);
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.18, audioContext.currentTime, 0.04);
    }
    updateSoundButton();
  });

  async function lightDiya() {
    const isLit = !diyaButton.classList.contains("is-lit");
    diyaButton.classList.toggle("is-lit", isLit);
    $(".hero-diya").classList.toggle("is-lit", isLit);
    diyaButton.setAttribute("aria-pressed", String(isLit));
    diyaButton.setAttribute("aria-label", isLit ? "Extinguish the diya" : "Light the diya");
    diyaInstruction.textContent = isLit ? "May this little light stay with you." : "A little tap can light up everything.";
    if (isLit) {
      await playLightingSound();
      burstConfetti(diyaButton);
      launchAtViewportPoint(window.innerWidth * 0.5, window.innerHeight * 0.4, 22);
    }
  }

  diyaButton.addEventListener("click", lightDiya);
  $("#hero-light-button").addEventListener("click", () => {
    if (!diyaButton.classList.contains("is-lit")) lightDiya();
    $("#celebrate").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function scheduleWishFireworks() {
    if (
      reducedMotion
      || !wishFireworksVisible
      || document.hidden
      || !envelopeStage.classList.contains("is-revealed")
      || wishFireworkLoopTimer
    ) return;

    wishFireworkLoopTimer = window.setTimeout(() => {
      wishFireworkLoopTimer = null;
      const canvas = $("#wish-canvas");
      const launch = () => {
        const x = canvas.clientWidth * (0.12 + Math.random() * 0.76);
        const y = canvas.clientHeight * (0.12 + Math.random() * 0.3);
        personalFireworks.launch(x, y, window.innerWidth < 600 ? 0.85 : 1.05);
      };
      launch();
      if (Math.random() > 0.35) {
        wishFireworkFollowupTimer = window.setTimeout(launch, 170 + Math.random() * 230);
      }
      scheduleWishFireworks();
    }, 950 + Math.random() * 450);
  }

  function getPersonalWishLink() {
    const url = new URL(window.location.href);
    url.searchParams.delete("name");
    url.hash = "your-wish";
    return url.href;
  }

  function isLocalPreview() {
    return window.location.protocol === "file:"
      || window.location.hostname === "localhost"
      || window.location.hostname === "127.0.0.1";
  }

  async function copyWishLink() {
    const link = getPersonalWishLink();
    try {
      await navigator.clipboard.writeText(link);
    } catch (error) {
      const field = document.createElement("textarea");
      field.value = link;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) {
        shareStatus.textContent = "Could not copy the link. Copy it from your browser address bar instead.";
        showToast("Could not copy link. Try again on the hosted website.");
        return;
      }
    }
    const message = isLocalPreview()
      ? "Local preview link copied. Deploy the site before sharing it with others."
      : nameInput.value.trim()
        ? "Your personal Diwali wish link is copied."
        : "Diwali greeting link copied.";
    shareStatus.textContent = message;
    showToast(message);
  }

  nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));
  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.normalize("NFC").trim().replace(/\s+/gu, " ");
    if (!name) {
      nameInput.setCustomValidity("Please enter your name to open the wish.");
      nameInput.reportValidity();
      return;
    }

    nameInput.value = name;
    $("#personal-salutation").textContent = `Dear ${name} and family,`;
    personalMessage.hidden = true;
    personalMessage.classList.remove("is-visible");
    envelopeStage.classList.remove("is-opening", "is-revealed");
    window.clearTimeout(envelopeTimer);
    wishFireworkTimers.forEach(window.clearTimeout);
    wishFireworkTimers = [];
    window.clearTimeout(wishFireworkLoopTimer);
    wishFireworkLoopTimer = null;
    window.clearTimeout(wishFireworkFollowupTimer);
    personalHint.textContent = "Opening your family’s Diwali envelope…";
    void envelopeStage.offsetWidth;
    requestAnimationFrame(() => envelopeStage.classList.add("is-opening"));

    const canvas = $("#wish-canvas");
    if (personalFireworks) {
      [0.2, 0.42, 0.64, 0.82].forEach((position, index) => {
        wishFireworkTimers.push(window.setTimeout(() => {
          personalFireworks.launch(canvas.clientWidth * position, canvas.clientHeight * (0.17 + (index % 2) * 0.12), window.innerWidth < 600 ? 0.8 : 1);
        }, index * 330));
      });
    }

    envelopeTimer = window.setTimeout(() => {
      personalMessage.hidden = false;
      envelopeStage.classList.add("is-revealed");
      requestAnimationFrame(() => personalMessage.classList.add("is-visible"));
      personalHint.textContent = `${name}, your family’s Diwali wish is here.`;
      scheduleWishFireworks();
    }, reducedMotion ? 0 : 680);
  });

  const wishText = "Happy Diwali 2026! May your world glow a little brighter. A special wish from Mehul Sharma.";
  $("#copy-wish-link").addEventListener("click", copyWishLink);
  $("#personal-whatsapp").addEventListener("click", (event) => {
    if (isLocalPreview()) {
      event.preventDefault();
      showToast("Deploy the site first to share a public wish link.");
      return;
    }
    const name = nameInput.value.trim();
    const greeting = name
      ? `Happy Diwali 2026, ${name} and family! Wishing you love, laughter, good health and prosperity.`
      : wishText;
    event.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(`${greeting} ${getPersonalWishLink()}`)}`;
  });
  $("#anar-button").addEventListener("click", () => launchAnar());

  $("#copy-link-button").addEventListener("click", async () => {
    await copyWishLink();
  });

  $("#share-button").addEventListener("click", async () => {
    if (isLocalPreview()) {
      showToast("Deploy the site first to share a public wish link.");
      return;
    }
    const name = nameInput.value.trim();
    const data = {
      title: "Happy Diwali 2026 — A Special Wish From Mehul Sharma",
      text: name ? `Happy Diwali 2026, ${name} and family! Wishing you love, laughter and prosperity.` : wishText,
      url: getPersonalWishLink(),
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        shareStatus.textContent = "Your Diwali wish was shared.";
      } catch (error) {
        if (error.name !== "AbortError") {
          shareStatus.textContent = "Sharing is unavailable. Try copying the website link.";
          showToast("Sharing unavailable. Try Copy link instead.");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        shareStatus.textContent = "Your greeting was copied and is ready to share.";
        showToast("Your greeting is copied and ready to share.");
      } catch (error) {
        shareStatus.textContent = "Sharing is unavailable. Try copying the website link.";
        showToast("Sharing unavailable. Try Copy link instead.");
      }
    }
  });

  $("#whatsapp-share").addEventListener("click", (event) => {
    if (isLocalPreview()) {
      event.preventDefault();
      showToast("Deploy the site first to share a public wish link.");
      return;
    }
    const name = nameInput.value.trim();
    const greeting = name
      ? `Happy Diwali 2026, ${name} and family! Wishing you love, laughter and prosperity.`
      : wishText;
    const message = `${greeting} ${getPersonalWishLink()}`;
    event.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  });

  function burstConfetti(element) {
    const rect = element.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const colors = ["#ffd700", "#ff8c00", "#f7e6bd", "#ff825a"];
    for (let i = 0; i < (reducedMotion ? 6 : 16); i += 1) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * i) / 16;
      const distance = 25 + Math.random() * 65;
      particle.className = "confetti";
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.background = colors[i % colors.length];
      document.body.append(particle);
      if (particle.animate && !reducedMotion) {
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        particle.animate([{ transform: "translate(-50%, -50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0)`, opacity: 0 }], { duration: 850, easing: "cubic-bezier(.15,.7,.25,1)" }).onfinish = () => particle.remove();
      } else {
        particle.remove();
      }
    }
  }

  const colorSets = [
    ["#ffd700", "#fff3c4", "#ff8c00"],
    ["#ff6892", "#ffd3df", "#ffb43c"],
    ["#6de3e1", "#c5fffa", "#82aaff"],
    ["#c59aff", "#ffc9ed", "#ffd36d"],
  ];

  function createFireworks(canvas, launchOnClick) {
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return { launch: () => {} };
    const state = { width: 0, height: 0, pixelRatio: 1, particles: [], rockets: [], frame: 0, autoTimer: null };
    const particleLimit = window.innerWidth < 600 ? 170 : 340;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      state.width = rect.width;
      state.height = rect.height;
      state.pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 600 ? 1.25 : 1.6);
      canvas.width = Math.round(rect.width * state.pixelRatio);
      canvas.height = Math.round(rect.height * state.pixelRatio);
      context.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
    }

    function launch(x, y, power = 1) {
      if (state.rockets.length > 4) state.rockets.shift();
      const startX = x ?? state.width * (0.18 + Math.random() * 0.64);
      const targetY = y ?? state.height * (0.2 + Math.random() * 0.39);
      state.rockets.push({
        x: startX,
        y: state.height + 4,
        targetX: startX + (Math.random() - 0.5) * 55,
        targetY,
        speed: Math.max(3, Math.min(7, state.height * 0.012)) * power,
        hue: colorSets[Math.floor(Math.random() * colorSets.length)],
      });
    }

    function explode(rocket) {
      const count = Math.min(window.innerWidth < 600 ? 52 : 88, particleLimit - state.particles.length);
      if (count < 1) return;
      const offset = Math.random() * Math.PI * 2;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + offset;
        const speed = (i % 5 === 0 ? 2.4 + Math.random() * 2 : 0.7 + Math.random() * 3.1)
          * (window.innerWidth < 600 ? 0.84 : 1);
        state.particles.push({
          x: rocket.x, y: rocket.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          alpha: 1, decay: 0.009 + Math.random() * 0.014, size: 1 + Math.random() * 1.5,
          color: rocket.hue[Math.floor(Math.random() * rocket.hue.length)],
        });
      }
    }

    function animate() {
      state.frame = 0;
      if (!canvas.isConnected || document.hidden) return;
      context.clearRect(0, 0, state.width, state.height);

      for (let i = state.rockets.length - 1; i >= 0; i -= 1) {
        const rocket = state.rockets[i];
        const dx = rocket.targetX - rocket.x;
        const dy = rocket.targetY - rocket.y;
        const distance = Math.hypot(dx, dy);
        if (distance < rocket.speed) {
          explode(rocket);
          state.rockets.splice(i, 1);
        } else {
          rocket.x += (dx / distance) * rocket.speed;
          rocket.y += (dy / distance) * rocket.speed;
          context.beginPath();
          context.arc(rocket.x, rocket.y, 1.6, 0, Math.PI * 2);
          context.fillStyle = "#fff3c4";
          context.fill();
        }
      }

      for (let i = state.particles.length - 1; i >= 0; i -= 1) {
        const particle = state.particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.027;
        particle.vx *= 0.985;
        particle.alpha -= particle.decay;
        if (particle.alpha <= 0) { state.particles.splice(i, 1); continue; }
        context.globalAlpha = particle.alpha;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      if (state.rockets.length > 0 || state.particles.length > 0) state.frame = requestAnimationFrame(animate);
    }

    function scheduleAutoLaunch() {
      if (canvas.id !== "hero-canvas" || reducedMotion || document.hidden || state.autoTimer) return;
      const delay = window.innerWidth < 600 ? 4800 + Math.random() * 1800 : 3200 + Math.random() * 1800;
      state.autoTimer = window.setTimeout(() => {
        state.autoTimer = null;
        launch();
        startAnimation();
      }, delay);
    }

    function startAnimation() {
      if (!state.frame && (state.rockets.length > 0 || state.particles.length > 0)) {
        state.frame = requestAnimationFrame(animate);
      }
      scheduleAutoLaunch();
    }

    const launchAt = (x, y, power) => {
      launch(x, y, power);
      startAnimation();
    };

    canvas.addEventListener("visibilityresume", startAnimation);
    canvas.addEventListener("visibilitypause", () => {
      window.clearTimeout(state.autoTimer);
      state.autoTimer = null;
    });
    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize, { passive: true });
    if (launchOnClick) {
      canvas.addEventListener("pointerdown", (event) => {
        const rect = canvas.getBoundingClientRect();
        launchAt(event.clientX - rect.left, event.clientY - rect.top, 1.1);
      }, { passive: true });
    }
    if (canvas.id === "hero-canvas" && !reducedMotion) {
      launch(state.width * 0.27, state.height * 0.2, 0.8);
      startAnimation();
    }
    return { launch: launchAt };
  }

  function createAnaarFountain(canvas) {
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return null;

    const state = {
      width: 0,
      height: 0,
      ratio: 1,
      particles: [],
      frame: 0,
      active: false,
      stopAt: 0,
      lastFrame: 0,
      spawnCarry: 0,
    };
    const colors = ["#fff7c2", "#ffe34f", "#ffba32", "#ff8c35", "#ff6545", "#fff0a0"];
    const maxParticles = window.innerWidth < 600 ? 180 : 420;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      state.width = rect.width;
      state.height = rect.height;
      state.ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 600 ? 1.25 : 1.6);
      canvas.width = Math.round(rect.width * state.ratio);
      canvas.height = Math.round(rect.height * state.ratio);
      context.setTransform(state.ratio, 0, 0, state.ratio, 0, 0);
    }

    function emitSpark() {
      if (state.particles.length >= maxParticles) return;
      const spread = window.innerWidth < 600 ? 2.4 : 3.2;
      const angle = (Math.random() - 0.5) * spread;
      const speed = 5.3 + Math.random() * 5.6;
      const emitterY = state.height - (window.innerWidth < 600 ? 30 : 43) - 129;
      const lifetime = 780 + Math.random() * 780;
      state.particles.push({
        x: state.width / 2 + (Math.random() - 0.5) * 5,
        y: emitterY + (Math.random() - 0.5) * 4,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        gravity: 0.12 + Math.random() * 0.065,
        drag: 0.987 + Math.random() * 0.008,
        age: 0,
        lifetime,
        size: 1.1 + Math.random() * 1.7,
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
      });
    }

    function animate(now) {
      state.frame = 0;
      if (!state.active || document.hidden) return;
      if (now - state.lastFrame < 1000 / 30) {
        state.frame = requestAnimationFrame(animate);
        return;
      }

      const delta = state.lastFrame ? Math.min((now - state.lastFrame) / (1000 / 30), 2) : 1;
      state.lastFrame = now;
      context.clearRect(0, 0, state.width, state.height);
      context.globalCompositeOperation = "lighter";

      if (now < state.stopAt) {
        state.spawnCarry += delta * (reducedMotion ? 2 : window.innerWidth < 600 ? 4.5 : 8);
        while (state.spawnCarry >= 1) {
          emitSpark();
          state.spawnCarry -= 1;
        }
      }

      for (let i = state.particles.length - 1; i >= 0; i -= 1) {
        const spark = state.particles[i];
        spark.trail.push({ x: spark.x, y: spark.y });
        if (spark.trail.length > 4) spark.trail.shift();
        spark.x += spark.vx * delta;
        spark.y += spark.vy * delta;
        spark.vy += spark.gravity * delta;
        spark.vx *= Math.pow(spark.drag, delta);
        spark.age += delta * (1000 / 30);
        if (spark.age >= spark.lifetime || spark.y > state.height + 8) {
          state.particles.splice(i, 1);
          continue;
        }

        const alpha = Math.min(1, (spark.lifetime - spark.age) / 180, spark.age / 55);
        if (spark.trail.length > 1) {
          context.beginPath();
          context.moveTo(spark.trail[0].x, spark.trail[0].y);
          for (let point = 1; point < spark.trail.length; point += 1) {
            context.lineTo(spark.trail[point].x, spark.trail[point].y);
          }
          context.lineTo(spark.x, spark.y);
          context.strokeStyle = spark.color;
          context.globalAlpha = alpha * 0.72;
          context.lineWidth = spark.size * 0.85;
          context.shadowColor = spark.color;
          context.shadowBlur = 7;
          context.stroke();
        }
        context.beginPath();
        context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        context.globalAlpha = alpha;
        context.fillStyle = spark.color;
        context.shadowColor = spark.color;
        context.shadowBlur = 12;
        context.fill();
      }

      context.globalAlpha = 1;
      context.shadowBlur = 0;
      context.globalCompositeOperation = "source-over";

      if (now >= state.stopAt && state.particles.length === 0) {
        state.active = false;
        state.lastFrame = 0;
        anarSection.classList.remove("is-firing");
        anarStatus.textContent = "What a beautiful finish. Light the anaar again whenever you like.";
        return;
      }
      state.frame = requestAnimationFrame(animate);
    }

    function ignite() {
      state.active = true;
      state.stopAt = performance.now() + (reducedMotion ? 1800 : 9000);
      state.lastFrame = 0;
      state.spawnCarry = 0;
      anarSection.classList.add("is-firing");
      state.particles.length = 0;
      anarStatus.textContent = "Your golden anaar is sparkling!";
      if (!state.frame) state.frame = requestAnimationFrame(animate);
    }

    canvas.addEventListener("visibilityresume", () => {
      if (state.active && !state.frame) state.frame = requestAnimationFrame(animate);
    });
    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize, { passive: true });
    return ignite;
  }

  const heroFireworks = createFireworks($("#hero-canvas"), false);
  const displayFireworks = createFireworks($("#display-canvas"), true);
  personalFireworks = createFireworks($("#wish-canvas"), false);
  anarFireworks = createAnaarFountain($("#anar-canvas"));
  function launchAnar() {
    if (!anarFireworks) {
      anarStatus.textContent = "The anaar animation is not supported in this browser.";
      return;
    }
    anarFireworks();
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      wishFireworksVisible = entry.isIntersecting;
      if (wishFireworksVisible) {
        scheduleWishFireworks();
      } else {
        window.clearTimeout(wishFireworkLoopTimer);
        wishFireworkLoopTimer = null;
      }
    }, { threshold: 0.05 }).observe($("#your-wish"));
  }
  const pageUrl = new URL(window.location.href);
  if (pageUrl.searchParams.has("name")) {
    pageUrl.searchParams.delete("name");
    window.history.replaceState(null, "", pageUrl);
  }
  function launchAtViewportPoint(x, y, power) {
    const rect = $("#hero-canvas").getBoundingClientRect();
    heroFireworks.launch(x - rect.left, y - rect.top, power);
  }
  $("#firework-button").addEventListener("click", () => {
    const canvas = $("#display-canvas");
    displayFireworks.launch(canvas.clientWidth * (0.25 + Math.random() * 0.5), canvas.clientHeight * (0.22 + Math.random() * 0.25), 1.1);
  });

  document.addEventListener("visibilitychange", () => {
    const eventName = document.hidden ? "visibilitypause" : "visibilityresume";
    [$("#hero-canvas"), $("#display-canvas"), $("#wish-canvas"), $("#anar-canvas")].forEach((canvas) => {
      if (canvas) canvas.dispatchEvent(new Event(eventName));
    });
    if (document.hidden) {
      window.clearTimeout(wishFireworkLoopTimer);
      wishFireworkLoopTimer = null;
    } else {
      scheduleWishFireworks();
    }
  });

  if (window.gsap && !reducedMotion) {
    window.gsap.from(".hero .eyebrow, .hero h1, .hero-copy, .hero-content .button", {
      y: 22, opacity: 0, duration: 0.85, stagger: 0.12, ease: "power2.out", delay: 0.12,
    });
    window.gsap.from(".hero-diya", { opacity: 0, y: 12, duration: 1.1, delay: 0.55, ease: "power2.out" });
  }
})();
