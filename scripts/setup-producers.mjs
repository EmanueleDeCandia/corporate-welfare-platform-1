import Database from 'better-sqlite3';
import crypto from 'crypto';

const db = new Database('radici.db');

function hashPassword(password) {
  return crypto.createHash('sha256').update(`radici-welfare-territoriale-v1:${password}`).digest('hex');
}

const producers = [
  {
    targetId: 12,
    name: 'Frantoio del Conero',
    slug: 'frantoio-del-conero',
    type: 'producer',
    city: 'Sirolo',
    province: 'AN',
    region: 'Marche',
    destinationId: 1,
    description: 'Frantoio storico alle pendici del Monte Conero specializzato in Olio Extravergine Biologico da cultivar autoctone marchigiane (Raggia e Leccino).',
    longDescription: 'Il Frantoio del Conero produce olio EVO biologico certificato a filiera cortissima. Le olive vengono raccolte a mano negli uliveti di Sirolo e Numana e molite a freddo entro 6 ore per preservare polifenoli e aromi erbacei. Acquistabile liberamente da tutti i membri della community con consegna garantita.',
    coverImage: '/images/agriturismo-valle.jpg',
    basketName: 'Cesto Conero Oro Verde',
    basketDescription: '3 Bottiglie Olio EVO Monocultivar Raggia Bio (3x750ml) + Patè artigianale di olive nere e Carciofini sott\'olio KM 0.',
    priceBasketCents: 3800,
    checkinCode: 'prod-frantoio-conero',
    email: 'marco@frantoioconero.it',
    firstName: 'Marco',
    lastName: 'Silvestri',
  },
  {
    targetId: 13,
    name: 'Cantina Moroder',
    slug: 'cantina-moroder',
    type: 'producer',
    city: 'Ancona',
    province: 'AN',
    region: 'Marche',
    destinationId: 1,
    description: 'Tenuta vinicola biologica nel cuore del Parco del Conero, custode della prestigiosa denominazione Rosso Conero DOCG.',
    longDescription: 'Fondata da generazioni all\'interno del parco naturale, Moroder coltiva uve Montepulciano esposte alle brezze dell\'Adriatico. Il vino affina in botti di rovere nelle cantine storiche in pietra. Il cesto include le migliori annate e dolcezze marchigiane abbinate.',
    coverImage: '/images/agriturismo-fontebella.jpg',
    basketName: 'Cesto Riserva del Vigneto',
    basketDescription: '2 Bottiglie Rosso Conero DOCG Riserva + Confettura extra di Visciole selvatiche e Cantucci artigianali al mosto cotto.',
    priceBasketCents: 4500,
    checkinCode: 'prod-cantina-moroder',
    email: 'mattia@cantinamoroder.it',
    firstName: 'Mattia',
    lastName: 'Moroder',
  },
  {
    targetId: 14,
    name: 'Caseificio Bio dei Sibillini',
    slug: 'caseificio-bio-sibillini',
    type: 'producer',
    city: 'Amandola',
    province: 'FM',
    region: 'Marche',
    destinationId: 1,
    description: 'Piccolo caseificio d\'alta quota che trasforma esclusivamente latte crudo biologico di pecore e capre al pascolo nei Monti Sibillini.',
    longDescription: 'Filiera circolare e sostenibile: i formaggi sono affinati con erbe spontanee di montagna, fieno e stagionatura in antiche grotte tufacee. Un presidio di biodiversità che sostiene i giovani allevatori locali.',
    coverImage: '/images/masseria-grazie.jpg',
    basketName: 'Cesto Casaro dei Monti Azzurri',
    basketDescription: 'Pecorino dei Sibillini semistagionato (800g), Caciotta fresca alle noci dell\'alta valle e vasetto di Miele di Melata bio.',
    priceBasketCents: 4200,
    checkinCode: 'prod-caseificio-sibillini',
    email: 'sara@caseificiosibillini.it',
    firstName: 'Sara',
    lastName: 'Vitali',
  },
  {
    targetId: 15,
    name: 'Salumificio Nostrano del Borgo',
    slug: 'salumificio-nostrano-borgo',
    type: 'producer',
    city: 'Camporotondo',
    province: 'MC',
    region: 'Marche',
    destinationId: 1,
    description: 'Norcineria contadina artigianale che lavora carni suine 100% marchigiane da allevamento etico all\'aperto.',
    longDescription: 'Rinomato per la produzione del vero Ciauscolo Tradizionale IGP morbido e spalmabile, conciato solo con aglio pestato nel vino cotto, sale marino e pepe. Senza conservanti né glutine, stagionato con affumicatura naturale a legno di faggio.',
    coverImage: '/images/agriturismo-valle.jpg',
    basketName: 'Cesto Salumi Tradizione Marchigiana',
    basketDescription: 'Ciauscolo IGP morbido (500g), Lonza marchigiana stagionata a legna (600g) e Salamino lardellato tipico.',
    priceBasketCents: 4600,
    checkinCode: 'prod-salumificio-borgo',
    email: 'andrea@salumificionostrano.it',
    firstName: 'Andrea',
    lastName: 'Cappelletti',
  },
  {
    targetId: 16,
    name: 'Apicoltura Riviera delle Zagare',
    slug: 'apicoltura-zagare',
    type: 'producer',
    city: 'Numana',
    province: 'AN',
    region: 'Marche',
    destinationId: 1,
    description: 'Apicoltura biologica nomade con arnie collocate tra le fioriture spontanee del monte Conero e le colline dell\'Infinito.',
    longDescription: 'Mieli uniflorali purissimi estratti a freddo per centrifugazione, non pastorizzati per conservare intatti enzimi e proprietà benefiche. Un tributo all\'ecosistema e alla salvaguardia delle api.',
    coverImage: '/images/relais-langhe.jpg',
    basketName: 'Cesto Dolcezza del Conero',
    basketDescription: 'Tris di Mieli marchigiani bio (Acacia, Castagno, Girasole, 3x400g), Polline fresco deumidificato e Propoli pura spray.',
    priceBasketCents: 3200,
    checkinCode: 'prod-apicoltura-zagare',
    email: 'laura@apicolturazagare.it',
    firstName: 'Laura',
    lastName: 'Zannini',
  },
  {
    targetId: 17,
    name: 'Mulino & Pasta Artigianale di Montagna',
    slug: 'mulino-pasta-montagna',
    type: 'producer',
    city: 'Camerino',
    province: 'MC',
    region: 'Marche',
    destinationId: 1,
    description: 'Mulino a macine in pietra e pastificio che riscopre gli antichi grani autoctoni marchigiani Senatore Cappelli e Jervicella.',
    longDescription: 'Semole biologiche macinate lentamente per non surriscaldare il germe vitale del grano. Pasta trafilata al bronzo essiccata a bassissima temperatura per oltre 48 ore, altamente digeribile e ricca di proteine nobili.',
    coverImage: '/images/agriturismo-fontebella.jpg',
    basketName: 'Cesto Grani Antichi & Sughi KM 0',
    basketDescription: '4 Confezioni Pasta Senatore Cappelli (4x500g) + 2 Vasetti Sugo Marchigiano con pomodoro a pera e basilico fresco.',
    priceBasketCents: 3500,
    checkinCode: 'prod-mulino-montagna',
    email: 'roberto@mulinomontagna.it',
    firstName: 'Roberto',
    lastName: 'Mancini',
  },
];

console.log('--- Configurazione dei 6 Produttori Filiera Corta in radici.db ---');

// Rimuovi eventuale venue 18 extra
db.prepare('DELETE FROM venue_offerings WHERE venue_id = 18').run();
db.prepare('UPDATE users SET venue_id = NULL WHERE venue_id = 18').run();
db.prepare('DELETE FROM venues WHERE id = 18').run();

for (const p of producers) {
  // 1. Inserisci o aggiorna utente referente
  let user = db.prepare('SELECT id FROM users WHERE email = ?').get(p.email);
  if (!user) {
    const res = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, impact_points, badge_level, referral_code)
      VALUES (?, ?, ?, ?, 'provider', 5, 'Produttore Locale', ?)
    `).run(p.email, hashPassword('radici2026'), p.firstName, p.lastName, `ref-${p.slug}`);
    user = { id: res.lastInsertRowid };
  }

  // 2. Aggiorna o inserisce la venue
  const existingVenue = db.prepare('SELECT id FROM venues WHERE id = ? OR slug = ?').get(p.targetId, p.slug);
  let venueId = p.targetId;

  if (existingVenue) {
    venueId = existingVenue.id;
    db.prepare(`
      UPDATE venues SET
        name = ?, slug = ?, type = ?, destination_id = ?, city = ?, province = ?, region = ?,
        description = ?, long_description = ?, cover_image = ?,
        basket_name = ?, basket_description = ?, price_basket_cents = ?,
        checkin_code = ?, provider_user_id = ?, impact_points_generated = 2, local_support_percent = 20
      WHERE id = ?
    `).run(
      p.name, p.slug, p.type, p.destinationId, p.city, p.province, p.region,
      p.description, p.longDescription, p.coverImage,
      p.basketName, p.basketDescription, p.priceBasketCents,
      p.checkinCode, user.id, venueId
    );
  } else {
    const res = db.prepare(`
      INSERT INTO venues (
        name, slug, type, destination_id, city, province, region,
        description, long_description, lat, lng, cover_image,
        basket_name, basket_description, price_basket_cents,
        checkin_code, provider_user_id, impact_points_generated, local_support_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 43.5, 13.6, ?, ?, ?, ?, ?, ?, 2, 20)
    `).run(
      p.name, p.slug, p.type, p.destinationId, p.city, p.province, p.region,
      p.description, p.longDescription, p.coverImage,
      p.basketName, p.basketDescription, p.priceBasketCents,
      p.checkinCode, user.id
    );
    venueId = res.lastInsertRowid;
  }

  // Collega venue all'utente
  db.prepare('UPDATE users SET venue_id = ? WHERE id = ?').run(venueId, user.id);

  console.log(`✓ ID ${venueId} -> Produttore: ${p.name} (${p.city}) - Cesto: "${p.basketName}" (€ ${(p.priceBasketCents / 100).toFixed(2)})`);
}

db.close();
console.log('I 6 Produttori Filiera Corta sono pronti!');
