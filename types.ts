export type EntryType = {
  _id?: string;
  userEmail: string;
  wineName: string;
  producer: string;
  varietals: string;
  dateTasted?: string; // add this if used
  subregion: string;
  region: string;
  country: string;
  vintage: string;

  clarity: string;
  brightness: string;
  colorIntensity: string;
  hueRed: string;
  hueWhite: string;
  hueRose: string;
  viscosity: string;

  aromaIntensity: string;
  primaryAroma: string;    // comma-separated string of selected aromas
  secondaryAroma: string;  // comma-separated string of selected aromas
  tertiaryAroma: string;   // comma-separated string of selected aromas
  condition: string;       // e.g. Clean, Off, Corked, Oxidized

  sweetness: string;
  acidity: string;
  tannin: string;
  alcoholLevel: string;
  body: string;
  flavorIntensity: string; // e.g. Light, Medium, Pronounced
  finish: string;          // e.g. Short, Medium, Long

  qualityLevel: string;
  readiness: string;
  agePotential: string;
  grapeGuess: string;
  originGuess: string;

  photoUrl: string;
};

export type RootStackParamList = {
  JournalList: { userEmail: string };
  WineJournal: { userEmail: string; entry?: EntryType };
  ReviewEntry: { entry: EntryType };
  BlindTasting: { entry: EntryType };
};
