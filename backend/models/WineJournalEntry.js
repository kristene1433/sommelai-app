const mongoose = require('mongoose');

/* helper – run regex only if value is present */
const emailValidator = (v) =>
  v === undefined || v === '' || /^\S+@\S+\.\S+$/.test(v);

const WineJournalEntrySchema = new mongoose.Schema({
  /* ------- core (all optional now) ------- */
  userEmail: {
    type: String,
    validate: { validator: emailValidator, message: 'Invalid e-mail' },
  },
  wineName:  { type: String, trim: true },

  vintage:   String,
  region:    String,
  producer:  String,
  varietals: String,
  price:     String,
  alcoholPercent: String,
  servingTemp:    String,
  dateTasted:     String,
  whereWithWhom:  String,
  rating:   String,
  photoUrl: String,

  /* ------- visual ------- */
  clarity:        String,
  brightness:     String,
  colorIntensity: String,
  hueRed:         String,
  hueWhite:       String,
  viscosity:      String,

  /* ------- nose & palate ------- */
  aromaIntensity: String,
  primaryAroma:   String,
  secondaryAroma: String,
  tertiaryAroma:  String,
  fruitCharacter: String,
  nonFruitNotes:  String,

  /* ------- structure ------- */
  sweetness:     String,
  acidity:       String,
  tannin:        String,
  alcoholLevel:  String,
  body:          String,
  texture:       String,
  balance:       String,
  finish:        String,

  /* ------- conclusion ------- */
  qualityLevel:  String,
  readiness:     String,
  agePotential:  String,
  grapeGuess:    String,
  originGuess:   String,

  dateLogged: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WineJournalEntry', WineJournalEntrySchema);
