import { Image, StyleSheet, Platform, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>LUXE AR</Text>
          <Text style={styles.subtitle}>BY BRANDZAHA</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Store Management</Text>
          <Text style={styles.cardDesc}>Access inventory and analytics on the go.</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => router.push({ pathname: '/try-on', params: { type: 'jewelry' } })}
            >
              <Text style={styles.buttonText}>LAUNCH MIRROR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push('/(tabs)/catalog')}
            >
              <Text style={[styles.buttonText, styles.secondaryText]}>INVENTORY</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stats}>
          {/* Simple Stats for demo */}
          <View style={styles.statItem}>
            <Text style={styles.statNum}>124</Text>
            <Text style={styles.statLabel}>Try-Ons Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>98%</Text>
            <Text style={styles.statLabel}>User Match</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#006D66', // Deep Teal (Luxe Primary)
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#F5F5F5',
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif', // Fallback for custom fonts
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#C5A065', // Gold Accent
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#C5A065',
    marginTop: 24,
    opacity: 0.5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 32,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardDesc: {
    color: '#666',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    height: 56,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#006D66', // Primary
    shadowColor: "#006D66",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryText: {
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 0,
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#C5A065',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
});
