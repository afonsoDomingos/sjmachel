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
    // A. Seed de Artistas
    const artistCount = await Artist.countDocuments();
    if (artistCount === 0) {
      console.log('🌱 Banco vazio. A semear roster de artistas padrão...');
      const defaultArtists = [
        {
          id: "yasmine-cruz",
          name: "Yasmine Cruz",
          genre: "Amapiano",
          bannerImg: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop",
          photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=300&auto=format&fit=crop",
          bio: "Yasmine Cruz é a sensação do Amapiano e Soul Moçambicano. Com a sua voz aveludada e batidas profundas, tem conquistado tabelas internacionais e arrastado multidões com a chancela da SJ Machel.",
          baseFee: 50000,
          hourlyRate: 15000
        },
        {
          id: "dj-machel",
          name: "DJ Machel",
          genre: "Afro House",
          bannerImg: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
          photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
          bio: "Diretor musical e mentor da SJ Machel Agency. Especialista em fundir os ritmos tradicionais da Marrabenta com o dinamismo hipnótico e ritmos tribais do Afro House.",
          baseFee: 40000,
          hourlyRate: 12000
        },
        {
          id: "valdano-king",
          name: "Valdano King",
          genre: "Marrabenta",
          bannerImg: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=600&auto=format&fit=crop",
          photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
          bio: "A voz romântica da agência. Valdano traz o resgate histórico da Marrabenta clássica com arranjos modernos de R&B e Pop Afro para derreter corações.",
          baseFee: 30000,
          hourlyRate: 10000
        },
        {
          id: "os-madjaha",
          name: "Os Madjaha",
          genre: "Pandza",
          bannerImg: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          photo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
          bio: "Energia, pulsação e dança pura. O grupo Os Madjaha representa a vertente Pandza de alta velocidade, ideais para festivais, comícios e agitação pura.",
          baseFee: 25000,
          hourlyRate: 8000
        }
      ];
      await Artist.insertMany(defaultArtists);
      console.log('✅ Roster de artistas semeado com sucesso!');
    }

    // B. Seed de Músicas
    const songCount = await Song.countDocuments();
    if (songCount === 0) {
      console.log('🌱 Banco vazio. A semear catálogo de músicas padrão...');
      const defaultSongs = [
        {
          id: "song-1",
          title: "Amapiano Breeze",
          artistId: "yasmine-cruz",
          artistName: "Yasmine Cruz",
          genre: "Amapiano",
          coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          price: 50,
          duration: "6:12",
          lyrics: `[Intro]\nSJ Machel Agency apresenta...\nYasmine Cruz no comando!\nSentir a brisa, sentir o baixo...\n\n[Verso 1]\nVem comigo que a noite é nossa\nMaputo brilha na escuridão\nNão há problemas que nos dividam\nEsquece tudo, ouve esta canção\n\n[Refrão]\nAmapiano breeze a soprar\nEste ritmo vai-nos levar\nMoçambique inteiro a dançar\nAmapiano breeze a soprar!`
        },
        {
          id: "song-2",
          title: "Sabor de Marrabenta",
          artistId: "dj-machel",
          artistName: "DJ Machel ft. Valdano King",
          genre: "Marrabenta",
          coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          price: 50,
          duration: "7:05",
          lyrics: `[Instrumental Solo]\nMarrabenta clássica misturada...\nDJ Machel na mesa de mistura!\nValdano King na voz!\n\n[Verso 1]\nRecordo o tempo dos nossos pais\nDançavam juntos na Mafalala\nRitmo quente que não morre mais\nFica na alma, ninguém cala\n\n[Refrão]\nÉ marrabenta, é Moçambique\nDJ Machel dá o clique\nDança, avô, dança, avó\nMarrabenta é o nosso farol!`
        },
        {
          id: "song-3",
          title: "Pandza Bassline",
          artistId: "os-madjaha",
          artistName: "Os Madjaha",
          genre: "Pandza",
          coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=300&auto=format&fit=crop",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
          price: 45,
          duration: "5:44",
          lyrics: `[Intro]\nDJ, sobe o Pandza!\nOs Madjaha chegaram!\nToda a gente no chão!\n\n[Verso 1]\nVem com força, mexe o pé\nEsta batida tem axé\nPandza moderno com energia\nDançamos todos na alegria\n\n[Refrão]\nBate o pé, bate o chão\nO Pandza é a nossa paixão\nMaputo explode de emoção!`
        },
        {
          id: "song-4",
          title: "Afro House Ritual",
          artistId: "dj-machel",
          artistName: "DJ Machel",
          genre: "Afro House",
          coverUrl: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=300&auto=format&fit=crop",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
          price: 60,
          duration: "5:02",
          lyrics: `[Instrumental Profundo]\n[Drums de Tribo]\nSente a percussão da terra...\n\n[Verso Único]\nA noite cai na floresta urbana\nO tambor chama a tribo humana\nDançamos livres sob a lua\nA alma eleva-se na rua\n\n[Refrão]\nRitual, ritual\nAfro House espiritual!`
        },
        {
          id: "song-5",
          title: "Sonhos de Maputo",
          artistId: "yasmine-cruz",
          artistName: "Yasmine Cruz",
          genre: "Amapiano",
          coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=300&auto=format&fit=crop",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
          price: 50,
          duration: "6:02",
          lyrics: `[Intro]\nMaputo... cidade das acácias...\nSonhos que voam...\n\n[Verso 1]\nCaminho lento junto à marginal\nA brisa do mar é celestial\nQuero viver e amar sem fim\nMaputo mora dentro de mim\n\n[Refrão]\nSonhos de Maputo a brilhar\nSob as estrelas do mar\nA nossa voz vai ecoar!`
        }
      ];
      await Song.insertMany(defaultSongs);
      console.log('✅ Catálogo de músicas semeado com sucesso!');
    }

    // C. Seed de Eventos
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      console.log('🌱 Banco vazio. A semear agenda de eventos padrão...');
      const defaultEvents = [
        {
          id: "event-1",
          title: "SJ Machel Festival 2026",
          date: "2026-06-25",
          location: "Maputo Arena, Maputo",
          price: 800,
          bannerUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop",
          desc: "O festival anual da agência. Reunindo todo o roster oficial num palco monumental com luzes neon, convidados internacionais e 10 horas de música sem parar.",
          artistId: "dj-machel"
        },
        {
          id: "event-2",
          title: "Amapiano Sunset Jam",
          date: "2026-05-30",
          location: "Coconuts Live, Maputo",
          price: 500,
          bannerUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=600&auto=format&fit=crop",
          desc: "Desfrute do fim de tarde perfeito à beira da piscina. Comanda Yasmine Cruz com um set especial de Amapiano ao vivo e DJs convidados do cenário nacional.",
          artistId: "yasmine-cruz"
        },
        {
          id: "event-3",
          title: "Noite de Gala Marrabenta",
          date: "2026-07-10",
          location: "Franco-Moçambicano, Maputo",
          price: 1200,
          bannerUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=600&auto=format&fit=crop",
          desc: "Uma celebração sofisticada da música tradicional. Concerto solo de Valdano King com uma orquestra clássica interpretando os maiores hits da Marrabenta.",
          artistId: "valdano-king"
        }
      ];
      await Event.insertMany(defaultEvents);
      console.log('✅ Agenda de eventos semeada com sucesso!');
    }

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
    const artists = await Artist.find();
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artists', async (req, res) => {
  try {
    const newArtist = new Artist(req.body);
    const saved = await newArtist.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// B. MÚSICAS API
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await Song.find().sort({ _id: -1 }); // Músicas mais novas primeiro
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/songs', async (req, res) => {
  try {
    const songData = req.body;
    // Garante ID único
    if (!songData.id) {
      songData.id = 'song-' + Date.now();
    }
    const newSong = new Song(songData);
    const saved = await newSong.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// C. EVENTOS API
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }); // Mais próximos primeiro
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const eventData = req.body;
    if (!eventData.id) {
      eventData.id = 'event-' + Date.now();
    }
    const newEvent = new Event(eventData);
    const saved = await newEvent.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// D. CONTRATAÇÕES (BOOKING) API
app.post('/api/bookings', async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    const saved = await newBooking.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// E. PEDIDOS / VENDAS API
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const saved = await newOrder.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota coringa para servir o index.html em qualquer navegação direta
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 6. INICIALIZAR SERVIDOR
app.listen(PORT, () => {
  console.log(`🚀 Servidor Express da SJ Machel Agency rodando na porta ${PORT}`);
  console.log(`👉 Aceda localmente em: http://localhost:${PORT}`);
});
