import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import socketManager from '../services/socket';

const GameScreen = ({ route, navigation }) => {
  const { userId, username } = route.params;
  const [playerStatus, setPlayerStatus] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [opponent, setOpponent] = useState('');
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // جلب حالة اللاعب من الخادم
  const fetchPlayerStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/battle/status/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setPlayerStatus(data);
      }
    } catch (error) {
      console.error('Error fetching player status:', error);
    }
  };

  useEffect(() => {
    fetchPlayerStatus();
  }, []);

  useEffect(() => {
    // الاتصال بالخادم عبر WebSocket
    socketManager.connect(userId, username);
    setConnected(true);

    // استماع للأحداث
    socketManager.on('waiting', (msg) => {
      setWaiting(true);
    });

    socketManager.on('game-start', (data) => {
      setWaiting(false);
      setGameId(data.gameId);
      setOpponent(data.opponent);
      setIsYourTurn(data.yourTurn);
      setGameState(data.state);
    });

    socketManager.on('game-update', (state) => {
      setGameState(state);
    });

    socketManager.on('crime-result', (result) => {
      setLoading(false);
      Alert.alert(result.success ? '✅ نجاح' : '❌ فشل', result.message);
      if (result.newState) {
        setGameState(result.newState);
        // تحديث حالة اللاعب بعد النشاط
        fetchPlayerStatus();
      }
    });

    socketManager.on('turn-notification', (data) => {
      setIsYourTurn(true);
      Alert.alert('🎲 دورك الآن!', data.message);
      setGameState(data.state);
    });

    socketManager.on('error', (msg) => {
      Alert.alert('خطأ', msg);
    });

    return () => {
      socketManager.disconnect();
    };
  }, []);

  const joinGame = () => {
    if (!connected) {
      Alert.alert('خطأ', 'غير متصل بالخادم');
      return;
    }
    setWaiting(true);
    socketManager.joinGame(userId);
  };

  const performCrime = (crimeType) => {
    if (!gameId) {
      Alert.alert('تنبيه', 'يجب البدء في مباراة أولاً');
      return;
    }
    if (!isYourTurn) {
      Alert.alert('تنبيه', 'ليس دورك الآن');
      return;
    }
    setLoading(true);
    socketManager.performCrime(gameId, crimeType);
  };

  const endTurn = () => {
    if (!gameId) {
      Alert.alert('تنبيه', 'يجب البدء في مباراة أولاً');
      return;
    }
    if (!isYourTurn) {
      Alert.alert('تنبيه', 'ليس دورك الآن');
      return;
    }
    socketManager.endTurn(gameId);
    setIsYourTurn(false);
  };

  const openBlackMarket = () => {
    Alert.alert('قريباً', 'السوق السوداء قيد التطوير');
  };

  if (!playerStatus) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.waitingText}>جاري تحميل بيانات اللاعب...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚡ THE UNDERWORLD ⚡</Text>
        <Text style={styles.welcome}>مرحباً، {username}</Text>
      </View>

      {/* معلومات اللاعب */}
      <View style={styles.playerInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>💰 المال:</Text>
          <Text style={styles.infoValue}>{playerStatus.money}$</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📊 المستوى:</Text>
          <Text style={styles.infoValue}>{playerStatus.level}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>⭐ السمعة:</Text>
          <Text style={styles.infoValue}>{playerStatus.reputation}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>❤️ نقاط الحياة:</Text>
          <Text style={styles.infoValue}>{playerStatus.hp || 100}/100</Text>
        </View>
      </View>

      {/* أزرار الإجراءات الرئيسية */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={joinGame}
          disabled={waiting}>
          <Text style={styles.buttonText}>
            {waiting ? 'جاري البحث...' : '🔍 ابحث عن خصم'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.marketButton}
          onPress={openBlackMarket}>
          <Text style={styles.buttonText}>🛒 السوق السوداء</Text>
        </TouchableOpacity>
      </View>

      {/* شاشة اللعبة (تظهر فقط عند وجود مباراة) */}
      {gameState && (
        <View style={styles.gameArea}>
          <View style={styles.gameHeader}>
            <Text style={styles.opponentText}>الخصم: {opponent}</Text>
            <Text style={[styles.turnText, isYourTurn ? styles.yourTurn : styles.opponentTurn]}>
              {isYourTurn ? '🎲 دورك' : '⏳ دور الخصم'}
            </Text>
          </View>

          <View style={styles.resourcesBox}>
            <Text style={styles.sectionTitle}>مواردي</Text>
            <Text>💰 المال: {gameState.you.resources.money}$</Text>
            <Text>⭐ السمعة: {gameState.you.resources.reputation}</Text>
            <Text>📊 المستوى: {gameState.you.stats.level}</Text>
          </View>

          <View style={styles.opponentBox}>
            <Text style={styles.sectionTitle}>موارد الخصم</Text>
            <Text>💰 المال: {gameState.opponent.resources.money}$</Text>
            <Text>📊 المستوى: {gameState.opponent.stats.level}</Text>
          </View>

          <View style={styles.actionsBox}>
            <Text style={styles.sectionTitle}>أنشطة إجرامية</Text>

            <TouchableOpacity
              style={[styles.crimeButton, styles.robbery]}
              onPress={() => performCrime('robbery')}
              disabled={loading || !isYourTurn}>
              <Text style={styles.buttonText}>💰 سرقة بنك</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.crimeButton, styles.smuggling]}
              onPress={() => performCrime('smuggling')}
              disabled={loading || !isYourTurn}>
              <Text style={styles.buttonText}>📦 تهريب</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.crimeButton, styles.extortion]}
              onPress={() => performCrime('extortion')}
              disabled={loading || !isYourTurn}>
              <Text style={styles.buttonText}>😠 ابتزاز</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.crimeButton, styles.heist]}
              onPress={() => performCrime('heist')}
              disabled={loading || !isYourTurn}>
              <Text style={styles.buttonText}>💎 سرقة كبرى</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.endTurnButton}
              onPress={endTurn}
              disabled={loading || !isYourTurn}>
              <Text style={styles.buttonText}>🔚 إنهاء الدور</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  waitingText: {
    color: '#FFD700',
    fontSize: 18,
    marginTop: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  welcome: {
    color: '#fff',
    fontSize: 18,
  },
  playerInfo: {
    margin: 20,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    color: '#FFD700',
    fontSize: 16,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  marketButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  gameArea: {
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  opponentText: {
    color: '#fff',
    fontSize: 16,
  },
  turnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  yourTurn: {
    color: '#4CAF50',
  },
  opponentTurn: {
    color: '#f44336',
  },
  resourcesBox: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  opponentBox: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  actionsBox: {
    padding: 20,
  },
  crimeButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  robbery: {
    backgroundColor: '#4CAF50',
  },
  smuggling: {
    backgroundColor: '#2196F3',
  },
  extortion: {
    backgroundColor: '#FF9800',
  },
  heist: {
    backgroundColor: '#f44336',
  },
  endTurnButton: {
    backgroundColor: '#9C27B0',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GameScreen;