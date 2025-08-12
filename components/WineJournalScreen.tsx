// WineJournalScreen.tsx
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
type StrSetter = React.Dispatch<React.SetStateAction<string>>;
type RouteP = RouteProp<RootStackParamList, 'WineJournal'>;

const AromaChip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      selected ? styles.chipSelected : styles.chipUnselected,
    ]}
  >
    <Text style={selected ? styles.chipTextSelected : styles.chipTextUnselected}>
      {label}
    </Text>
  </TouchableOpacity>
);

const getTodayDate = () => {
  const d = new Date();
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function WineJournalScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList, 'WineJournal'>
  >();
  const { params } = useRoute<RouteP>();
  const { userEmail, entry } = params;

  const isEdit = Boolean(entry?._id);

  // *** UPDATED BASE URL to include /api/journal ***
  const BASE = 'https://sommelai-app-a743d57328f0.herokuapp.com/api/journal';
  const URL = isEdit ? `${BASE}/${entry!._id}` : `${BASE}/add`;
  const METHOD = isEdit ? 'PUT' : 'POST';

  // Collapsible states
  const [noseCollapsed, setNoseCollapsed] = useState(true);
  const [wineInfoCollapsed, setWineInfoCollapsed] = useState(false);
  const [visualCollapsed, setVisualCollapsed] = useState(true);
  const [structureCollapsed, setStructureCollapsed] = useState(true);
  const [conclusionCollapsed, setConclusionCollapsed] = useState(true);

  // Wine info fields
  const [producer, setProducer] = useState(entry?.producer ?? '');
  const [wineName, setWineName] = useState(entry?.wineName ?? '');
  const [varietals, setVarietals] = useState(entry?.varietals ?? '');
  const [subregion, setSubregion] = useState(entry?.subregion ?? '');
  const [region, setRegion] = useState(entry?.region ?? '');
  const [country, setCountry] = useState(entry?.country ?? '');
  const [vintage, setVintage] = useState(entry?.vintage ?? '');
  const [dateTasted, setDateTasted] = useState(entry?.dateTasted ?? '');  // NEW: dateTasted state
  const [photoUrl, setPhotoUrl] = useState(entry?.photoUrl ?? '');

  // Visual states
  const [clarity, setClarity] = useState(entry?.clarity ?? '');
  const [brightness, setBrightness] = useState(entry?.brightness ?? '');
  const [colorIntensity, setColorIntensity] = useState(entry?.colorIntensity ?? '');
  const [hueRed, setHueRed] = useState(entry?.hueRed ?? '');
  const [hueWhite, setHueWhite] = useState(entry?.hueWhite ?? '');
  const [hueRose, setHueRose] = useState(entry?.hueRose ?? '');
  const [viscosity, setViscosity] = useState(entry?.viscosity ?? '');

  // Visual dropdown open states
  const [clarityOpen, setClarityOpen] = useState(false);
  const [brightnessOpen, setBrightnessOpen] = useState(false);
  const [colorIntensityOpen, setColorIntensityOpen] = useState(false);
  const [hueRedOpen, setHueRedOpen] = useState(false);
  const [hueWhiteOpen, setHueWhiteOpen] = useState(false);
  const [hueRoseOpen, setHueRoseOpen] = useState(false);
  const [viscosityOpen, setViscosityOpen] = useState(false);

  // Nose & Palate - aroma intensity dropdown
  const [aromaIntensity, setAromaIntensity] = useState(entry?.aromaIntensity ?? '');
  const [aromaIntensityOpen, setAromaIntensityOpen] = useState(false);

  // NEW Condition dropdown in Nose
  const [condition, setCondition] = useState(entry?.condition ?? '');
  const [conditionOpen, setConditionOpen] = useState(false);

  // Structure (now Palate) states
  const [sweetness, setSweetness] = useState(entry?.sweetness ?? '');
  const [sweetnessOpen, setSweetnessOpen] = useState(false);

  const [acidity, setAcidity] = useState(entry?.acidity ?? '');
  const [acidityOpen, setAcidityOpen] = useState(false);

  const [tannin, setTannin] = useState(entry?.tannin ?? '');
  const [tanninOpen, setTanninOpen] = useState(false);

  const [alcoholLevel, setAlcoholLevel] = useState(entry?.alcoholLevel ?? '');
  const [alcoholLevelOpen, setAlcoholLevelOpen] = useState(false);

  const [body, setBody] = useState(entry?.body ?? '');
  const [bodyOpen, setBodyOpen] = useState(false);

  // NEW Flavor Intensity dropdown
  const [flavorIntensity, setFlavorIntensity] = useState(entry?.flavorIntensity ?? '');
  const [flavorIntensityOpen, setFlavorIntensityOpen] = useState(false);

  // NEW Finish dropdown
  const [finish, setFinish] = useState(entry?.finish ?? '');
  const [finishOpen, setFinishOpen] = useState(false);

  // Conclusion states
  const [qualityLevel, setQualityLevel] = useState(entry?.qualityLevel ?? '');
  const [qualityLevelOpen, setQualityLevelOpen] = useState(false);

  const [readiness, setReadiness] = useState(entry?.readiness ?? '');
  const [readinessOpen, setReadinessOpen] = useState(false);

  const [agePotential, setAgePotential] = useState(entry?.agePotential ?? '');
  const [agePotentialOpen, setAgePotentialOpen] = useState(false);

  const [grapeGuess, setGrapeGuess] = useState(entry?.grapeGuess ?? '');
  const [originGuess, setOriginGuess] = useState(entry?.originGuess ?? '');

  // Aroma chips data grouped by category
  const primaryAromas = [
    'Cherry', 'Strawberry', 'Raspberry', 'Cranberry', 'Pomegranate',
    'Blackberry', 'Blackcurrant', 'Plum', 'Blueberry', 'Black Cherry',
    'Peach', 'Apricot', 'Nectarine',
    'Lemon', 'Lime', 'Grapefruit', 'Orange Peel',
    'Pineapple', 'Mango', 'Passionfruit', 'Banana',
    'Raisin', 'Fig', 'Prune',
    'Rose', 'Violet', 'Lavender', 'Elderflower', 'Orange Blossom', 'Honeysuckle', 'Jasmine',
    'Grass', 'Green Bell Pepper', 'Eucalyptus', 'Mint', 'Thyme', 'Sage', 'Dill', 'Fennel', 'Bay Leaf',
    'Black Pepper', 'White Pepper', 'Clove', 'Cinnamon', 'Nutmeg', 'Anise'
  ];

  const secondaryAromas = [
    'Bread Dough', 'Brioche', 'Yeast', 'Biscuit', 'Cream', 'Butter',
    'Vanilla', 'Toast', 'Smoke', 'Cedar', 'Coconut', 'Cloves', 'Dill', 'Mocha', 'Caramel',
    'Buttery', 'Creamy', 'Buttery Popcorn',
    'Almond', 'Hazelnut', 'Parmesan', 'Spicy Oak'
  ];

  const tertiaryAromas = [
    'Walnut', 'Almond', 'Caramel', 'Toffee', 'Dried Fig', 'Honey',
    'Leather', 'Tobacco', 'Cigar Box', 'Forest Floor', 'Mushroom', 'Truffle', 'Wet Leaves', 'Moss',
    'Cedar', 'Pencil Shavings', 'Smoke', 'Clove', 'Cinnamon',
    'Tobacco', 'Graphite', 'Balsam', 'Medicinal', 'Iodine', 'Mineral', 'Petrol'
  ];

  // Helper to toggle aroma selection in array
  const toggleAroma = (aroma: string, selectedList: string[], setSelectedList: (list: string[]) => void) => {
    if (selectedList.includes(aroma)) {
      setSelectedList(selectedList.filter((a) => a !== aroma));
    } else {
      setSelectedList([...selectedList, aroma]);
    }
  };

  // State arrays for selected aromas
  const [selectedPrimaryAromas, setSelectedPrimaryAromas] = useState<string[]>(entry?.primaryAroma ? entry.primaryAroma.split(', ') : []);
  const [selectedSecondaryAromas, setSelectedSecondaryAromas] = useState<string[]>(entry?.secondaryAroma ? entry.secondaryAroma.split(', ') : []);
  const [selectedTertiaryAromas, setSelectedTertiaryAromas] = useState<string[]>(entry?.tertiaryAroma ? entry.tertiaryAroma.split(', ') : []);

  // Save selected aromas back as comma strings
  const primaryAroma = selectedPrimaryAromas.join(', ');
  const secondaryAroma = selectedSecondaryAromas.join(', ');
  const tertiaryAroma = selectedTertiaryAromas.join(', ');

  // Dropdown component reused for other dropdowns
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
          borderColor: '#404040', // Medium gray border
          backgroundColor: '#2A2A2A', // Dark background
        }}
        textStyle={{ fontSize: 15, color: '#E0E0E0' }} // Light gray text
        dropDownContainerStyle={{ borderColor: '#404040', backgroundColor: '#2A2A2A' }} // Medium gray border
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

  // *** Updated saveToServer with logging ***
  const saveToServer = async (): Promise<EntryType | null> => {
    const data: EntryType = {
      userEmail,
      producer,
      wineName,
      varietals,
      subregion,
      region,
      country,
      vintage,
      dateTasted,             // <-- NEW added here
      photoUrl,
      clarity,
      brightness,
      colorIntensity,
      hueRed,
      hueWhite,
      hueRose,
      viscosity,
      aromaIntensity,
      primaryAroma,
      secondaryAroma,
      tertiaryAroma,
      condition,
      sweetness,
      acidity,
      tannin,
      alcoholLevel,
      body,
      flavorIntensity,
      finish,
      qualityLevel,
      readiness,
      agePotential,
      grapeGuess,
      originGuess,
    };

    console.log('Saving entry data:', data);

    try {
      const res = await fetch(URL, {
        method: METHOD,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const text = await res.text();
      console.log('Response status:', res.status);
      console.log('Response text:', text);

      const json = JSON.parse(text);

      if (!res.ok) {
        Alert.alert('Error', json.error || 'Failed to save');
        return null;
      }
      return json as EntryType;
    } catch (err) {
      console.error('Network error:', err);
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
          <Text style={styles.title}>{isEdit ? '✏️ Edit Entry' : '🍇 New Wine Journal'}</Text>

          {/* Show Today's Date */}
          <View style={{ marginBottom: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#B8B8B8', letterSpacing: 0.2 }}>
              {`Today: ${getTodayDate()}`}
            </Text>
          </View>

          {/* Collapsible Wine Information */}
          <TouchableOpacity onPress={() => setWineInfoCollapsed((c) => !c)}>
            <Text style={styles.sectionTitle}>🍷 Wine Information {wineInfoCollapsed ? '▼' : '▲'}</Text>
          </TouchableOpacity>
          {!wineInfoCollapsed && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Producer"
                value={producer}
                onChangeText={setProducer}
                placeholderTextColor="#B8B8B8"
              />
              <TextInput
                style={styles.input}
                placeholder="Wine Name / Classification"
                value={wineName}
                onChangeText={setWineName}
                placeholderTextColor="#B8B8B8"
              />
              <TextInput
                style={styles.input}
                placeholder="Varietal(s)"
                value={varietals}
                onChangeText={setVarietals}
                placeholderTextColor="#B8B8B8"
              />
              <TextInput
                style={styles.input}
                placeholder="Subregion"
                value={subregion}
                onChangeText={setSubregion}
                placeholderTextColor="#B8B8B8"
              />
              <TextInput
                style={styles.input}
                placeholder="Region"
                value={region}
                onChangeText={setRegion}
                placeholderTextColor="#B8B8B8"
              />
              <TextInput
                style={styles.input}
                placeholder="Country"
                value={country}
                onChangeText={setCountry}
                placeholderTextColor="#B8B8B8"
              />
              <TextInput
                style={styles.input}
                placeholder="Vintage"
                value={vintage}
                onChangeText={setVintage}
                placeholderTextColor="#B8B8B8"
              />
              {/* New Date Tasted input */}
              <TextInput
                style={styles.input}
                placeholder="Date Tasted (YYYY-MM-DD)"
                value={dateTasted}
                onChangeText={setDateTasted}
                placeholderTextColor="#B8B8B8"
              />
            </View>
          )}

          {/* Visual Section */}
          <TouchableOpacity onPress={() => setVisualCollapsed((c) => !c)}>
            <Text style={styles.sectionTitle}>🟥 Visual {visualCollapsed ? '▼' : '▲'}</Text>
          </TouchableOpacity>
          {!visualCollapsed && (
            <View>
              {dropdown('Clarity', clarityOpen, setClarityOpen, clarity, setClarity, ['Clear', 'Slight Haze', 'Murky'])}
              {dropdown(
                'Brightness',
                brightnessOpen,
                setBrightnessOpen,
                brightness,
                setBrightness,
                ['Dull', 'Bright', 'Day Bright', 'Star Bright', 'Brilliant']
              )}
              {dropdown('Color Intensity', colorIntensityOpen, setColorIntensityOpen, colorIntensity, setColorIntensity, [
                'Pale',
                'Medium',
                'Deep',
              ])}
              {dropdown('Hue (Red)', hueRedOpen, setHueRedOpen, hueRed, setHueRed, ['Purple', 'Garnet', 'Ruby', 'Tawny', 'Brown'])}
              {dropdown(
                'Hue (White)',
                hueWhiteOpen,
                setHueWhiteOpen,
                hueWhite,
                setHueWhite,
                ['Straw', 'Yellow', 'Gold', 'Amber', 'Brown']
              )}
              {dropdown('Hue (Rose)', hueRoseOpen, setHueRoseOpen, hueRose, setHueRose, ['Pink', 'Salmon', 'Copper'])}
              {dropdown('Viscosity', viscosityOpen, setViscosityOpen, viscosity, setViscosity, ['Low', 'Medium', 'High'])}
            </View>
          )}

          {/* Nose (Aroma & Bouquet) Section */}
          <TouchableOpacity onPress={() => setNoseCollapsed((c) => !c)}>
            <Text style={styles.sectionTitle}>🟨 Nose (Aroma & Bouquet) {noseCollapsed ? '▼' : '▲'}</Text>
          </TouchableOpacity>
          {!noseCollapsed && (
            <View>
              {/* Aroma Intensity */}
              {dropdown(
                'Aroma Intensity',
                aromaIntensityOpen,
                setAromaIntensityOpen,
                aromaIntensity,
                setAromaIntensity,
                ['Low', 'Medium', 'High']
              )}

              {/* Condition */}
              {dropdown(
                'Condition',
                conditionOpen,
                setConditionOpen,
                condition,
                setCondition,
                ['Clean', 'Off', 'Corked', 'Oxidized']
              )}

              {/* Primary Aromas Chips */}
              <Text style={styles.label}>Primary Aromas</Text>
              <View style={styles.chipContainer}>
                {primaryAromas.map((aroma) => (
                  <AromaChip
                    key={aroma}
                    label={aroma}
                    selected={selectedPrimaryAromas.includes(aroma)}
                    onPress={() => toggleAroma(aroma, selectedPrimaryAromas, setSelectedPrimaryAromas)}
                  />
                ))}
              </View>

              {/* Secondary Aromas Chips */}
              <Text style={styles.label}>Secondary Aromas</Text>
              <View style={styles.chipContainer}>
                {secondaryAromas.map((aroma) => (
                  <AromaChip
                    key={aroma}
                    label={aroma}
                    selected={selectedSecondaryAromas.includes(aroma)}
                    onPress={() => toggleAroma(aroma, selectedSecondaryAromas, setSelectedSecondaryAromas)}
                  />
                ))}
              </View>

              {/* Tertiary Aromas Chips */}
              <Text style={styles.label}>Tertiary Aromas</Text>
              <View style={styles.chipContainer}>
                {tertiaryAromas.map((aroma) => (
                  <AromaChip
                    key={aroma}
                    label={aroma}
                    selected={selectedTertiaryAromas.includes(aroma)}
                    onPress={() => toggleAroma(aroma, selectedTertiaryAromas, setSelectedTertiaryAromas)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Palate (Taste & Texture) Section */}
          <TouchableOpacity onPress={() => setStructureCollapsed((c) => !c)}>
            <Text style={styles.sectionTitle}>🟩 Palate (Taste & Texture) {structureCollapsed ? '▼' : '▲'}</Text>
          </TouchableOpacity>
          {!structureCollapsed && (
            <View>
              {dropdown('Body', bodyOpen, setBodyOpen, body, setBody, ['Low', 'Med -', 'Med', 'Med +', 'High'])}
              {dropdown('Tannin', tanninOpen, setTanninOpen, tannin, setTannin, ['Low', 'Med -', 'Med', 'Med +', 'High'])}
              {dropdown('Acidity', acidityOpen, setAcidityOpen, acidity, setAcidity, ['Low', 'Med -', 'Med', 'Med +', 'High'])}
              {dropdown('Alcohol Level', alcoholLevelOpen, setAlcoholLevelOpen, alcoholLevel, setAlcoholLevel, [
                'Low',
                'Med -',
                'Med',
                'Med +',
                'High',
              ])}
              {dropdown('Sweetness', sweetnessOpen, setSweetnessOpen, sweetness, setSweetness, [
                'Dry',
                'Off-Dry',
                'Medium Sweet',
                'Sweet',
              ])}
              {dropdown('Flavor Intensity', flavorIntensityOpen, setFlavorIntensityOpen, flavorIntensity, setFlavorIntensity, [
                'Light',
                'Medium',
                'Pronounced',
              ])}
              {dropdown('Finish', finishOpen, setFinishOpen, finish, setFinish, ['Short', 'Medium', 'Long'])}
            </View>
          )}

          {/* Conclusion Section */}
          <TouchableOpacity onPress={() => setConclusionCollapsed((c) => !c)}>
            <Text style={styles.sectionTitle}>🟦 Conclusion {conclusionCollapsed ? '▼' : '▲'}</Text>
          </TouchableOpacity>
          {!conclusionCollapsed && (
            <View>
              {dropdown(
                'Quality Level',
                qualityLevelOpen,
                setQualityLevelOpen,
                qualityLevel,
                setQualityLevel,
                ['Poor', 'Acceptable', 'Good', 'Very Good', 'Outstanding']
              )}
              {dropdown('Readiness', readinessOpen, setReadinessOpen, readiness, setReadiness, [
                'Too Young',
                'Can Drink Now',
                'Drink Now',
                'Too Old',
              ])}
              {dropdown('Age Potential', agePotentialOpen, setAgePotentialOpen, agePotential, setAgePotential, [
                'Low',
                'Medium',
                'High',
              ])}
              <TextInput
                style={styles.input}
                placeholder="Grape Guess (optional)"
                value={grapeGuess}
                onChangeText={setGrapeGuess}
                placeholderTextColor="#B8B8B8"
              />
              <TextInput
                style={styles.input}
                placeholder="Origin Guess (optional)"
                value={originGuess}
                onChangeText={setOriginGuess}
                placeholderTextColor="#B8B8B8"
              />
            </View>
          )}

          {/* Upload Bottle Photo */}
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Text style={{ color: '#B8B8B8', fontWeight: '600' }}>📸 Upload Bottle Photo</Text>
          </TouchableOpacity>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: '100%', height: 200, borderRadius: 14, marginVertical: 10 }}
            />
          ) : null}

          {/* Save & Blind Tasting Buttons */}
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
    backgroundColor: '#0A0A0A', // Very dark charcoal background
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
    maxWidth: 430,
    backgroundColor: '#1E1E1E', // Dark slate
    borderRadius: 24,
    padding: 26,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A', // Subtle border
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#E0E0E0', // Light gray text
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 0.5,
    fontFamily: 'serif',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B8B8B8', // Medium gray
    marginBottom: 12,
    letterSpacing: 0.3,
    fontFamily: 'serif',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    color: '#B8B8B8', // Medium gray
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#404040', // Medium gray border
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#2A2A2A', // Dark input background
    color: '#E0E0E0', // Light gray text
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  picker: {
    borderWidth: 1.5,
    borderColor: '#404040', // Medium gray border
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: '#2A2A2A', // Dark background
    color: '#E0E0E0', // Light gray text
  },
  uploadBtn: {
    marginVertical: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#404040', // Medium gray border
    borderRadius: 13,
    alignItems: 'center',
    backgroundColor: '#2A2A2A', // Dark input background
    elevation: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  buttonPrimary: {
    backgroundColor: '#404040', // Medium gray
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#505050', // Lighter gray accent
  },
  buttonSecondary: {
    backgroundColor: '#2A2A2A', // Dark slate
    borderWidth: 1.5,
    borderColor: '#404040', // Medium gray border
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonText: {
    color: '#E0E0E0', // Light gray text
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.07,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 13,
    borderRadius: 11,
    marginHorizontal: 4,
    marginBottom: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#B8B8B8', // Medium gray
    borderColor: '#B8B8B8', // Medium gray
  },
  chipUnselected: {
    backgroundColor: '#2A2A2A', // Dark input background
    borderColor: '#404040', // Medium gray border
  },
  chipTextSelected: {
    color: '#1E1E1E', // Dark slate
    fontWeight: '600',
  },
  chipTextUnselected: {
    color: '#B8B8B8', // Medium gray
    fontWeight: '600',
  },
});
