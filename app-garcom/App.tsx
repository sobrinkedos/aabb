import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { store, AppDispatch } from './src/store/store';
import { RootState } from './src/store/store';
import { signOut } from './src/store/slices/authSlice';
import LoginScreen from './src/screens/LoginScreen';
import { theme } from './src/theme';
import ErrorBoundary from './src/components/ErrorBoundary';
import { supabase } from './src/services/SupabaseService';

function AppWithNavigation() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [mesas, setMesas] = useState<any[]>([]);
  const [comandas, setComandas] = useState<any[]>([]);
  const [cardapio, setCardapio] = useState<any[]>([]);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [loadingComandas, setLoadingComandas] = useState(false);
  const [loadingCardapio, setLoadingCardapio] = useState(false);
  const [showNovaComanda, setShowNovaComanda] = useState(false);

  // Carregar mesas quando navegar para a tela
  React.useEffect(() => {
    if (currentScreen === 'Mesas') {
      carregarMesas();
    }
  }, [currentScreen]);

  // Carregar comandas quando navegar para a tela
  React.useEffect(() => {
    if (currentScreen === 'Comandas') {
      carregarComandas();
    }
  }, [currentScreen]);

  // Carregar cardápio quando navegar para a tela
  React.useEffect(() => {
    if (currentScreen === 'Cardapio') {
      carregarCardapio();
    }
  }, [currentScreen]);

  const carregarMesas = async () => {
    try {
      setLoadingMesas(true);
      const { data, error } = await supabase
        .from('bar_tables')
        .select('*')
        .order('number', { ascending: true });

      if (error) throw error;
      setMesas(data || []);
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
    } finally {
      setLoadingMesas(false);
    }
  };

  const carregarComandas = async () => {
    try {
      setLoadingComandas(true);
      const { data, error } = await supabase
        .from('comandas')
        .select('*')
        .eq('employee_id', user?.id)
        .order('opened_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setComandas(data || []);
    } catch (error) {
      console.error('Erro ao carregar comandas:', error);
    } finally {
      setLoadingComandas(false);
    }
  };

  const carregarCardapio = async () => {
    try {
      setLoadingCardapio(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true })
        .limit(20);

      if (error) throw error;
      setCardapio(data || []);
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
    } finally {
      setLoadingCardapio(false);
    }
  };

  const criarNovaComanda = async (mesaId: string, nomeCliente: string) => {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .insert([{
          table_id: mesaId,
          customer_name: nomeCliente,
          employee_id: user?.id,
          status: 'open',
          total: 0,
          people_count: 1,
          opened_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      
      Alert.alert('Sucesso', 'Comanda criada com sucesso!');
      setShowNovaComanda(false);
      carregarComandas();
      return data;
    } catch (error) {
      console.error('Erro ao criar comanda:', error);
      Alert.alert('Erro', 'Não foi possível criar a comanda');
    }
  };

  const handleSignOut = () => {
    dispatch(signOut());
  };

  const renderScreen = () => {
    try {
      switch (currentScreen) {
        case 'Mesas':
          const mesasDisponiveis = mesas.filter(m => m.status === 'available').length;
          const mesasOcupadas = mesas.filter(m => m.status === 'occupied').length;
          const mesasReservadas = mesas.filter(m => m.status === 'reserved').length;

          return (
            <ScrollView style={styles.screenContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>🪑 Mesas</Text>
                <Text style={styles.headerSubtitle}>
                  {loadingMesas ? 'Carregando...' : `${mesas.length} mesas cadastradas`}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 Status das Mesas</Text>
                <Text style={styles.cardText}>🟢 Disponíveis: {mesasDisponiveis}</Text>
                <Text style={styles.cardText}>🟡 Ocupadas: {mesasOcupadas}</Text>
                <Text style={styles.cardText}>🔴 Reservadas: {mesasReservadas}</Text>
              </View>

              {loadingMesas ? (
                <View style={styles.card}>
                  <Text style={styles.cardText}>Carregando mesas...</Text>
                </View>
              ) : mesas.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>📋 Lista de Mesas</Text>
                  {mesas.slice(0, 5).map((mesa) => (
                    <View key={mesa.id} style={[styles.menuButton, { marginTop: theme.spacing.xs }]}>
                      <Text style={styles.menuButtonText}>
                        Mesa {mesa.number} - {
                          mesa.status === 'available' ? '🟢 Disponível' :
                          mesa.status === 'occupied' ? '🟡 Ocupada' :
                          '🔴 Reservada'
                        }
                      </Text>
                    </View>
                  ))}
                  {mesas.length > 5 && (
                    <Text style={[styles.cardText, { marginTop: theme.spacing.sm }]}>
                      + {mesas.length - 5} mesas
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.cardText}>Nenhuma mesa cadastrada</Text>
                </View>
              )}
            </ScrollView>
          );
        
        case 'Comandas':
          const comandasAbertas = comandas.filter(c => c.status === 'open').length;
          const comandasPendentes = comandas.filter(c => c.status === 'pending_payment').length;
          const comandasFechadas = comandas.filter(c => c.status === 'closed').length;

          return (
            <ScrollView style={styles.screenContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>📋 Comandas</Text>
                <Text style={styles.headerSubtitle}>
                  {loadingComandas ? 'Carregando...' : `${comandas.length} comandas recentes`}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 Status</Text>
                <Text style={styles.cardText}>📝 Abertas: {comandasAbertas}</Text>
                <Text style={styles.cardText}>⏳ Pendentes: {comandasPendentes}</Text>
                <Text style={styles.cardText}>✅ Fechadas: {comandasFechadas}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.button, { marginHorizontal: 0 }]}
                onPress={() => {
                  Alert.alert(
                    'Nova Comanda',
                    'Funcionalidade de criar comanda será implementada em breve',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.buttonText}>➕ Nova Comanda</Text>
              </TouchableOpacity>

              {loadingComandas ? (
                <View style={styles.card}>
                  <ActivityIndicator size="large" color={theme.colors.primary.main} />
                  <Text style={[styles.cardText, { textAlign: 'center', marginTop: theme.spacing.md }]}>
                    Carregando comandas...
                  </Text>
                </View>
              ) : comandas.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>📋 Últimas Comandas</Text>
                  {comandas.slice(0, 5).map((comanda) => (
                    <View key={comanda.id} style={[styles.menuButton, { marginTop: theme.spacing.xs }]}>
                      <Text style={styles.menuButtonText}>
                        {comanda.customer_name || 'Cliente'} - R$ {comanda.total?.toFixed(2) || '0.00'}
                      </Text>
                      <Text style={[styles.cardText, { fontSize: 12 }]}>
                        {comanda.status === 'open' ? '📝 Aberta' :
                         comanda.status === 'pending_payment' ? '⏳ Pendente' :
                         '✅ Fechada'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.cardText}>Nenhuma comanda encontrada</Text>
                </View>
              )}
            </ScrollView>
          );
        
        case 'Cardapio':
          const categorias = [...new Set(cardapio.map(item => item.category))];
          
          return (
            <ScrollView style={styles.screenContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>🍽️ Cardápio</Text>
                <Text style={styles.headerSubtitle}>
                  {loadingCardapio ? 'Carregando...' : `${cardapio.length} itens disponíveis`}
                </Text>
              </View>

              {loadingCardapio ? (
                <View style={styles.card}>
                  <ActivityIndicator size="large" color={theme.colors.primary.main} />
                  <Text style={[styles.cardText, { textAlign: 'center', marginTop: theme.spacing.md }]}>
                    Carregando cardápio...
                  </Text>
                </View>
              ) : cardapio.length > 0 ? (
                <>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>📊 Categorias</Text>
                    {categorias.map((cat, idx) => (
                      <Text key={idx} style={styles.cardText}>
                        • {cat} ({cardapio.filter(i => i.category === cat).length} itens)
                      </Text>
                    ))}
                  </View>

                  {categorias.map((categoria) => (
                    <View key={categoria} style={styles.card}>
                      <Text style={styles.cardTitle}>{categoria}</Text>
                      {cardapio
                        .filter(item => item.category === categoria)
                        .slice(0, 3)
                        .map((item) => (
                          <View key={item.id} style={[styles.menuButton, { marginTop: theme.spacing.xs }]}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.menuButtonText}>{item.name}</Text>
                              <Text style={[styles.cardText, { fontSize: 12 }]}>
                                R$ {item.price?.toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        ))}
                    </View>
                  ))}
                </>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.cardText}>Nenhum item no cardápio</Text>
                </View>
              )}
            </ScrollView>
          );
        
        case 'Home':
          return (
            <ScrollView style={styles.screenContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>🏠 Início</Text>
                <Text style={styles.headerSubtitle}>Bem-vindo, {user?.name || 'Garçom'}!</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>📱 Acesso Rápido</Text>
                
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={() => setCurrentScreen('Mesas')}
                >
                  <Ionicons name="grid-outline" size={24} color={theme.colors.success.main} />
                  <Text style={styles.menuButtonText}>Mesas</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuButton, { marginTop: theme.spacing.sm }]}
                  onPress={() => setCurrentScreen('Comandas')}
                >
                  <Ionicons name="receipt-outline" size={24} color={theme.colors.info.main} />
                  <Text style={styles.menuButtonText}>Comandas</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuButton, { marginTop: theme.spacing.sm }]}
                  onPress={() => setCurrentScreen('Cardapio')}
                >
                  <Ionicons name="restaurant-outline" size={24} color={theme.colors.warning.main} />
                  <Text style={styles.menuButtonText}>Cardápio</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuButton, { marginTop: theme.spacing.sm }]}
                  onPress={() => setCurrentScreen('Profile')}
                >
                  <Ionicons name="person-outline" size={24} color={theme.colors.secondary.main} />
                  <Text style={styles.menuButtonText}>Perfil</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>ℹ️ Status</Text>
                <Text style={styles.cardText}>✅ App funcionando</Text>
                <Text style={styles.cardText}>✅ Login OK</Text>
                <Text style={styles.cardText}>✅ Navegação OK</Text>
              </View>
            </ScrollView>
          );
        case 'Profile':
          return (
            <View style={styles.screenContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>👤 Perfil</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Informações</Text>
                <Text style={styles.cardText}>Nome: {user?.name}</Text>
                <Text style={styles.cardText}>Email: {user?.email}</Text>
                <Text style={styles.cardText}>ID: {user?.id?.substring(0, 8)}...</Text>
              </View>
              <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Sair do App</Text>
              </TouchableOpacity>
            </View>
          );
        default:
          return (
            <View style={styles.screenContainer}>
              <Text style={styles.screenTitle}>Tela não encontrada</Text>
            </View>
          );
      }
    } catch (error) {
      console.error('❌ Erro ao renderizar tela:', error);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro ao carregar tela</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => setCurrentScreen('Home')}
          >
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Conteúdo */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('Home')}
        >
          <Ionicons 
            name={currentScreen === 'Home' ? 'home' : 'home-outline'} 
            size={24} 
            color={currentScreen === 'Home' ? theme.colors.primary.main : theme.colors.text.secondary}
          />
          <Text style={[
            styles.navLabel,
            currentScreen === 'Home' && styles.navLabelActive
          ]}>
            Início
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('Mesas')}
        >
          <Ionicons 
            name={currentScreen === 'Mesas' ? 'grid' : 'grid-outline'} 
            size={24} 
            color={currentScreen === 'Mesas' ? theme.colors.primary.main : theme.colors.text.secondary}
          />
          <Text style={[
            styles.navLabel,
            currentScreen === 'Mesas' && styles.navLabelActive
          ]}>
            Mesas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('Comandas')}
        >
          <Ionicons 
            name={currentScreen === 'Comandas' ? 'receipt' : 'receipt-outline'} 
            size={24} 
            color={currentScreen === 'Comandas' ? theme.colors.primary.main : theme.colors.text.secondary}
          />
          <Text style={[
            styles.navLabel,
            currentScreen === 'Comandas' && styles.navLabelActive
          ]}>
            Comandas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentScreen('Cardapio')}
        >
          <Ionicons 
            name={currentScreen === 'Cardapio' ? 'restaurant' : 'restaurant-outline'} 
            size={24} 
            color={currentScreen === 'Cardapio' ? theme.colors.primary.main : theme.colors.text.secondary}
          />
          <Text style={[
            styles.navLabel,
            currentScreen === 'Cardapio' && styles.navLabelActive
          ]}>
            Cardápio
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <AppWithNavigation />;
}

export default function App() {
  console.log('🚀 App com navegação iniciando...');
  
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  content: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 40,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  menuButtonText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingBottom: 8,
    paddingTop: 12,
    ...theme.shadows.lg,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  navLabelActive: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  button: {
    backgroundColor: theme.colors.primary.main,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: theme.colors.error.main,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error.main,
    marginBottom: theme.spacing.lg,
  },
});
