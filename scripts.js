const revealElements = document.querySelectorAll(".reveal");
const audioNotice = document.getElementById("audio-notice");
const audioElement = document.getElementById("bg-music");
const canvas = document.getElementById("particle-canvas");
const context = canvas.getContext("2d");

let audioStarted = false;
let audioContext;
let analyser;
let sourceNode;
let frequencyData;
let analyzerReady = false;

function revealOnScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.18 }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function setupAudioAnalyzer() {
  if (analyzerReady) {
    return;
  }

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    sourceNode = audioContext.createMediaElementSource(audioElement);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyzerReady = true;
  } catch (error) {
    analyser = null;
    frequencyData = null;
  }
}

async function startMusic() {
  try {
    if (!audioContext) {
      setupAudioAnalyzer();
    }

    if (audioContext && audioContext.state === "suspended") {
      await audioContext.resume();
    }

    audioElement.volume = 0.75;
    audioElement.muted = false;
    await audioElement.play();
    audioStarted = true;
    document.body.classList.add("music-live");
    audioNotice.classList.remove("show");
  } catch (error) {
    audioNotice.classList.add("show");
  }
}

function runVisualizer() {
  if (analyser && frequencyData) {
    analyser.getByteFrequencyData(frequencyData);
    let total = 0;
    for (let index = 0; index < frequencyData.length; index += 1) {
      total += frequencyData[index];
    }

    const average = total / frequencyData.length;
    const energy = average / 255;
    document.documentElement.style.setProperty("--beat-scale", (1 + energy * 0.22).toFixed(3));
    document.documentElement.style.setProperty("--beat-glow", `${(0.26 + energy * 0.5).toFixed(3)}`);
    document.documentElement.style.setProperty("--beat-shift", `${(6 + energy * 18).toFixed(1)}px`);
  }

  window.requestAnimationFrame(runVisualizer);
}

function setupMusic() {
  audioElement.volume = 0.75;
  audioElement.muted = false;

  window.addEventListener("load", () => {
    startMusic().catch(() => {
      audioNotice.classList.add("show");
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !audioStarted) {
      startMusic().catch(() => {
        audioNotice.classList.add("show");
      });
    }
  });

  ["pointerdown", "touchstart", "keydown", "scroll"].forEach((eventName) => {
    window.addEventListener(
      eventName,
      async () => {
        if (!audioStarted) {
          await startMusic();
        }
      },
      { once: true, passive: true }
    );
  });

  window.setTimeout(() => {
    if (!audioStarted) {
      audioNotice.classList.add("show");
    }
  }, 1800);

  audioElement.addEventListener("playing", () => {
    audioStarted = true;
    document.body.classList.add("music-live");
    audioNotice.classList.remove("show");
  });

  audioElement.addEventListener("canplaythrough", async () => {
    if (!audioStarted) {
      await startMusic();
    }
  });

  audioElement.addEventListener("error", () => {
    audioNotice.classList.add("show");
  });
}

function createParticles() {
  const particles = [];
  const particleCount = Math.min(80, Math.floor(window.innerWidth / 18));

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function seedParticles() {
    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.8 + 0.4,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.45 + 0.12
      });
    }
  }

  function drawParticles() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, index) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.x < 0 || particle.x > canvas.width) {
        particle.speedX *= -1;
      }

      if (particle.y < 0 || particle.y > canvas.height) {
        particle.speedY *= -1;
      }

      context.beginPath();
      const pulseBoost = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--beat-glow")) || 0.26;
      context.fillStyle = `rgba(255, 92, 105, ${Math.min(0.95, particle.opacity + pulseBoost * 0.22)})`;
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();

      for (let neighborIndex = index + 1; neighborIndex < particles.length; neighborIndex += 1) {
        const neighbor = particles[neighborIndex];
        const dx = particle.x - neighbor.x;
        const dy = particle.y - neighbor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          context.beginPath();
          context.strokeStyle = `rgba(179, 18, 23, ${Math.max(0.02, 0.12 - distance / 1100 + pulseBoost * 0.18)})`;
          context.lineWidth = 1;
          context.moveTo(particle.x, particle.y);
          context.lineTo(neighbor.x, neighbor.y);
          context.stroke();
        }
      }
    });

    window.requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  seedParticles();
  drawParticles();

  window.addEventListener("resize", () => {
    resizeCanvas();
    seedParticles();
  });
}

revealOnScroll();
setupMusic();
createParticles();
runVisualizer();
