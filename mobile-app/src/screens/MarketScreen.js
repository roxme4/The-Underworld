import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';

const MarketScreen = ({ route, navigation }) => {
  const { userId, username } = route.params;
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // جلب العناصر المتاحة
  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/market/items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  // جلب مخزون اللاعب
  const fetchInventory = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/market/inventory/${userId}`);
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchInventory();
  }, []);

  const buyItem = async (itemId) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/market/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: userId, itemId })
      });
      const result = await response.json();
      if (result.success) {
        Alert.alert('✅ نجاح', result.message);
        fetchInventory(); // تحديث المخزون
        fetchItems(); // تحديث العناصر (لأن السعر قد تغير)
      } else {
        Alert.alert('❌ فشل', result.message);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const sellItem = async (itemId) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/market/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: userId, itemId })
      });
      const result = await response.json();
      if (result.success) {
        Alert.alert('✅ نجاح', result.message);
        fetchInventory();
      } else {
        Alert.alert('❌ فشل', result.message);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#9e9e9e',
      rare: '#2196F3',
      epic: '#9C27B0',
      legendary: '#FFD700'
    };
    return colors[rarity] || '#fff';
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.type === selectedCategory);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛒 السوق السوداء</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>العودة</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryFilter}>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === 'all' && styles.activeCategory]}
          onPress={() => setSelectedCategory('all')}>
          <Text style={styles.categoryText}>الكل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === 'weapon' && styles.activeCategory]}
          onPress={() => setSelectedCategory('weapon')}>
          <Text style={styles.categoryText}>أسلحة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === 'armor' && styles.activeCategory]}
          onPress={() => setSelectedCategory('armor')}>
          <Text style={styles.categoryText}>دروع</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === 'drug' && styles.activeCategory]}
          onPress={() => setSelectedCategory('drug')}>
          <Text style={styles.categoryText}>مخدرات</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>🛍️ للشراء</Text>
      {filteredItems.map(item => (
        <View key={item.id} style={[styles.itemCard, { borderColor: getRarityColor(item.rarity) }]}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={[styles.itemRarity, { color: getRarityColor(item.rarity) }]}>
              {item.rarity}
            </Text>
          </View>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <View style={styles.itemDetails}>
            <Text>💰 السعر: {item.price}$</Text>
            {item.damage && <Text>⚔️ ضرر: {item.damage}</Text>}
            {item.defense && <Text>🛡️ دفاع: {item.defense}</Text>}
            {item.profit && <Text>📈 ربح: {item.profit}$</Text>}
            {item.requiredLevel && <Text>📊 مستوى مطلوب: {item.requiredLevel}</Text>}
          </View>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => buyItem(item.id)}
            disabled={loading}>
            <Text style={styles.buttonText}>شراء</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>📦 مخزوني</Text>
      {inventory.length === 0 ? (
        <Text style={styles.emptyText}>لا يوجد عناصر في المخزون</Text>
      ) : (
        inventory.map(item => (
          <View key={item.id} style={[styles.itemCard, { borderColor: getRarityColor(item.rarity) }]}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.itemRarity, { color: getRarityColor(item.rarity) }]}>
                {item.rarity}
              </Text>
            </View>
            <Text style={styles.itemDescription}>{item.description}</Text>
            <View style={styles.itemDetails}>
              {item.damage && <Text>⚔️ ضرر: {item.damage}</Text>}
              {item.defense && <Text>🛡️ دفاع: {item.defense}</Text>}
            </View>
            <TouchableOpacity
              style={styles.sellButton}
              onPress={() => sellItem(item.id)}
              disabled={loading}>
              <Text style={styles.buttonText}>بيع (بـ {Math.floor(item.price * 0.6)}$)</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  backButton: {
    color: '#4CAF50',
    fontSize: 16,
  },
  categoryFilter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#333',
  },
  categoryButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#444',
  },
  activeCategory: {
    backgroundColor: '#FFD700',
  },
  categoryText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    margin: 15,
  },
  itemCard: {
    backgroundColor: '#2a2a2a',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemRarity: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDescription: {
    color: '#aaa',
    marginBottom: 10,
  },
  itemDetails: {
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  sellButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    margin: 20,
  },
});

export default MarketScreen;