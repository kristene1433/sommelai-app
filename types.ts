

  export type EntryType = {
    _id?: string;
    userEmail: string;
    wineName: string;
    vintage: string;
    region: string;
    producer: string;
    varietals: string;
    price: string;
    alcoholPercent: string;
    servingTemp: string;
    dateTasted: string;
    whereWithWhom: string;
  
    clarity: string;
    brightness: string;
    colorIntensity: string;
    hueRed: string;
    hueWhite: string;
    viscosity: string;
  
    aromaIntensity: string;
    primaryAroma: string;
    secondaryAroma: string;
    tertiaryAroma: string;
    fruitCharacter: string;
    nonFruitNotes: string;
  
    sweetness: string;
    acidity: string;
    tannin: string;
    alcoholLevel: string;
    body: string;
    texture: string;
    balance: string;
    finish: string;
  
    qualityLevel: string;
    readiness: string;
    agePotential: string;
    grapeGuess: string;
    originGuess: string;
  
    photoUrl: string;
    rating: string;
  };

  export type RootStackParamList = {
    JournalList: { userEmail: string };
    WineJournal: { userEmail: string; entry?: EntryType };
    ReviewEntry: { entry: EntryType };
    BlindTasting: { entry: EntryType };
  };
  
  
  
  