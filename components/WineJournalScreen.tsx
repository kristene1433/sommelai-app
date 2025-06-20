import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, EntryType } from '../types';

type BoolSetter = React.Dispatch<React.SetStateAction<boolean>>;
type StrSetter  = React.Dispatch<React.SetStateAction<string>>;
type RouteP     = RouteProp<RootStackParamList, 'WineJournal'>;

export default function WineJournalScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList, 'WineJournal'>
  >();
  const { params } = useRoute<RouteP>();
  const { userEmail, entry } = params;

  const isEdit = Boolean(entry?._id);
  const BASE   = 'https://sommelai-app-a743d57328f0.herokuapp.com';
  const URL    = isEdit ? `${BASE}/${entry!._id}` : `${BASE}/add`;
  const METHOD = isEdit ? 'PUT' : 'POST';

  // ...[State code unchanged, omitted for brevity]...

  // -- START state code
  const [wineName, setWineName]           = useState(entry?.wineName ?? '');
  const [vintage, setVintage]             = useState(entry?.vintage  ?? '');
  const [region, setRegion]               = useState(entry?.region   ?? '');
  const [producer, setProducer]           = useState(entry?.producer ?? '');
  const [varietals, setVarietals]         = useState(entry?.varietals?? '');
  const [price, setPrice]                 = useState(entry?.price    ?? '');
  const [alcoholPercent, setAlcoholPercent] = useState(entry?.alcoholPercent ?? '');
  const [servingTemp, setServingTemp]     = useState(entry?.servingTemp ?? '');
  const [dateTasted, setDateTasted]       = useState(entry?.dateTasted ?? '');
  const [whereWithWhom, setWhereWithWhom] = useState(entry?.whereWithWhom ?? '');
  const [rating, setRating]               = useState(entry?.rating ?? '');
  const [photoUrl, setPhotoUrl]           = useState(entry?.photoUrl ?? '');

  const [visualCollapsed, setVisualCollapsed]         = useState(true);
  const [noseCollapsed, setNoseCollapsed]             = useState(true);
  const [structureCollapsed, setStructureCollapsed]   = useState(true);
  const [conclusionCollapsed, setConclusionCollapsed] = useState(true);

  // Visual
  const [clarity, setClarity]               = useState(entry?.clarity ?? '');
  const [brightness, setBrightness]         = useState(entry?.brightness ?? '');
  const [colorIntensity, setColorIntensity] = useState(entry?.colorIntensity ?? '');
  const [hueRed, setHueRed]                 = useState(entry?.hueRed ?? '');
  const [hueWhite, setHueWhite]             = useState(entry?.hueWhite ?? '');
  const [viscosity, setViscosity]           = useState(entry?.viscosity ?? '');

  const [clarityOpen, setClarityOpen]                     = useState(false);
  const [brightnessOpen, setBrightnessOpen]               = useState(false);
  const [colorIntensityOpen, setColorIntensityOpen]       = useState(false);
  const [hueRedOpen, setHueRedOpen]                       = useState(false);
  const [hueWhiteOpen, setHueWhiteOpen]                   = useState(false);
  const [viscosityOpen, setViscosityOpen]                 = useState(false);

  // Nose & Palate
  const [aromaIntensity, setAromaIntensity] = useState(entry?.aromaIntensity ?? '');
  const [primaryAroma, setPrimaryAroma]     = useState(entry?.primaryAroma ?? '');
  const [secondaryAroma, setSecondaryAroma] = useState(entry?.secondaryAroma ?? '');
  const [tertiaryAroma, setTertiaryAroma]   = useState(entry?.tertiaryAroma ?? '');
  const [fruitCharacter, setFruitCharacter] = useState(entry?.fruitCharacter ?? '');
  const [nonFruitNotes, setNonFruitNotes]   = useState(entry?.nonFruitNotes ?? '');

  const [aromaIntensityOpen, setAromaIntensityOpen] = useState(false);
  const [primaryAromaOpen, setPrimaryAromaOpen]     = useState(false);
  const [secondaryAromaOpen, setSecondaryAromaOpen] = useState(false);
  const [tertiaryAromaOpen, setTertiaryAromaOpen]   = useState(false);
  const [fruitCharacterOpen, setFruitCharacterOpen] = useState(false);
  const [nonFruitNotesOpen, setNonFruitNotesOpen]   = useState(false);

  // Structure
  const [sweetness, setSweetness]         = useState(entry?.sweetness ?? '');
  const [acidity, setAcidity]             = useState(entry?.acidity ?? '');
  const [tannin, setTannin]               = useState(entry?.tannin ?? '');
  const [alcoholLevel, setAlcoholLevel]   = useState(entry?.alcoholLevel ?? '');
  const [body, setBody]                   = useState(entry?.body ?? '');
  const [texture, setTexture]             = useState(entry?.texture ?? '');
  const [balance, setBalance]             = useState(entry?.balance ?? '');
  const [finish, setFinish]               = useState(entry?.finish ?? '');

  const [sweetnessOpen, setSweetnessOpen]           = useState(false);
  const [acidityOpen, setAcidityOpen]               = useState(false);
  const [tanninOpen, setTanninOpen]                 = useState(false);
  const [alcoholLevelOpen, setAlcoholLevelOpen]     = useState(false);
  const [bodyOpen, setBodyOpen]                     = useState(false);
  const [textureOpen, setTextureOpen]               = useState(false);
  const [balanceOpen, setBalanceOpen]               = useState(false);
  const [finishOpen, setFinishOpen]                 = useState(false);

  // Conclusion
  const [qualityLevel, setQualityLevel] = useState(entry?.qualityLevel ?? '');
  const [readiness, setReadiness]       = useState(entry?.readiness ?? '');
  const [agePotential, setAgePotential] = useState(entry?.agePotential ?? '');
  const [grapeGuess, setGrapeGuess]     = useState(entry?.grapeGuess ?? '');
  const [originGuess, setOriginGuess]   = useState(entry?.originGuess ?? '');

  const [qualityLevelOpen, setQualityLevelOpen] = useState(false);
  const [readinessOpen, setReadinessOpen]       = useState(false);
  const [agePotentialOpen, setAgePotentialOpen] = useState(false);
  // -- END state code

  // Dropdown renderer
  const dropdown = (
    label: string,
    open: boolean,
    setOpen: BoolSetter,
    value: string,
    setValue: StrSetter,
    options: string[]
  ) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <DropDownPicker
        open={open}
        value={value}
        items={options.map((o) => ({ label: o, value: o }))}
        setOpen={setOpen}
        setValue={setValue}
        placeholder={`Select ${label}`}
        dropDownDirection="BOTTOM"
        style={{
          marginBottom: open ? 220 : 20,
          borderColor: '#D3C4B0',
          backgroundColor: '#F6F4ED',
        }}
        textStyle={{ fontSize: 15, color: '#5E5C49' }}
        dropDownContainerStyle={{ borderColor: '#D3C4B0', backgroundColor: '#F2E9DF' }}
      />
    </View>
  );

  // Image picker
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.length) setPhotoUrl(res.assets[0].uri);
  };

  const saveToServer = async (): Promise<EntryType | null> => {
    const data: EntryType = {
      userEmail,
      wineName, vintage, region, producer, varietals, price,
      alcoholPercent, servingTemp, dateTasted, whereWithWhom, rating, photoUrl,
      clarity, brightness, colorIntensity, hueRed, hueWhite, viscosity,
      aromaIntensity, primaryAroma, secondaryAroma, tertiaryAroma,
      fruitCharacter, nonFruitNotes,
      sweetness, acidity, tannin, alcoholLevel, body,
      texture, balance, finish,
      qualityLevel, readiness, agePotential, grapeGuess, originGuess,
    };
    try {
      const res  = await fetch(URL, {
        method: METHOD,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert('Error', json.error || 'Failed to save');
        return null;
      }
      return json as EntryType;
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network issue');
      return null;
    }
  };

  const handleSave = async () => {
    const saved = await saveToServer();
    if (saved) {
      Alert.alert('Success', isEdit ? 'Entry updated' : 'Entry saved');
      navigation.navigate('ReviewEntry', { entry: saved });
    }
  };

  const handleBlind = async () => {
    const saved = await saveToServer();
    if (saved) navigation.navigate('BlindTasting', { entry: saved });
  };

  return (
    <View style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {isEdit ? '✏️ Edit Entry' : '🍇 New Wine Journal'}
          </Text>
          {/* quick inputs */}
          {([
            ['Wine Name', wineName, setWineName],
            ['Vintage', vintage, setVintage],
            ['Region / Country', region, setRegion],
            ['Producer', producer, setProducer],
            ['Varietal(s)', varietals, setVarietals],
            ['Price / Value', price, setPrice],
            ['Alcohol %', alcoholPercent, setAlcoholPercent],
            ['Serving Temperature', servingTemp, setServingTemp],
            ['Date Tasted', dateTasted, setDateTasted],
            ['Where Tasted / With Whom', whereWithWhom, setWhereWithWhom],
            ['Rating (1–5)', rating, setRating],
          ] as [string, string, StrSetter][]).map(([ph, val, setter], i) => (
            <TextInput
              key={i}
              style={styles.input}
              placeholder={ph}
              value={val}
              onChangeText={setter}
              placeholderTextColor="#A9B09F"
            />
          ))}

          {/* Collapsible sections */}
          <TouchableOpacity onPress={() => setVisualCollapsed((c) => !c)}>
            <Text style={styles.section}>
              🟥 Visual {visualCollapsed ? '▼' : '▲'}
            </Text>
          </TouchableOpacity>
          {!visualCollapsed && (
            <View>
              {dropdown('Clarity', clarityOpen, setClarityOpen, clarity, setClarity, [
                'Clear', 'Slight Haze', 'Murky',
              ])}
              {dropdown('Brightness', brightnessOpen, setBrightnessOpen, brightness, setBrightness,
                ['Dull', 'Bright', 'Day Bright', 'Star Bright', 'Brilliant'])}
              {dropdown('Color Intensity', colorIntensityOpen, setColorIntensityOpen, colorIntensity, setColorIntensity,
                ['Low', 'Medium-Minus', 'Medium', 'Medium-Plus', 'High'])}
              {dropdown('Hue (Red)', hueRedOpen, setHueRedOpen, hueRed, setHueRed,
                ['Garnet', 'Ruby', 'Purple'])}
              {dropdown('Hue (White)', hueWhiteOpen, setHueWhiteOpen, hueWhite, setHueWhite,
                ['Straw', 'Yellow', 'Gold'])}
              {dropdown('Viscosity', viscosityOpen, setViscosityOpen, viscosity, setViscosity,
                ['Low', 'Medium', 'High'])}
            </View>
          )}

          <TouchableOpacity onPress={() => setNoseCollapsed((c) => !c)}>
            <Text style={styles.section}>
              🟨 Nose & Palate {noseCollapsed ? '▼' : '▲'}
            </Text>
          </TouchableOpacity>
          {!noseCollapsed && (
            <View>
              {dropdown('Aroma Intensity', aromaIntensityOpen, setAromaIntensityOpen, aromaIntensity, setAromaIntensity,
                ['Low', 'Medium', 'High'])}
              {dropdown('Primary Aroma', primaryAromaOpen, setPrimaryAromaOpen, primaryAroma, setPrimaryAroma,
                ['Fruit', 'Floral', 'Herbal', 'Spice'])}
              {dropdown('Secondary Aroma', secondaryAromaOpen, setSecondaryAromaOpen, secondaryAroma, setSecondaryAroma,
                ['Yeast', 'Butter', 'Cream', 'Nutty'])}
              {dropdown('Tertiary Aroma', tertiaryAromaOpen, setTertiaryAromaOpen, tertiaryAroma, setTertiaryAroma,
                ['Oak', 'Vanilla', 'Tobacco', 'Leather', 'Earth'])}
              {dropdown('Fruit Character', fruitCharacterOpen, setFruitCharacterOpen, fruitCharacter, setFruitCharacter,
                ['Red Fruit', 'Black Fruit', 'Dried Fruit', 'Citrus', 'Tropical'])}
              {dropdown('Non-Fruit Notes', nonFruitNotesOpen, setNonFruitNotesOpen, nonFruitNotes, setNonFruitNotes,
                ['Mineral', 'Vegetal', 'Floral', 'Spice', 'Oak', 'Herbaceous'])}
            </View>
          )}

          <TouchableOpacity onPress={() => setStructureCollapsed((c) => !c)}>
            <Text style={styles.section}>
              🟩 Structure {structureCollapsed ? '▼' : '▲'}
            </Text>
          </TouchableOpacity>
          {!structureCollapsed && (
            <View>
              {dropdown('Sweetness', sweetnessOpen, setSweetnessOpen, sweetness, setSweetness,
                ['Dry', 'Off-Dry', 'Medium', 'Sweet'])}
              {dropdown('Acidity', acidityOpen, setAcidityOpen, acidity, setAcidity,
                ['Low', 'Medium', 'High'])}
              {dropdown('Tannin', tanninOpen, setTanninOpen, tannin, setTannin,
                ['Low', 'Medium', 'High'])}
              {dropdown('Alcohol Level', alcoholLevelOpen, setAlcoholLevelOpen, alcoholLevel, setAlcoholLevel,
                ['Low', 'Medium', 'High'])}
              {dropdown('Body', bodyOpen, setBodyOpen, body, setBody,
                ['Light', 'Medium', 'Full'])}
              {dropdown('Texture', textureOpen, setTextureOpen, texture, setTexture,
                ['Silky', 'Velvety', 'Rough', 'Astringent'])}
              {dropdown('Balance', balanceOpen, setBalanceOpen, balance, setBalance,
                ['Harmonious', 'Unbalanced'])}
              {dropdown('Finish', finishOpen, setFinishOpen, finish, setFinish,
                ['Short', 'Medium', 'Long'])}
            </View>
          )}

          <TouchableOpacity onPress={() => setConclusionCollapsed((c) => !c)}>
            <Text style={styles.section}>
              🟦 Conclusion {conclusionCollapsed ? '▼' : '▲'}
            </Text>
          </TouchableOpacity>
          {!conclusionCollapsed && (
            <View>
              {dropdown('Quality Level', qualityLevelOpen, setQualityLevelOpen, qualityLevel, setQualityLevel,
                ['Poor', 'Acceptable', 'Good', 'Very Good', 'Outstanding'])}
              {dropdown('Readiness', readinessOpen, setReadinessOpen, readiness, setReadiness,
                ['Too Young', 'Can Drink Now', 'Drink Now', 'Too Old'])}
              {dropdown('Age Potential', agePotentialOpen, setAgePotentialOpen, agePotential, setAgePotential,
                ['Low', 'Medium', 'High'])}
              <TextInput
                style={styles.input}
                placeholder="Grape Guess (optional)"
                value={grapeGuess}
                onChangeText={setGrapeGuess}
                placeholderTextColor="#A9B09F"
              />
              <TextInput
                style={styles.input}
                placeholder="Origin Guess (optional)"
                value={originGuess}
                onChangeText={setOriginGuess}
                placeholderTextColor="#A9B09F"
              />
            </View>
          )}

          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Text style={{ color: '#A68262', fontWeight: '600' }}>
              📸 Upload Bottle Photo
            </Text>
          </TouchableOpacity>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: '100%', height: 200, borderRadius: 14, marginVertical: 10 }}
            />
          ) : null}

          <Pressable style={styles.buttonPrimary} onPress={handleSave}>
            <Text style={styles.buttonText}>✅ Save Entry</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={handleBlind}>
            <Text style={styles.buttonText}>🕶 Blind Tasting</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#F7F5EF', // sand/linen
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 6,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FAF8F4',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#A68262',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B7C5A', // olive-brown
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  section: {
    fontSize: 19,
    fontWeight: '700',
    marginTop: 22,
    marginBottom: 10,
    color: '#B1624E', // terracotta
    textShadowColor: '#EFE6DC',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    color: '#5E5C49', // dark taupe
  },
  input: {
    borderWidth: 1,
    borderColor: '#D3C4B0',
    borderRadius: 12,
    padding: 11,
    fontSize: 16,
    backgroundColor: '#F6F4ED',
    marginBottom: 7,
    color: '#5E5C49',
  },
  uploadBtn: {
    marginVertical: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D3C4B0',
    borderRadius: 13,
    alignItems: 'center',
    backgroundColor: '#F6F4ED',
    elevation: 1,
    shadowColor: '#D3C4B0',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  buttonPrimary: {
    backgroundColor: '#8B7C5A',
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#A68262',
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  buttonSecondary: {
    backgroundColor: '#B1624E',
    padding: 14,
    borderRadius: 13,
    alignItems: 'center',
    marginVertical: 3,
    borderWidth: 1,
    borderColor: '#D3C4B0',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.1,
  },
});

