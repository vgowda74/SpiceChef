import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { Colors, Fonts, Spacing } from '../lib/theme';
import { useRecipeStore, Cookbook } from '../store/recipeStore';
import { uploadAndParseCookbook, UploadProgress } from '../lib/cookbookService';

// Navigation prop can come from either the stack or the tab navigator
type Props = {
  navigation: any;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

// Simple emoji icons for cookbooks based on title
function getCookbookEmoji(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('indian') || lower.includes('spice')) return '🍛';
  if (lower.includes('plenty') || lower.includes('vegetable') || lower.includes('veg')) return '🥬';
  if (lower.includes('death') || lower.includes('cocktail') || lower.includes('drink')) return '🍸';
  if (lower.includes('italian') || lower.includes('pasta')) return '🍝';
  if (lower.includes('bread') || lower.includes('bak')) return '🍞';
  if (lower.includes('dessert') || lower.includes('sweet')) return '🍰';
  return '📖';
}

function CookbookRow({
  cookbook,
  onPress,
}: {
  cookbook: Cookbook;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.cookbookRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.cookbookIcon, { backgroundColor: cookbook.accent_color }]}>
        <Text style={styles.cookbookEmoji}>{getCookbookEmoji(cookbook.title)}</Text>
      </View>
      <View style={styles.cookbookInfo}>
        <Text style={styles.cookbookTitle} numberOfLines={1}>{cookbook.title}</Text>
        <Text style={styles.cookbookMeta}>
          {cookbook.author} · {cookbook.recipe_count} recipes found
        </Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countBadgeText}>{cookbook.recipe_count}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cookbooks, addCookbook, addParsedCookbook } = useRecipeStore();
  const [processing, setProcessing] = useState(false);
  const [processingName, setProcessingName] = useState('');
  const [processingStage, setProcessingStage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCookbooks = searchQuery
    ? cookbooks.filter(
        (cb) =>
          cb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cb.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : cookbooks;

  const isSupabaseConfigured =
    !!process.env.EXPO_PUBLIC_SUPABASE_URL &&
    !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true, // need local copy for reading
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const title = file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
      setProcessingName(title);
      setProcessing(true);

      if (isSupabaseConfigured) {
        // Real flow: Upload to Supabase → Claude parses → recipes saved
        try {
          const onProgress = (progress: UploadProgress) => {
            setProcessingStage(progress.message);
          };

          const { cookbook, recipes } = await uploadAndParseCookbook(
            file.uri,
            file.name,
            onProgress,
          );

          addParsedCookbook(cookbook, recipes);
          setProcessing(false);
          navigation.navigate('RecipeBrowser', { cookbookId: cookbook.id });
        } catch (err: any) {
          setProcessing(false);
          Alert.alert(
            'Upload failed',
            err.message || 'Something went wrong parsing the cookbook.',
            [{ text: 'OK' }],
          );
        }
      } else {
        // Fallback: mock flow when Supabase is not configured
        setProcessingStage('Simulating parse (Supabase not configured)...');
        setTimeout(() => {
          const cookbook = addCookbook(title);
          setProcessing(false);
          navigation.navigate('RecipeBrowser', { cookbookId: cookbook.id });
        }, 2000);
      }
    } catch {
      setProcessing(false);
    }
  };

  const renderHeader = () => (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.heading}>Your Library</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Text style={styles.avatarText}>VK</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your cookbooks..."
          placeholderTextColor={Colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Upload button */}
      <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} activeOpacity={0.75}>
        <View style={styles.uploadIcon}>
          <Ionicons name="arrow-up" size={22} color={Colors.accent} />
        </View>
        <View style={styles.uploadText}>
          <Text style={styles.uploadLabel}>Upload a cookbook</Text>
          <Text style={styles.uploadSub}>PDF · Any cuisine · Any language</Text>
        </View>
      </TouchableOpacity>

      {/* Section label */}
      {filteredCookbooks.length > 0 && (
        <Text style={styles.sectionLabel}>
          MY COOKBOOKS ({filteredCookbooks.length})
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="book-outline" size={48} color={Colors.border} />
      <Text style={styles.emptyTitle}>No cookbooks yet</Text>
      <Text style={styles.emptySub}>
        Upload your first PDF above and we'll extract every recipe for you.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <FlatList
        data={filteredCookbooks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <CookbookRow
            cookbook={item}
            onPress={() => navigation.navigate('RecipeBrowser', { cookbookId: item.id })}
          />
        )}
      />

      {/* Processing modal */}
      <Modal visible={processing} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.modalTitle}>Parsing recipes…</Text>
            <Text style={styles.modalSub} numberOfLines={2}>
              {processingName}
            </Text>
            <Text style={styles.modalHint}>
              {processingStage || 'Claude is reading your cookbook'}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + 80, // extra space for tab bar
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 38,
    color: Colors.text,
    lineHeight: 44,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  avatarText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.bg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 10,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#2A3B1E',
    borderWidth: 1,
    borderColor: '#3D5228',
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    flex: 1,
  },
  uploadLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  uploadSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
  sectionLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: Spacing.md,
  },
  cookbookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cookbookIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookbookEmoji: {
    fontSize: 22,
  },
  cookbookInfo: {
    flex: 1,
    gap: 3,
  },
  cookbookTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.text,
  },
  cookbookMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
  },
  countBadge: {
    backgroundColor: '#2A3B1E',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3D5228',
  },
  countBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.muted,
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xl,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(11,22,16,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    width: 280,
    gap: Spacing.md,
  },
  modalTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.text,
  },
  modalSub: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.accent,
    textAlign: 'center',
  },
  modalHint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
  },
});
