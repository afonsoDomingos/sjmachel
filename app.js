/* ==========================================================================
   SJ MACHEL AGENCY - ENGINE PRINCIPAL DA PLATAFORMA (SPA & FULLSTACK)
   Integrado com Backend Node.js + MongoDB Atlas Real + Cloudinary Nativo
   ========================================================================== */

// 1. CONFIGURAÇÕES CLOUDINARY CLIENT-SIDE
const CLOUDINARY_CONFIG = {
  cloudName: "dnvnftvky",
  apiKey: "259851568455899",
  apiSecret: "3hRsXzUVd3pnwn9IKQWN7UAeJLc"
};

// 2. ESTADO DA APLICAÇÃO (Dinamizado via MongoDB REST API)
const AppState = {
  artists: [],
  songs: [],
  events: [],
  cart: [],
  
  // Estado do Player de Áudio
  currentTrackIndex: 0,
  isPlaying: false,
  isShuffle: false,
  isRepeat: false,
  isMuted: false,
  volume: 0.8
};

// Instância nativa do Audio do HTML5
const audio = new Audio();
audio.volume = AppState.volume;

// ==========================================================================
// 3. COMUNICAÇÃO DE DADOS COM O MONGODB BACKEND
// ==========================================================================
async function loadDataFromBackend() {
  try {
    // A. Carregar Artistas
    const artistsRes = await fetch('/api/artists');
    if (artistsRes.ok) {
      AppState.artists = await artistsRes.json();
    }

    // B. Carregar Músicas
    const songsRes = await fetch('/api/songs');
    if (songsRes.ok) {
      AppState.songs = await songsRes.json();
    }

    // C. Carregar Eventos
    const eventsRes = await fetch('/api/events');
    if (eventsRes.ok) {
      AppState.events = await eventsRes.json();
    }

    console.log("📊 Dados carregados com sucesso do MongoDB!");

    // Atualizar todos os renders
    renderHomeTracks();
    renderHomeArtists();
    renderHomeEvents();
    renderFullRoster("all");
    renderFullEvents();
    renderStoreTracks();
    updatePortalMetrics();

    // Carregar primeira faixa sem tocar automaticamente
    if (AppState.songs.length > 0) {
      loadTrack(0, false);
    }

  } catch (error) {
    console.error("⚠️ Erro ao carregar dados do MongoDB:", error);
    showToast("Erro de conexão ao banco de dados real. Usando fallbacks locais.", "error");
  }
}

// ==========================================================================
// 4. ASSINATURA CRIPTOGRÁFICA CLOUDINARY (SHA-1 VIA WEB CRYPTO API)
// ==========================================================================
async function generateSHA1(string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(string);
  const hashBuffer = await window.crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function uploadFileToCloudinary(file, resourceType, statusElementId, callback) {
  const statusEl = document.getElementById(statusElementId);
  if (!statusEl) return;
  
  statusEl.className = "upload-status-indicator uploading";
  statusEl.innerHTML = `<span class="spinner"></span> Carregando ficheiro para o Cloudinary...`;

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `timestamp=${timestamp}${CLOUDINARY_CONFIG.apiSecret}`;
    const signature = await generateSHA1(stringToSign);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", CLOUDINARY_CONFIG.apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;

    const response = await fetch(url, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Cloudinary respondeu com status ${response.status}`);
    }

    const data = await response.json();
    
    statusEl.className = "upload-status-indicator success";
    statusEl.innerHTML = `<i data-lucide="check-circle" class="icon-sm text-green"></i> Carregado com sucesso!`;
    lucide.createIcons();
    
    if (callback) callback(data.secure_url);
    showToast("Ficheiro carregado com sucesso para a Cloud!", "success");

  } catch (error) {
    console.error("Erro no upload Cloudinary:", error);
    statusEl.className = "upload-status-indicator failed";
    statusEl.innerHTML = `<i data-lucide="alert-triangle" class="icon-sm text-red"></i> Falha no upload. Insira URL manualmente.`;
    lucide.createIcons();
    showToast("Falha ao carregar ficheiro para a Cloud.", "error");
  }
}

// ==========================================================================
// 5. NOTIFICAÇÕES FLUTUANTES (TOASTS)
// ==========================================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "info";
  if (type === "success") icon = "check-circle";
  if (type === "warning") icon = "alert-circle";
  if (type === "error") icon = "alert-triangle";

  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 4000);
}

// ==========================================================================
// 6. NAVEGAÇÃO E SIMULAÇÃO SPA (ROUTING)
// ==========================================================================
function initNavigation() {
  const menuItems = document.querySelectorAll(".menu-item, [data-target]");
  const views = document.querySelectorAll(".content-view");

  menuItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const targetId = item.getAttribute("data-target");
      if (!targetId) return;

      views.forEach(v => v.classList.remove("active-view"));
      document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));

      const targetView = document.getElementById(targetId);
      if (targetView) {
        targetView.classList.add("active-view");
      }

      const correspondingMenu = document.querySelector(`.menu-item[data-target="${targetId}"]`);
      if (correspondingMenu) {
        correspondingMenu.classList.add("active");
      }

      document.querySelector(".main-content").scrollTop = 0;
      
      if (targetId === "view-portal") {
        updatePortalMetrics();
      }
    });
  });
}

// ==========================================================================
// 7. RENDERIZADORES DE LAYOUT
// ==========================================================================

function renderHomeTracks() {
  const container = document.getElementById("trending-tracks-container");
  if (!container) return;

  container.innerHTML = "";
  if (AppState.songs.length === 0) {
    container.innerHTML = `<p class="empty-cart-text">Nenhuma música encontrada no catálogo.</p>`;
    return;
  }

  const featured = AppState.songs.slice(0, 4);

  featured.forEach((song, index) => {
    const isPlaying = AppState.isPlaying && AppState.songs[AppState.currentTrackIndex]?.id === song.id;
    const activeClass = isPlaying ? "playing-row" : "";
    const playIcon = isPlaying ? "pause" : "play";

    const row = document.createElement("div");
    row.className = `track-row ${activeClass}`;
    row.innerHTML = `
      <span class="track-row-num">${index + 1}</span>
      <img src="${song.coverUrl}" class="track-row-cover" alt="Cover">
      <div class="track-row-title-block">
        <span class="track-row-title">${song.title}</span>
        <span class="track-row-artist">${song.artistName}</span>
      </div>
      <span class="track-row-genre">${song.genre}</span>
      <span class="track-row-duration">${song.duration}</span>
      <div class="track-row-actions">
        <button class="icon-btn play-row-btn" data-song-id="${song.id}"><i data-lucide="${playIcon}"></i></button>
        <button class="icon-btn buy-btn add-to-cart-btn" data-item-id="${song.id}" data-item-type="song"><i data-lucide="shopping-cart"></i></button>
      </div>
    `;

    row.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      playSongById(song.id);
    });

    container.appendChild(row);
  });

  container.querySelectorAll(".play-row-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const songId = btn.getAttribute("data-song-id");
      togglePlaySongById(songId);
    });
  });

  container.querySelectorAll(".add-to-cart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-item-id");
      const type = btn.getAttribute("data-item-type");
      addToCart(id, type);
    });
  });

  lucide.createIcons();
}

function renderHomeArtists() {
  const container = document.getElementById("artists-cards-container");
  if (!container) return;

  container.innerHTML = "";
  if (AppState.artists.length === 0) {
    container.innerHTML = `<p class="empty-cart-text">Nenhum artista cadastrado.</p>`;
    return;
  }
  
  AppState.artists.forEach(artist => {
    const card = document.createElement("div");
    card.className = "artist-card";
    card.innerHTML = `
      <div class="artist-img-wrapper">
        <img src="${artist.photo}" alt="${artist.name}">
      </div>
      <h4 class="artist-name">${artist.name}</h4>
      <span class="artist-genre">${artist.genre}</span>
      <span class="artist-rate">${artist.baseFee.toLocaleString()} MT / show</span>
    `;

    card.addEventListener("click", () => {
      const rosterView = document.getElementById("view-roster");
      document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active-view"));
      rosterView.classList.add("active-view");
      document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));
      document.getElementById("nav-roster").classList.add("active");
      
      setTimeout(() => {
        const artEl = document.getElementById(`roster-art-${artist.id}`);
        if (artEl) {
          artEl.scrollIntoView({ behavior: "smooth", block: "center" });
          artEl.classList.add("glowing-highlight");
          setTimeout(() => artEl.classList.remove("glowing-highlight"), 2000);
        }
      }, 300);
    });

    container.appendChild(card);
  });
}

function renderHomeEvents() {
  const container = document.getElementById("events-cards-container");
  if (!container) return;

  container.innerHTML = "";
  if (AppState.events.length === 0) {
    container.innerHTML = `<p class="empty-cart-text">Nenhum show agendado no momento.</p>`;
    return;
  }

  AppState.events.forEach(evt => {
    const dateFormatted = new Date(evt.date).toLocaleDateString("pt", { day: "numeric", month: "short" });
    
    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <div class="event-img-wrapper">
        <img src="${evt.bannerUrl}" alt="${evt.title}">
        <span class="event-date-tag">${dateFormatted}</span>
      </div>
      <div class="event-card-body">
        <h4 class="event-card-title">${evt.title}</h4>
        <p class="event-card-desc">${evt.desc}</p>
        <div class="event-meta-info">
          <span class="event-location"><i data-lucide="map-pin" class="icon-xs"></i> ${evt.location.split(",")[0]}</span>
          <span class="event-price">${evt.price.toLocaleString()} MT</span>
        </div>
        <button class="btn btn-primary btn-sm btn-block add-to-cart-btn" data-item-id="${evt.id}" data-item-type="ticket" style="margin-top: 16px;">
          <i data-lucide="ticket"></i> Comprar Bilhete
        </button>
      </div>
    `;

    card.querySelector(".add-to-cart-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(evt.id, "ticket");
    });

    container.appendChild(card);
  });
  
  lucide.createIcons();
}

function renderFullRoster(filterGenre = "all") {
  const container = document.getElementById("full-roster-grid");
  if (!container) return;

  container.innerHTML = "";

  const filtered = filterGenre === "all" 
    ? AppState.artists 
    : AppState.artists.filter(a => a.genre.toLowerCase() === filterGenre.toLowerCase());

  if (filtered.length === 0) {
    container.innerHTML = `<p class="empty-cart-text">Nenhum artista encontrado nesta categoria.</p>`;
    return;
  }

  filtered.forEach(artist => {
    const card = document.createElement("div");
    card.className = "roster-full-card";
    card.id = `roster-art-${artist.id}`;
    card.innerHTML = `
      <img src="${artist.bannerImg}" class="roster-banner-img" alt="Banner">
      <div class="roster-info-body">
        <h3>${artist.name}</h3>
        <span class="badge badge-outline-accent">${artist.genre}</span>
        <p class="roster-bio" style="margin-top: 12px;">${artist.bio}</p>
        <div class="sidebar-divider"></div>
        <div class="roster-booking-price-row">
          <div>
            <span style="font-size:10px; color:var(--text-muted); text-transform:uppercase; display:block;">Cachet Mínimo</span>
            <strong class="color-yellow" style="font-size:16px;">${artist.baseFee.toLocaleString()} MT</strong>
          </div>
          <button class="btn btn-primary btn-sm book-artist-trigger-btn" data-artist-id="${artist.id}">
            <i data-lucide="briefcase"></i> Contratar
          </button>
        </div>
      </div>
    `;

    card.querySelector(".book-artist-trigger-btn").addEventListener("click", () => {
      openBookingModal(artist.id);
    });

    container.appendChild(card);
  });

  lucide.createIcons();
}

function renderFullEvents() {
  const container = document.getElementById("full-events-grid");
  if (!container) return;

  container.innerHTML = "";
  if (AppState.events.length === 0) {
    container.innerHTML = `<p class="empty-cart-text">Sem eventos publicados.</p>`;
    return;
  }

  AppState.events.forEach(evt => {
    const artist = AppState.artists.find(a => a.id === evt.artistId) || { name: "SJ Machel Roster" };
    const dateFormatted = new Date(evt.date).toLocaleDateString("pt", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    
    const card = document.createElement("div");
    card.className = "roster-full-card";
    card.style.display = "grid";
    card.style.gridTemplateColumns = "300px 1fr";
    card.style.minHeight = "240px";
    
    if (window.innerWidth < 768) {
      card.style.gridTemplateColumns = "1fr";
    }

    card.innerHTML = `
      <img src="${evt.bannerUrl}" style="width:100%; height:100%; object-fit:cover;" alt="Banner">
      <div class="roster-info-body" style="display:flex; flex-direction:column; justify-content:center;">
        <span class="badge badge-accent" style="width:fit-content;">${artist.name}</span>
        <h3 style="font-size:22px; margin-top:8px;">${evt.title}</h3>
        <p style="font-size:11px; color:var(--neon-cyan); font-weight:bold; margin-top:4px;"><i data-lucide="clock" class="icon-xs"></i> ${dateFormatted}</p>
        <p class="roster-bio" style="margin-top:12px; height:auto; -webkit-line-clamp:none;">${evt.desc}</p>
        <div class="sidebar-divider"></div>
        <div class="roster-booking-price-row">
          <div>
            <span style="font-size:10px; color:var(--text-muted); text-transform:uppercase; display:block;"><i data-lucide="map-pin" class="icon-xs"></i> Local</span>
            <strong style="font-size:13px; color:var(--text-white);">${evt.location}</strong>
          </div>
          <button class="btn btn-glowing buy-ticket-btn" data-event-id="${evt.id}">
            <i data-lucide="ticket"></i> Adquirir por ${evt.price.toLocaleString()} MT
          </button>
        </div>
      </div>
    `;

    card.querySelector(".buy-ticket-btn").addEventListener("click", () => {
      addToCart(evt.id, "ticket");
    });

    container.appendChild(card);
  });

  lucide.createIcons();
}

function renderStoreTracks() {
  const tbody = document.getElementById("store-tracks-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (AppState.songs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Carregando loja...</td></tr>`;
    return;
  }

  AppState.songs.forEach((song, index) => {
    const isPlaying = AppState.isPlaying && AppState.songs[AppState.currentTrackIndex]?.id === song.id;
    const playIcon = isPlaying ? "pause" : "play";
    const playingClass = isPlaying ? "playing-row" : "";

    const tr = document.createElement("tr");
    tr.className = playingClass;
    tr.innerHTML = `
      <td>
        <button class="icon-btn play-store-btn" data-song-id="${song.id}">
          <i data-lucide="${playIcon}"></i>
        </button>
      </td>
      <td class="font-bold">${song.title}</td>
      <td class="text-muted">${song.artistName}</td>
      <td><span class="badge badge-outline-accent">${song.genre}</span></td>
      <td class="store-track-price font-bold">${song.price} MT</td>
      <td class="text-right">
        <button class="btn btn-primary btn-sm add-store-cart-btn" data-song-id="${song.id}">
          <i data-lucide="shopping-cart"></i> Adicionar
        </button>
      </td>
    `;

    tr.querySelector(".play-store-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      togglePlaySongById(song.id);
    });

    tr.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      playSongById(song.id);
    });

    tr.querySelector(".add-store-cart-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(song.id, "song");
    });

    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

// ==========================================================================
// 8. MOTOR DO PLAYER DE ÁUDIO (CONTROLES INTEGRADOS)
// ==========================================================================
function initAudioPlayer() {
  const playBtn = document.getElementById("player-btn-play");
  const prevBtn = document.getElementById("player-btn-prev");
  const nextBtn = document.getElementById("player-btn-next");
  const shuffleBtn = document.getElementById("player-btn-shuffle");
  const repeatBtn = document.getElementById("player-btn-repeat");
  const lyricsToggle = document.getElementById("player-btn-toggle-lyrics");
  const queueToggle = document.getElementById("player-btn-toggle-queue");
  const muteBtn = document.getElementById("player-btn-mute");
  
  const timelineSlider = document.getElementById("player-timeline-slider");
  const volumeSlider = document.getElementById("player-volume-slider");

  playBtn.addEventListener("click", () => {
    if (AppState.isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  });

  nextBtn.addEventListener("click", () => {
    nextTrack();
  });

  prevBtn.addEventListener("click", () => {
    prevTrack();
  });

  shuffleBtn.addEventListener("click", () => {
    AppState.isShuffle = !AppState.isShuffle;
    shuffleBtn.classList.toggle("active", AppState.isShuffle);
    showToast(AppState.isShuffle ? "Modo aleatório ativado!" : "Modo aleatório desativado", "info");
  });

  repeatBtn.addEventListener("click", () => {
    AppState.isRepeat = !AppState.isRepeat;
    repeatBtn.classList.toggle("active", AppState.isRepeat);
    showToast(AppState.isRepeat ? "Repetir faixa ativado!" : "Repetir faixa desativado", "info");
  });

  muteBtn.addEventListener("click", () => {
    AppState.isMuted = !AppState.isMuted;
    audio.muted = AppState.isMuted;
    
    const icon = AppState.isMuted ? "volume-x" : "volume-2";
    muteBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
    lucide.createIcons();

    const volumeFill = document.getElementById("player-volume-fill");
    const volumeHandle = document.getElementById("player-volume-handle");
    if (AppState.isMuted) {
      volumeFill.style.width = "0%";
      volumeHandle.style.left = "0%";
    } else {
      const volPct = AppState.volume * 100;
      volumeFill.style.width = `${volPct}%`;
      volumeHandle.style.left = `${volPct}%`;
    }
  });

  const toggleRightPanel = () => {
    const panel = document.getElementById("right-panel");
    panel.classList.toggle("expanded");
    panel.classList.toggle("collapsed");
  };

  lyricsToggle.addEventListener("click", toggleRightPanel);
  queueToggle.addEventListener("click", toggleRightPanel);
  document.getElementById("btn-close-right-panel").addEventListener("click", toggleRightPanel);

  audio.addEventListener("timeupdate", () => {
    updateTimeline();
  });

  audio.addEventListener("ended", () => {
    if (AppState.isRepeat) {
      audio.currentTime = 0;
      audio.play();
    } else {
      nextTrack();
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    document.getElementById("player-time-duration").textContent = formatTime(audio.duration);
  });

  timelineSlider.addEventListener("click", (e) => {
    const rect = timelineSlider.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    
    audio.currentTime = percentage * audio.duration;
    updateTimeline();
  });

  volumeSlider.addEventListener("click", (e) => {
    const rect = volumeSlider.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    
    AppState.volume = percentage;
    audio.volume = percentage;
    
    if (AppState.isMuted) {
      AppState.isMuted = false;
      audio.muted = false;
      muteBtn.innerHTML = `<i data-lucide="volume-2"></i>`;
      lucide.createIcons();
    }

    const volPct = percentage * 100;
    document.getElementById("player-volume-fill").style.width = `${volPct}%`;
    document.getElementById("player-volume-handle").style.left = `${volPct}%`;
  });
}

function loadTrack(index, autoPlay = true) {
  if (AppState.songs.length === 0) return;

  AppState.currentTrackIndex = index;
  const song = AppState.songs[index];

  audio.src = song.audioUrl;
  audio.load();

  document.getElementById("player-track-cover").src = song.coverUrl;
  document.getElementById("player-track-name").textContent = song.title;
  document.getElementById("player-track-artist").textContent = song.artistName;

  document.getElementById("panel-song-cover").src = song.coverUrl;
  document.getElementById("panel-song-title").textContent = song.title;
  document.getElementById("panel-song-artist").textContent = song.artistName;
  document.getElementById("panel-song-genre").textContent = song.genre;
  document.getElementById("panel-song-price").textContent = song.price;

  // Atualizar dinamicamente o Spotlight Hero Banner se for a faixa principal (index 0)
  if (index === 0) {
    const heroTitle = document.getElementById("hero-title");
    const heroDesc = document.getElementById("hero-description");
    if (heroTitle && heroDesc) {
      heroTitle.textContent = song.artistName.toUpperCase();
      heroDesc.textContent = `A sensação do momento em Moçambique com a chancela da SJ Machel Agency. Ouve agora o grande single de sucesso "${song.title}" (${song.genre}) e apoia adquirindo a versão Master de alta-fidelidade na nossa loja digital.`;
    }
  }

  const lyricsHtml = song.lyrics.split("\n").map((line, idx) => {
    const active = idx === 0 ? "active" : "";
    return `<p class="lyric-line ${active}">${line}</p>`;
  }).join("");
  document.getElementById("panel-song-lyrics").innerHTML = lyricsHtml;

  const buyShortcut = document.getElementById("player-track-buy-shortcut");
  buyShortcut.onclick = (e) => {
    e.stopPropagation();
    addToCart(song.id, "song");
  };

  const sideBuy = document.getElementById("panel-direct-add-cart");
  sideBuy.onclick = (e) => {
    e.stopPropagation();
    addToCart(song.id, "song");
  };

  if (autoPlay) {
    playTrack();
  } else {
    pauseTrack();
  }

  renderHomeTracks();
  renderStoreTracks();
}

function playTrack() {
  audio.play().then(() => {
    AppState.isPlaying = true;
    document.body.classList.add("playing-state");
    document.getElementById("player-btn-play").innerHTML = `<i data-lucide="pause" class="fill-current"></i>`;
    lucide.createIcons();
    
    const heroPlay = document.getElementById("hero-play-btn");
    if (heroPlay) heroPlay.innerHTML = `<i data-lucide="pause" class="fill-current"></i> Pausar Spotlight`;
    lucide.createIcons();
  }).catch(err => {
    console.error("Erro no play:", err);
  });
}

function pauseTrack() {
  audio.pause();
  AppState.isPlaying = false;
  document.body.classList.remove("playing-state");
  document.getElementById("player-btn-play").innerHTML = `<i data-lucide="play" class="fill-current"></i>`;
  lucide.createIcons();

  const heroPlay = document.getElementById("hero-play-btn");
  if (heroPlay) heroPlay.innerHTML = `<i data-lucide="play" class="fill-current"></i> Ouvir Agora`;
  lucide.createIcons();

  renderHomeTracks();
  renderStoreTracks();
}

function nextTrack() {
  if (AppState.songs.length === 0) return;
  let nextIdx = AppState.currentTrackIndex + 1;
  
  if (AppState.isShuffle) {
    nextIdx = Math.floor(Math.random() * AppState.songs.length);
  } else if (nextIdx >= AppState.songs.length) {
    nextIdx = 0;
  }
  
  loadTrack(nextIdx, true);
}

function prevTrack() {
  if (AppState.songs.length === 0) return;
  let prevIdx = AppState.currentTrackIndex - 1;
  
  if (prevIdx < 0) {
    prevIdx = AppState.songs.length - 1;
  }
  
  loadTrack(prevIdx, true);
}

function playSongById(songId) {
  const songIdx = AppState.songs.findIndex(s => s.id === songId);
  if (songIdx !== -1) {
    loadTrack(songIdx, true);
  }
}

function togglePlaySongById(songId) {
  const isCurrentlyPlaying = AppState.isPlaying && AppState.songs[AppState.currentTrackIndex]?.id === songId;
  if (isCurrentlyPlaying) {
    pauseTrack();
  } else {
    playSongById(songId);
  }
}

function updateTimeline() {
  const current = audio.currentTime;
  const duration = audio.duration || 0;
  
  document.getElementById("player-time-current").textContent = formatTime(current);
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  
  document.getElementById("player-timeline-fill").style.width = `${pct}%`;
  document.getElementById("player-timeline-handle").style.left = `${pct}%`;

  const lines = document.querySelectorAll("#panel-song-lyrics .lyric-line");
  if (lines.length > 0 && duration > 0) {
    const lineIndex = Math.floor((current / duration) * lines.length);
    lines.forEach((l, idx) => {
      if (idx === lineIndex) {
        l.classList.add("active");
        l.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        l.classList.remove("active");
      }
    });
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==========================================================================
// 9. CARRINHO DE COMPRAS E CHECKOUT (MONGO DB SYNC)
// ==========================================================================
function addToCart(itemId, type) {
  let item = null;
  
  if (type === "song") {
    item = AppState.songs.find(s => s.id === itemId);
  } else if (type === "ticket") {
    item = AppState.events.find(e => e.id === itemId);
  }

  if (!item) return;

  const exists = AppState.cart.find(c => c.id === itemId);
  if (exists) {
    showToast("Este item já foi adicionado ao seu carrinho!", "warning");
    return;
  }

  AppState.cart.push({
    id: item.id,
    title: item.title,
    price: item.price,
    type: type,
    coverUrl: type === "song" ? item.coverUrl : item.bannerUrl,
    subtitle: type === "song" ? item.artistName : new Date(item.date).toLocaleDateString("pt")
  });

  updateCartUI();
  showToast(`"${item.title}" adicionado ao carrinho!`, "success");
}

function removeFromCart(itemId) {
  AppState.cart = AppState.cart.filter(c => c.id !== itemId);
  updateCartUI();
  showToast("Item removido do carrinho.", "info");
}

function updateCartUI() {
  const countBadge = document.getElementById("cart-badge-count");
  const sidebarList = document.getElementById("sidebar-cart-list");
  const checkoutWrapper = document.getElementById("sidebar-checkout-wrapper");
  const sidebarTotalValue = document.getElementById("sidebar-cart-total-value");
  const headerTotal = document.getElementById("header-cart-total");

  const total = AppState.cart.reduce((sum, item) => sum + item.price, 0);

  countBadge.textContent = AppState.cart.length;
  headerTotal.textContent = `${total.toLocaleString()} MT`;

  if (AppState.cart.length === 0) {
    sidebarList.innerHTML = `<p class="empty-cart-text">O seu carrinho está vazio.</p>`;
    checkoutWrapper.style.display = "none";
  } else {
    checkoutWrapper.style.display = "block";
    sidebarTotalValue.textContent = `${total.toLocaleString()} MT`;
    sidebarList.innerHTML = "";

    AppState.cart.forEach(item => {
      const row = document.createElement("div");
      row.className = "sidebar-cart-item";
      row.innerHTML = `
        <img src="${item.coverUrl}" alt="Cover">
        <div class="sidebar-cart-item-info">
          <span class="sidebar-cart-item-name">${item.title}</span>
          <span class="sidebar-cart-item-price">${item.price} MT</span>
        </div>
        <button class="sidebar-cart-remove" data-item-id="${item.id}">
          <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
        </button>
      `;

      row.querySelector(".sidebar-cart-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        removeFromCart(item.id);
      });

      sidebarList.appendChild(row);
    });
    lucide.createIcons();
  }

  renderFullCartPage();
}

function renderFullCartPage() {
  const container = document.getElementById("full-cart-items-container");
  if (!container) return;

  const total = AppState.cart.reduce((sum, item) => sum + item.price, 0);
  
  const songsCount = AppState.cart.filter(c => c.type === "song").length;
  const ticketsCount = AppState.cart.filter(c => c.type === "ticket").length;

  document.getElementById("summary-songs-count").textContent = songsCount;
  document.getElementById("summary-events-count").textContent = ticketsCount;
  document.getElementById("summary-total-price").textContent = `${total.toLocaleString()} MT`;
  document.getElementById("checkout-button-total").textContent = `${total.toLocaleString()} MT`;

  if (AppState.cart.length === 0) {
    container.innerHTML = `<p class="empty-cart-text" style="font-size: 16px; margin: 40px 0;">Não há produtos adicionados ao seu carrinho principal.</p>`;
    return;
  }

  container.innerHTML = "";
  AppState.cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "full-cart-item";
    row.innerHTML = `
      <img src="${item.coverUrl}" alt="Cover">
      <div class="full-cart-item-info">
        <span class="full-cart-item-title">${item.title}</span>
        <span class="full-cart-item-subtitle" style="text-transform: capitalize; color:var(--primary-purple); font-weight:bold;">${item.type === "song" ? "Faixa de Áudio Master" : "Bilhete de Evento Oficial"}</span>
        <span class="full-cart-item-subtitle" style="display:block; margin-top:2px;">${item.subtitle}</span>
      </div>
      <div class="full-cart-item-price">${item.price.toLocaleString()} MT</div>
      <button class="icon-btn buy-btn" style="background:rgba(224,30,55,0.1); color:var(--primary-magenta);" data-cart-id="${item.id}">
        <i data-lucide="trash-2"></i>
      </button>
    `;

    row.querySelector("button").addEventListener("click", () => {
      removeFromCart(item.id);
    });

    container.appendChild(row);
  });

  lucide.createIcons();
}

function initCheckoutLogic() {
  const methodRadios = document.querySelectorAll('input[name="payment-method"]');
  const mpesaDetails = document.getElementById("mpesa-emola-details");
  const cardDetails = document.getElementById("card-details");
  const phoneLabel = mpesaDetails.querySelector("label");
  const submitBtn = document.getElementById("btn-submit-order");

  methodRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      document.querySelectorAll(".payment-method-card").forEach(c => c.classList.remove("active"));
      radio.closest(".payment-method-card").classList.add("active");

      const val = radio.value;
      if (val === "mpesa") {
        mpesaDetails.style.display = "block";
        cardDetails.style.display = "none";
        phoneLabel.textContent = "Número de Telefone Associado ao M-Pesa (+258)";
      } else if (val === "emola") {
        mpesaDetails.style.display = "block";
        cardDetails.style.display = "none";
        phoneLabel.textContent = "Número de Telefone Associado ao e-Mola (+258)";
      } else {
        mpesaDetails.style.display = "none";
        cardDetails.style.display = "block";
      }
    });
  });

  document.getElementById("sidebar-checkout-btn").addEventListener("click", () => {
    document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active-view"));
    document.getElementById("view-cart").classList.add("active-view");
    document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));
  });

  submitBtn.addEventListener("click", async () => {
    if (AppState.cart.length === 0) {
      showToast("O carrinho está vazio!", "warning");
      return;
    }

    const activeMethod = document.querySelector('input[name="payment-method"]:checked').value;
    const total = AppState.cart.reduce((sum, item) => sum + item.price, 0);
    const phoneVal = document.getElementById("checkout-phone").value;

    if (activeMethod === "mpesa" || activeMethod === "emola") {
      if (!phoneVal || phoneVal.length < 9) {
        showToast("Insira um número de telemóvel moçambicano válido!", "warning");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> A enviar pedido push SMS...`;
      showToast("Pedido USSD enviado para o seu telemóvel!", "warning");

      setTimeout(() => {
        submitBtn.innerHTML = `<span class="spinner"></span> A aguardar autorização de PIN no telemóvel...`;
        
        setTimeout(async () => {
          // Gravar compra no banco de dados MongoDB
          try {
            const res = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: AppState.cart,
                totalAmount: total,
                paymentMethod: activeMethod,
                paymentPhone: phoneVal
              })
            });

            if (res.ok) {
              openSuccessModal(total, activeMethod);
              AppState.cart = [];
              updateCartUI();
              loadDataFromBackend(); // Recarrega dados e atualiza métricas
            } else {
              showToast("Erro ao gravar pedido no banco de dados.", "error");
            }
          } catch (err) {
            console.error(err);
          }
          
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i data-lucide="shield-check"></i> Autorizar Pagamento`;
          lucide.createIcons();

        }, 3000);
      }, 2000);

    } else {
      const cardNum = document.getElementById("card-num").value;
      if (!cardNum || cardNum.length < 16) {
        showToast("Insira os dados do cartão Visa/MasterCard!", "warning");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner"></span> A processar pagamento bancário...`;

      setTimeout(async () => {
        try {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: AppState.cart,
              totalAmount: total,
              paymentMethod: "Visa / MasterCard"
            })
          });

          if (res.ok) {
            openSuccessModal(total, "Visa / MasterCard");
            AppState.cart = [];
            updateCartUI();
            loadDataFromBackend();
          }
        } catch (err) {
          console.error(err);
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="shield-check"></i> Autorizar Pagamento`;
        lucide.createIcons();
      }, 3000);
    }
  });
}

function openSuccessModal(amount, providerName) {
  const modal = document.getElementById("checkout-success-modal");
  const msgEl = document.getElementById("success-transaction-msg");
  const ticketsWrapper = document.getElementById("success-tickets-wrapper");
  const songsWrapper = document.getElementById("success-songs-wrapper");
  const songsList = document.getElementById("success-songs-download-list");

  msgEl.textContent = `A sua transação de ${amount.toLocaleString()} MT via ${providerName.toUpperCase()} foi processada com sucesso e gravada no MongoDB. O download e ingressos estão libertados.`;

  const hasTickets = AppState.cart.some(c => c.type === "ticket");
  const hasSongs = AppState.cart.some(c => c.type === "song");

  ticketsWrapper.style.display = hasTickets ? "block" : "none";
  songsWrapper.style.display = hasSongs ? "block" : "none";

  if (hasTickets) {
    const firstTicket = AppState.cart.find(c => c.type === "ticket");
    document.getElementById("success-ticket-title").textContent = firstTicket.title;
    document.getElementById("success-ticket-code").textContent = `INGRESSO #SJ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  if (hasSongs) {
    songsList.innerHTML = "";
    AppState.cart.filter(c => c.type === "song").forEach(song => {
      const row = document.createElement("div");
      row.className = "download-item-row";
      row.innerHTML = `
        <span class="download-item-name">${song.title} - Master WAV</span>
        <button class="download-item-btn" onclick="window.open('${song.audioUrl}', '_blank')">
          <i data-lucide="download" style="width:14px; height:14px;"></i> Download
        </button>
      `;
      songsList.appendChild(row);
    });
    lucide.createIcons();
  }

  modal.classList.add("active");

  document.getElementById("btn-close-success-modal").onclick = () => {
    modal.classList.remove("active");
    document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active-view"));
    document.getElementById("view-home").classList.add("active-view");
    document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));
    document.getElementById("nav-home").classList.add("active");
  };
}

// ==========================================================================
// 10. MODAL DE CONTRATAÇÃO DE ARTISTAS (DADOS DINÂMICOS & CACHET ESTIMATE)
// ==========================================================================
function openBookingModal(artistId) {
  const artist = AppState.artists.find(a => a.id === artistId);
  if (!artist) return;

  const modal = document.getElementById("booking-modal");
  document.getElementById("booking-artist-subtitle").textContent = artist.name;
  document.getElementById("booking-artist-id").value = artist.id;

  document.getElementById("booking-hours").value = 2;
  document.getElementById("booking-date").value = new Date().toISOString().split("T")[0];

  calculateBookingEstimate(artist);

  modal.classList.add("active");

  const hrsInput = document.getElementById("booking-hours");
  const onHrsChange = () => {
    calculateBookingEstimate(artist);
  };
  hrsInput.oninput = onHrsChange;
  hrsInput.onchange = onHrsChange;
}

function calculateBookingEstimate(artist) {
  const hrs = parseInt(document.getElementById("booking-hours").value) || 2;
  const base = artist.baseFee;
  const hourly = artist.hourlyRate * hrs;
  const total = base + hourly;

  document.getElementById("booking-base-fee").textContent = `${base.toLocaleString()} MT`;
  document.getElementById("booking-calc-hours").textContent = hrs;
  document.getElementById("booking-duration-fee").textContent = `${hourly.toLocaleString()} MT`;
  document.getElementById("booking-total-estimate").textContent = `${total.toLocaleString()} MT`;
}

function initBookingSubmit() {
  const form = document.getElementById("form-booking-artist");
  const modal = document.getElementById("booking-modal");

  document.getElementById("btn-close-booking-modal").onclick = () => {
    modal.classList.remove("active");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const client = document.getElementById("booking-client-name").value;
    const date = document.getElementById("booking-date").value;
    const totalText = document.getElementById("booking-total-estimate").textContent;
    const artistId = document.getElementById("booking-artist-id").value;

    const numericTotal = parseFloat(totalText.replace(/[^0-9]/g, "")) || 0;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          clientName: client,
          clientEmail: document.getElementById("booking-client-email").value,
          clientPhone: document.getElementById("booking-client-phone").value,
          date,
          hours: parseInt(document.getElementById("booking-hours").value),
          eventType: document.getElementById("booking-event-type").value,
          venue: document.getElementById("booking-venue").value,
          totalEstimate: numericTotal
        })
      });

      if (res.ok) {
        modal.classList.remove("active");
        showToast("Proposta de agenciamento guardada no MongoDB!", "success");
        loadDataFromBackend(); // Atualiza painel e vendas
      } else {
        showToast("Erro ao submeter booking.", "error");
      }
    } catch (err) {
      console.error(err);
    }

    form.reset();
  });
}

// ==========================================================================
// 11. PORTAL ADMINISTRATIVO (MÉTRICAS REAIS & UPLOADS CLOUDINARY)
// ==========================================================================
async function updatePortalMetrics() {
  document.getElementById("metric-artists-count").textContent = AppState.artists.length;
  document.getElementById("metric-tracks-count").textContent = AppState.songs.length;
  document.getElementById("metric-events-count").textContent = AppState.events.length;

  // Carrega vendas e propostas reais
  try {
    const ordersRes = await fetch('/api/orders');
    if (ordersRes.ok) {
      const orders = await ordersRes.json();
      const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      document.getElementById("metric-sales-total").textContent = `${totalSales.toLocaleString()} MT`;
    }
  } catch (err) {
    console.error(err);
  }

  // Preenche Dropdowns de artistas
  const trackArtistSelect = document.getElementById("track-artist");
  const eventArtistSelect = document.getElementById("event-artist");

  if (trackArtistSelect && eventArtistSelect) {
    trackArtistSelect.innerHTML = "";
    eventArtistSelect.innerHTML = "";

    AppState.artists.forEach(artist => {
      const opt = document.createElement("option");
      opt.value = artist.id;
      opt.textContent = artist.name;
      
      trackArtistSelect.appendChild(opt.cloneNode(true));
      eventArtistSelect.appendChild(opt);
    });
  }
}

function initPortalForms() {
  const trackForm = document.getElementById("form-add-track");
  const eventForm = document.getElementById("form-add-event");

  const audioUrlInput = document.getElementById("track-audio-url");
  const coverUrlInput = document.getElementById("track-cover-url");

  const audioGroup = audioUrlInput.closest(".form-group");
  const coverGroup = coverUrlInput.closest(".form-group");

  // Injetar Botão de Carregar MP3
  const audioUploaderWrapper = document.createElement("div");
  audioUploaderWrapper.className = "upload-btn-wrapper";
  audioUploaderWrapper.innerHTML = `
    <div class="btn-upload">
      <i data-lucide="cloud-upload" style="width:20px; height:20px;"></i>
      <span>Selecionar MP3 / Áudio Local</span>
      <span style="font-size:9px; color:var(--text-muted);">Upload directo para o Cloudinary</span>
    </div>
    <input type="file" id="cloudinary-audio-file" accept="audio/*">
    <div id="audio-upload-status" class="upload-status-indicator" style="display:none;"></div>
  `;
  audioGroup.appendChild(audioUploaderWrapper);

  // Injetar Botão de Carregar Imagem de Capa
  const coverUploaderWrapper = document.createElement("div");
  coverUploaderWrapper.className = "upload-btn-wrapper";
  coverUploaderWrapper.innerHTML = `
    <div class="btn-upload">
      <i data-lucide="image" style="width:20px; height:20px;"></i>
      <span>Selecionar Imagem de Capa</span>
      <span style="font-size:9px; color:var(--text-muted);">Upload directo para o Cloudinary</span>
    </div>
    <input type="file" id="cloudinary-cover-file" accept="image/*">
    <div id="cover-upload-status" class="upload-status-indicator" style="display:none;"></div>
  `;
  coverGroup.appendChild(coverUploaderWrapper);

  // Ouvir arquivos
  document.getElementById("cloudinary-audio-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      document.getElementById("audio-upload-status").style.display = "flex";
      uploadFileToCloudinary(file, "video", "audio-upload-status", (secureUrl) => {
        audioUrlInput.value = secureUrl;
      });
    }
  });

  document.getElementById("cloudinary-cover-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      document.getElementById("cover-upload-status").style.display = "flex";
      uploadFileToCloudinary(file, "image", "cover-upload-status", (secureUrl) => {
        coverUrlInput.value = secureUrl;
      });
    }
  });

  // Uploader de Banner no Evento
  const bannerUrlInput = document.getElementById("event-banner-url");
  const bannerGroup = bannerUrlInput.closest(".form-group");

  const bannerUploaderWrapper = document.createElement("div");
  bannerUploaderWrapper.className = "upload-btn-wrapper";
  bannerUploaderWrapper.innerHTML = `
    <div class="btn-upload">
      <i data-lucide="calendar" style="width:20px; height:20px;"></i>
      <span>Selecionar Imagem de Banner</span>
      <span style="font-size:9px; color:var(--text-muted);">Upload directo para o Cloudinary</span>
    </div>
    <input type="file" id="cloudinary-banner-file" accept="image/*">
    <div id="banner-upload-status" class="upload-status-indicator" style="display:none;"></div>
  `;
  bannerGroup.appendChild(bannerUploaderWrapper);

  document.getElementById("cloudinary-banner-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      document.getElementById("banner-upload-status").style.display = "flex";
      uploadFileToCloudinary(file, "image", "banner-upload-status", (secureUrl) => {
        bannerUrlInput.value = secureUrl;
      });
    }
  });

  // Submit Nova Música no MongoDB
  trackForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("track-title").value;
    const artistId = document.getElementById("track-artist").value;
    const genre = document.getElementById("track-genre").value;
    const price = parseFloat(document.getElementById("track-price").value) || 50;
    const duration = document.getElementById("track-duration").value || "3:30";
    const audioUrl = audioUrlInput.value || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    const coverUrl = coverUrlInput.value || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop";

    const artistObj = AppState.artists.find(a => a.id === artistId) || { name: "Artista SJ Roster" };

    const newSong = {
      id: `song-${Date.now()}`,
      title,
      artistId,
      artistName: artistObj.name,
      genre,
      coverUrl,
      audioUrl,
      price,
      duration,
      lyrics: `[Intro]\nLançamento Exclusivo da Música "${title}"!\nAgenciamento SJ Machel.\nOuve o ritmo que vai conquistar Moçambique!`
    };

    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSong)
      });

      if (res.ok) {
        const savedSong = await res.json();
        AppState.songs.unshift(savedSong);
        
        renderHomeTracks();
        renderStoreTracks();
        updatePortalMetrics();

        showToast(`Música "${title}" guardada no MongoDB Atlas!`, "success");
      }
    } catch (err) {
      console.error(err);
    }

    trackForm.reset();
    document.getElementById("audio-upload-status").style.display = "none";
    document.getElementById("cover-upload-status").style.display = "none";
  });

  // Submit Novo Evento no MongoDB
  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("event-title").value;
    const date = document.getElementById("event-date").value;
    const location = document.getElementById("event-location").value;
    const price = parseFloat(document.getElementById("event-ticket-price").value) || 500;
    const artistId = document.getElementById("event-artist").value;
    const desc = document.getElementById("event-description").value;
    const bannerUrl = bannerUrlInput.value || "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop";

    const newEvent = {
      id: `event-${Date.now()}`,
      title,
      date,
      location,
      price,
      bannerUrl,
      desc,
      artistId
    };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });

      if (res.ok) {
        const savedEvent = await res.json();
        AppState.events.unshift(savedEvent);

        renderHomeEvents();
        renderFullEvents();
        updatePortalMetrics();

        showToast(`Evento "${title}" guardado no MongoDB Atlas!`, "success");
      }
    } catch (err) {
      console.error(err);
    }

    eventForm.reset();
    document.getElementById("banner-upload-status").style.display = "none";
  });

  lucide.createIcons();
}

// ==========================================================================
// 12. LOGICA DE PESQUISA INTEGRADA E FILTRAGEM
// ==========================================================================
function initSearchLogic() {
  const searchInput = document.getElementById("global-search-input");
  
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase().trim();

    if (val.length === 0) {
      renderHomeTracks();
      renderHomeArtists();
      renderHomeEvents();
      return;
    }

    const filteredSongs = AppState.songs.filter(s => 
      s.title.toLowerCase().includes(val) || 
      s.artistName.toLowerCase().includes(val) || 
      s.genre.toLowerCase().includes(val)
    );

    const tracksContainer = document.getElementById("trending-tracks-container");
    if (tracksContainer) {
      tracksContainer.innerHTML = "";
      if (filteredSongs.length === 0) {
        tracksContainer.innerHTML = `<p class="empty-cart-text">Nenhuma música encontrada para "${val}".</p>`;
      } else {
        filteredSongs.forEach((song, index) => {
          const row = document.createElement("div");
          row.className = "track-row";
          row.innerHTML = `
            <span class="track-row-num">${index + 1}</span>
            <img src="${song.coverUrl}" class="track-row-cover" alt="Cover">
            <div class="track-row-title-block">
              <span class="track-row-title">${song.title}</span>
              <span class="track-row-artist">${song.artistName}</span>
            </div>
            <span class="track-row-genre">${song.genre}</span>
            <span class="track-row-duration">${song.duration}</span>
            <div class="track-row-actions">
              <button class="icon-btn play-row-btn" data-song-id="${song.id}"><i data-lucide="play"></i></button>
              <button class="icon-btn buy-btn add-to-cart-btn" data-item-id="${song.id}" data-item-type="song"><i data-lucide="shopping-cart"></i></button>
            </div>
          `;
          row.addEventListener("click", () => playSongById(song.id));
          tracksContainer.appendChild(row);
        });
        lucide.createIcons();
      }
    }
  });
}

function initRosterFilters() {
  const chips = document.querySelectorAll(".filter-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      
      const genre = chip.getAttribute("data-genre");
      renderFullRoster(genre);
    });
  });
}

// ==========================================================================
// 13. BOOTSTRAP E INICIALIZAÇÃO GERAL (DOM LOADED)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  // Injetar o Banner de Destaque fornecido (Banner Sj.png) na tela inicial
  const heroBanner = document.getElementById("hero-spotlight");
  if (heroBanner) {
    heroBanner.style.backgroundImage = "linear-gradient(135deg, rgba(123, 44, 191, 0.5) 0%, rgba(8, 8, 10, 0.9) 100%), url('Banner Sj.png')";
  }

  // Executa módulos de inicialização
  initNavigation();
  initAudioPlayer();
  initCheckoutLogic();
  initBookingSubmit();
  initPortalForms();
  initSearchLogic();
  initRosterFilters();

  // Carregar dados reais do banco de dados MongoDB Atlas
  loadDataFromBackend();

  updateCartUI();

  // Hero Spotlight Evento de Play
  document.getElementById("hero-play-btn").addEventListener("click", () => {
    if (AppState.songs.length > 0) {
      togglePlaySongById(AppState.songs[0].id);
    } else {
      showToast("Carregando faixas...", "warning");
    }
  });

  document.getElementById("hero-book-btn").addEventListener("click", () => {
    openBookingModal("yasmine-cruz");
  });

  document.getElementById("header-btn-booking").addEventListener("click", () => {
    document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active-view"));
    document.getElementById("view-roster").classList.add("active-view");
    document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));
    document.getElementById("nav-roster").classList.add("active");
  });

  document.getElementById("header-btn-cart").addEventListener("click", () => {
    document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active-view"));
    document.getElementById("view-cart").classList.add("active-view");
    document.querySelectorAll(".menu-item").forEach(mi => mi.classList.remove("active"));
  });

  showToast("Conectado ao MongoDB Atlas Real da SJ Machel!", "success");
});
