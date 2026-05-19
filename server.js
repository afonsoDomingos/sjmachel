/* ==========================================================================
   SJ MACHEL AGENCY - SERVIDOR BACKEND EXPRESS & MONGODB REAL
   Node.js + Mongoose + REST API + Auto-Seeder de Dados
   ========================================================================== */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARES GLOBAL
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos do diretório raiz
app.use(express.static(path.join(__dirname, '.')));

// 2. CONEXÃO COM O BANCO DE DADOS MONGODB
const mongoURI = process.env.MONGODB_URI || "mongodb+srv://karinganastudio23:VIbemongodb@cluster0.oe0akin.mongodb.net/sjmacheldb?retryWrites=true&w=majority";

console.log('A ligar ao MongoDB Atlas...');
mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ Conectado com sucesso ao MongoDB Atlas!');
    // Executa auto-seeder após ligação bem-sucedida
    seedDatabase();
  })
  .catch(err => {
    console.error('❌ Falha catastrófica ao ligar ao MongoDB:', err.message);
  });

// ==========================================================================
// 3. SCHEMAS E MODELOS MONGOOSE (BANCO DE DADOS)
// ==========================================================================

// A. Modelo de Artistas
const ArtistSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  genre: { type: String, required: true },
  bannerImg: { type: String, required: true },
  photo: { type: String, required: true },
  bio: { type: String, required: true },
  baseFee: { type: Number, required: true },
  hourlyRate: { type: Number, required: true }
});
const Artist = mongoose.model('Artist', ArtistSchema);

// B. Modelo de Músicas
const SongSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  artistId: { type: String, required: true },
  artistName: { type: String, required: true },
  genre: { type: String, required: true },
  coverUrl: { type: String, required: true },
  audioUrl: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true },
  lyrics: { type: String, default: "" }
});
const Song = mongoose.model('Song', SongSchema);

// C. Modelo de Eventos
const EventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  bannerUrl: { type: String, required: true },
  desc: { type: String, required: true },
  artistId: { type: String, required: true }
});
const Event = mongoose.model('Event', EventSchema);

// D. Modelo de Contratações (Booking)
const BookingSchema = new mongoose.Schema({
  artistId: { type: String, required: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientPhone: { type: String, required: true },
  date: { type: String, required: true },
  hours: { type: Number, required: true },
  eventType: { type: String, required: true },
  venue: { type: String, required: true },
  totalEstimate: { type: Number, required: true },
  status: { type: String, default: 'Pendente' },
  createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', BookingSchema);

// E. Modelo de Pedidos / Compras (Order)
const OrderSchema = new mongoose.Schema({
  items: [{
    id: String,
    title: String,
    price: Number,
    type: String,
    coverUrl: String
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentPhone: { type: String },
  status: { type: String, default: 'Completado' },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

// ==========================================================================
// 4. SEEDER AUTOMÁTICO (PREENCHER BANCO DE DADOS SE ESTIVER VAZIO)
// ==========================================================================
async function seedDatabase() {
  try {
    // Verificar se já existem artistas no banco de dados para evitar apagar dados criados pelo painel
    const artistCount = await Artist.countDocuments();
    if (artistCount > 0) {
      console.log('ℹ️ O banco de dados do MongoDB Atlas já contém artistas. Ignorando seeder para proteger os seus dados criados no painel.');
      return;
    }

    console.log('🧹 A limpar registos antigos do MongoDB Atlas...');
    await Artist.deleteMany({});
    await Song.deleteMany({});
    await Event.deleteMany({});
    
    console.log('🌱 A semear novo roster oficial de artistas da SJ Machel...');
    const defaultArtists = [
      {
        id: "lickson-sacur",
        name: "Lickson Sacur",
        genre: "Kizomba & AfroHouse",
        bannerImg: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
        photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3zwu_o21Q6ZU03wTndRLWFDBvDQpomEvB3w&s",
        bio: "Lickson Sacur é a sensação do Kizomba e AfroHouse em Moçambique. Com ritmos quentes e presença de palco magnética, é uma das maiores referências de pista de dança nacionais.",
        baseFee: 45000,
        hourlyRate: 10000
      },
      {
        id: "vibe-krg",
        name: "Vibe Krg",
        genre: "Rap",
        bannerImg: "Logotipo Oficial.png",
        photo: "Logotipo Oficial.png",
        bio: "Líder da nova escola do Rap nacional. Vibe Krg combina lírica afiada, flows extremamente dinâmicos e rimas com a força das ruas de Maputo.",
        baseFee: 35000,
        hourlyRate: 8000
      },
      {
        id: "arramane-music",
        name: "Arramane Music",
        genre: "Marrabenta",
        bannerImg: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
        photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIg7aMZRqEjncW1oZbaIpQQmlnwWLKZdrMKg&s",
        bio: "A essência viva da Marrabenta moçambicana. Arramane Music funde guitarras clássicas tradicionais com arranjos contemporâneos de percussão urbana.",
        baseFee: 30000,
        hourlyRate: 7000
      },
      {
        id: "guilman-silva",
        name: "GuilMan Silva",
        genre: "Kizomba",
        bannerImg: "Logotipo Oficial.png",
        photo: "Logotipo Oficial.png",
        bio: "A voz romântica do Kizomba moderno. GuilMan Silva encanta corações por todo Moçambique com as suas melodias suaves e letras apaixonadas.",
        baseFee: 25000,
        hourlyRate: 6000
      },
      {
        id: "lew-robert",
        name: "Lew Robert",
        genre: "Kizomba",
        bannerImg: "Logotipo Oficial.png",
        photo: "Logotipo Oficial.png",
        bio: "Lew Robert traz a energia do Zouk e Kizomba para as pistas. Coreografias dinâmicas e batidas envolventes fazem dele um artista completo.",
        baseFee: 25000,
        hourlyRate: 6000
      },
      {
        id: "libra-krg",
        name: "Libra Krg",
        genre: "Rap",
        bannerImg: "Logotipo Oficial.png",
        photo: "Logotipo Oficial.png",
        bio: "O peso do Rap Consciente. Libra Krg aborda temas de intervenção social de forma lírica, expressando os anseios e as vozes da juventude.",
        baseFee: 35000,
        hourlyRate: 8000
      },
      {
        id: "edvige-manaina",
        name: "Edvige Manaina",
        genre: "Amapiano",
        bannerImg: "Logotipo Oficial.png",
        photo: "Logotipo Oficial.png",
        bio: "A nova diva do Amapiano moçambicano. Edvige Manaina combina uma voz melodiosa e potente com batidas eletrónicas envolventes e modernas.",
        baseFee: 30000,
        hourlyRate: 7000
      },
      {
        id: "afropiano",
        name: "AfroPiano",
        genre: "Amapiano",
        bannerImg: "Logotipo Oficial.png",
        photo: "Logotipo Oficial.png",
        bio: "Pioneiros da fusão do Afro House com Amapiano em Moçambique. O duo AfroPiano cria sets explosivos que são sinónimo de festa e vibração pura.",
        baseFee: 35000,
        hourlyRate: 8000
      },
      {
        id: "jp",
        name: "JP",
        genre: "Marrabenta",
        bannerImg: "Logotipo Oficial.png",
        photo: "Logotipo Oficial.png",
        bio: "O virtuoso da nova geração da Marrabenta. JP traz o ritmo tradicional das acácias misturado com a energia contagiante do pop moderno.",
        baseFee: 25000,
        hourlyRate: 6000
      }
    ];
    await Artist.insertMany(defaultArtists);
    console.log('✅ Artistas da agência semeados com sucesso!');

    // B. Seed de Músicas
    console.log('🌱 A semear catálogo de músicas padrão dos novos artistas...');
    const defaultSongs = [
      {
        id: "song-1",
        title: "Amor de Kizomba",
        artistId: "lickson-sacur",
        artistName: "Lickson Sacur",
        genre: "Kizomba",
        coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        price: 50,
        duration: "6:12",
        lyrics: `[Intro]\nLickson Sacur na voz...\nSJ Machel Agency!\nSente o Kizomba a entrar...\n\n[Verso 1]\nQuando te vi dançar\nO mundo inteiro parou\nQuero te abraçar\nSente o toque do amor\n\n[Refrão]\nÉ amor de Kizomba na pista\nNinguém resiste a esta dança\nVem comigo, minha querida\nMoçambique na nossa lembrança!`
      },
      {
        id: "song-2",
        title: "Rap Arena",
        artistId: "vibe-krg",
        artistName: "Vibe Krg",
        genre: "Rap",
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        price: 50,
        duration: "7:05",
        lyrics: `[Intro]\nVibe Krg no mic!\nKRG Squad!\nSobe o volume do baixo!\n\n[Verso 1]\nLírica afiada, mente de mestre\nFlow que destrói o que não presta\nRap de verdade nas avenidas\nMaputo inteira com mãos subidas\n\n[Refrão]\nEsta é a nossa arena do Rap\nO beat bate e o flow não para\nFaz barulho, sente a energia\nVibe Krg na tua cara!`
      },
      {
        id: "song-3",
        title: "Marrabenta Viva",
        artistId: "arramane-music",
        artistName: "Arramane Music",
        genre: "Marrabenta",
        coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=300&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        price: 45,
        duration: "5:44",
        lyrics: `[Intro]\nArramane Music na guitarra!\nVamos dançar o nosso ritmo!\nMarrabenta de raiz!\n\n[Verso 1]\nToca viola, bate o tambor\nMarrabenta é ritmo e amor\nDas terras do sul ao norte profundo\nLevamos a nossa dança ao mundo\n\n[Refrão]\nMarrabenta viva, Marrabenta pura\nEsta é a nossa rica cultura\nDança Maputo, canta Beira\nMarrabenta é de primeira!`
      },
      {
        id: "song-4",
        title: "Sedução",
        artistId: "guilman-silva",
        artistName: "GuilMan Silva",
        genre: "Kizomba",
        coverUrl: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=300&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        price: 60,
        duration: "5:02",
        lyrics: `[Intro]\nGuilMan Silva...\nA voz romântica...\nEscuta esta melodia...\n\n[Verso 1]\nO teu olhar me seduz\nA tua voz me conduz\nNeste compasso do Zouk\nFomos feitos um para o outro\n\n[Refrão]\nSedução na noite quente\nKizomba que une a gente\nFica comigo até ao fim\nDiz que sim!`
      },
      {
        id: "song-5",
        title: "Zouk Tropical",
        artistId: "lew-robert",
        artistName: "Lew Robert",
        genre: "Kizomba",
        coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=300&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        price: 50,
        duration: "6:02",
        lyrics: `[Intro]\nLew Robert a comandar!\nDJ, solta a batida tropical!\nVamos dançar!\n\n[Verso 1]\nPasso a passo, corpo a corpo\nO ritmo quente do Zouk\nLuzes suaves na pista\nEsta noite é uma conquista\n\n[Refrão]\nZouk Tropical a bater\nAté o dia amanhecer\nMexe o corpo, vem sentir\nLew Robert vai-te conduzir!`
      },
      {
        id: "song-6",
        title: "Voz da Rua",
        artistId: "libra-krg",
        artistName: "Libra Krg",
        genre: "Rap",
        coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        price: 50,
        duration: "5:22",
        lyrics: `[Intro]\nLibra Krg...\nRap de intervenção!\nA voz de quem não se cala!\n\n[Verso 1]\nOlho nos olhos da minha cidade\nBusco justiça, busco verdade\nA voz da rua rima consciente\nPela esperança da nossa gente\n\n[Refrão]\nEsta é a voz da rua a gritar\nNinguém nos vai silenciar\nLírica consciente de intervenção\nLibra Krg na missão!`
      },
      {
        id: "song-7",
        title: "AfroHouse Night",
        artistId: "lickson-sacur",
        artistName: "Lickson Sacur",
        genre: "AfroHouse",
        coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        price: 55,
        duration: "6:40",
        lyrics: `[Intro]\nLickson Sacur!\nSente o baixo do AfroHouse!\nBatidas profundas!\n\n[Verso 1]\nTambores da noite a rufar\nO corpo não pode parar\nDança hipnótica e pura\nEsta batida nos cura\n\n[Refrão]\nAfroHouse Night a vibrar\nToda a gente a celebrar\nSJ Machel a produzir\nLickson Sacur a conduzir!`
      },
      {
        id: "song-8",
        title: "Nossa Dança",
        artistId: "edvige-manaina",
        artistName: "Edvige Manaina",
        genre: "Amapiano",
        coverUrl: "Logotipo Oficial.png",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        price: 50,
        duration: "4:50",
        lyrics: `[Intro]\nEdvige Manaina...\nSente esta melodia doce...\nAmapiano que apaixona!\n\n[Verso 1]\nO vento sopra suave no mar\nConvida os nossos corpos a dançar\nCom este ritmo a nos envolver\nEu só quero dançar com você\n\n[Refrão]\nEsta é a nossa dança de amor\nOnde a batida apaga a dor\nDança comigo até amanhecer\nEdvige Manaina vai-te aquecer!`
      },
      {
        id: "song-9",
        title: "Batida Quente",
        artistId: "afropiano",
        artistName: "AfroPiano",
        genre: "Amapiano",
        coverUrl: "Logotipo Oficial.png",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        price: 55,
        duration: "5:30",
        lyrics: `[Intro]\nAfroPiano na batida!\nSente o peso do log drum!\nMoçambique a vibrar!\n\n[Verso 1]\nO grave bate profundo no chão\nAcelera o batimento do coração\nRitmo contagiante de Amapiano\nQue faz dançar todo o ano\n\n[Refrão]\nEsta batida quente a ferver\nNão há como não se mexer\nAfroPiano comanda a pista\nO maior som da playlist!`
      },
      {
        id: "song-10",
        title: "Ritmo das Acácias",
        artistId: "jp",
        artistName: "JP",
        genre: "Marrabenta",
        coverUrl: "Logotipo Oficial.png",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        price: 45,
        duration: "4:15",
        lyrics: `[Intro]\nJP com a guitarra de Marrabenta!\nMaputo de braços abertos!\nSente a tradição!\n\n[Verso 1]\nNas ruas floridas de sol e cor\nCantamos a nossa terra com amor\nA guitarra chora um som do passado\nQue no presente é celebrated\n\n[Refrão]\nMarrabenta viva sob as acácias\nJP agradece com todas as graças\nDança moço, dança menina\nEsta energia nos ilumina!`
      }
    ];
    await Song.insertMany(defaultSongs);
    console.log('✅ Catálogo de músicas semeado com sucesso!');

    // C. Seed de Eventos
    console.log('🌱 A semear agenda de eventos padrão dos novos artistas...');
    const defaultEvents = [
      {
        id: "event-1",
        title: "Gala Kizomba & AfroHouse Moçambique",
        date: "2026-06-25",
        location: "Coconuts Live, Maputo",
        price: 1000,
        bannerUrl: "Logotipo Oficial.png",
        desc: "A maior celebração de Kizomba e AfroHouse da capital. Concerto especial de Lickson Sacur e convidados, com DJs internacionais e pista ao ar livre.",
        artistId: "lickson-sacur"
      },
      {
        id: "event-2",
        title: "KRG Rap & HipHop Showcase",
        date: "2026-07-30",
        location: "Maputo Arena, Maputo",
        price: 600,
        bannerUrl: "Logotipo Oficial.png",
        desc: "Uma noite explosiva de Rap moçambicano. Performances ao vivo das maiores referências do KRG Squad: Vibe Krg e Libra Krg, com batalhas de improviso.",
        artistId: "vibe-krg"
      },
      {
        id: "event-3",
        title: "Festival Marrabenta da Mafalala",
        date: "2026-08-15",
        location: "Centro Mafalala, Maputo",
        price: 400,
        bannerUrl: "Logotipo Oficial.png",
        desc: "Celebração histórica dos ritmos moçambicanos. Grande show de Arramane Music resgatando o ritmo das acácias com guitarras acústicas tradicionais.",
        artistId: "arramane-music"
      }
    ];
    await Event.insertMany(defaultEvents);
    console.log('✅ Agenda de eventos semeada com sucesso!');

  } catch (err) {
    console.error('⚠️ Erro ao semear dados iniciais:', err.message);
  }
}

// ==========================================================================
// 5. ROTAS DE REST API PARA O FRONTEND
// ==========================================================================

// A. ARTISTAS API
app.get('/api/artists', async (req, res) => {
  try {
    console.log('📥 GET /api/artists - A carregar lista de artistas');
    const artists = await Artist.find();
    res.json(artists);
  } catch (err) {
    console.error('❌ ERRO GET /api/artists:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artists', async (req, res) => {
  try {
    console.log('📤 POST /api/artists - A adicionar novo artista:', req.body.name);
    const newArtist = new Artist(req.body);
    const saved = await newArtist.save();
    console.log('✅ Artista adicionado com sucesso:', saved.id);
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ ERRO POST /api/artists:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// B. MÚSICAS API
app.get('/api/songs', async (req, res) => {
  try {
    console.log('📥 GET /api/songs - A carregar catálogo de músicas');
    const songs = await Song.find().sort({ _id: -1 }); // Músicas mais novas primeiro
    res.json(songs);
  } catch (err) {
    console.error('❌ ERRO GET /api/songs:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/songs', async (req, res) => {
  try {
    console.log('📤 POST /api/songs - A adicionar nova música:', req.body.title);
    const songData = req.body;
    // Garante ID único
    if (!songData.id) {
      songData.id = 'song-' + Date.now();
    }
    const newSong = new Song(songData);
    const saved = await newSong.save();
    console.log('✅ Música adicionada com sucesso:', saved.id);
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ ERRO POST /api/songs:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// C. EVENTOS API
app.get('/api/events', async (req, res) => {
  try {
    console.log('📥 GET /api/events - A carregar agenda de eventos');
    const events = await Event.find().sort({ date: 1 }); // Mais próximos primeiro
    res.json(events);
  } catch (err) {
    console.error('❌ ERRO GET /api/events:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    console.log('📤 POST /api/events - A adicionar novo evento:', req.body.title);
    const eventData = req.body;
    if (!eventData.id) {
      eventData.id = 'event-' + Date.now();
    }
    const newEvent = new Event(eventData);
    const saved = await newEvent.save();
    console.log('✅ Evento agendado com sucesso:', saved.id);
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ ERRO POST /api/events:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// D. CONTRATAÇÕES (BOOKING) API
app.post('/api/bookings', async (req, res) => {
  try {
    console.log('📤 POST /api/bookings - Novo pedido de contratação recebido');
    const newBooking = new Booking(req.body);
    const saved = await newBooking.save();
    console.log('✅ Contratação registada:', saved._id);
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ ERRO POST /api/bookings:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    console.log('📥 GET /api/bookings - A consultar contratos da agência');
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('❌ ERRO GET /api/bookings:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// E. PEDIDOS / VENDAS API
app.post('/api/orders', async (req, res) => {
  try {
    console.log('📤 POST /api/orders - Nova venda (Músicas/Bilhetes) recebida');
    const newOrder = new Order(req.body);
    const saved = await newOrder.save();
    console.log('✅ Venda registada:', saved._id);
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ ERRO POST /api/orders:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    console.log('📥 GET /api/orders - A consultar histórico de vendas');
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('❌ ERRO GET /api/orders:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Rota coringa para servir o index.html em qualquer navegação direta
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 6. INICIALIZAR SERVIDOR E EXPORTAR PARA VERCEL
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Express da SJ Machel Agency rodando na porta ${PORT}`);
    console.log(`👉 Aceda localmente em: http://localhost:${PORT}`);
  });
}

module.exports = app;
