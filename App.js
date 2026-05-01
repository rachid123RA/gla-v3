// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { obtenirUtilisateurActuel } from './src/services/authService';
import { initDatabase } from './src/services/databaseService';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Écrans
import AccueilScreen from './src/screens/AccueilScreen';
import ConnexionScreen from './src/screens/ConnexionScreen';
import InscriptionScreen from './src/screens/InscriptionScreen';

import ServicesScreen from './src/screens/ServicesScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import PredictionScreen from './src/screens/PredictionScreen';
import SupportScreen from './src/screens/SupportScreen';
import DiagnosticScreen from './src/screens/DiagnosticScreen';
import AnalyseScreen from './src/screens/AnalyseScreen';
import StockScreen from './src/screens/StockScreen';
import CapteurScreen from './src/screens/CapteurScreen';
import ParametresScreen from './src/screens/ParametresScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminUsersScreen from './src/screens/admin/AdminUsersScreen';
import AdminSubscriptionsScreen from './src/screens/admin/AdminSubscriptionsScreen';
import SubscriptionGate from './src/components/SubscriptionGate';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Onglets après connexion
function AdminStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#2c5f2d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Utilisateurs' }} />
      <Stack.Screen name="AdminSubscriptions" component={AdminSubscriptionsScreen} options={{ title: 'Abonnements' }} />
    </Stack.Navigator>
  );
}

function TabsNavigation({ user }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2c5f2d',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#d4f0d2', paddingBottom: 5 },
      }}
    >
      <Tab.Screen
        name="Services"
        component={ServicesStack}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Chatbot"
        component={() =>
          user?.role === 'admin' ? (
            <ChatbotScreen />
          ) : (
            <SubscriptionGate>
              <ChatbotScreen />
            </SubscriptionGate>
          )
        }
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="robot-happy-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Prediction"
        component={() =>
          user?.role === 'admin' ? (
            <PredictionScreen />
          ) : (
            <SubscriptionGate>
              <PredictionScreen />
            </SubscriptionGate>
          )
        }
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="chart-line" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Support"
        component={() =>
          user?.role === 'admin' ? (
            <SupportScreen />
          ) : (
            <SubscriptionGate>
              <SupportScreen />
            </SubscriptionGate>
          )
        }
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="help-circle-outline" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Parametres"
        component={() =>
          user?.role === 'admin' ? (
            <ParametresScreen />
          ) : (
            <SubscriptionGate>
              <ParametresScreen />
            </SubscriptionGate>
          )
        }
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />,
        }}
      />

      {user?.role === 'admin' && (
        <Tab.Screen
          name="Admin"
          component={AdminStack}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark" size={22} color={color} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// Stack secondaire pour naviguer dans Services
function ServicesStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator>
      <Stack.Screen name="ServicesMain" component={ServicesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Diagnostic" component={DiagnosticScreen} />
      <Stack.Screen name="Analyse" component={AnalyseScreen} />
      <Stack.Screen name="Stock" component={StockScreen} />
      <Stack.Screen name="Capteur" component={CapteurScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Prediction" component={PredictionScreen} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
      <Stack.Screen name="Parametres" component={ParametresScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialiser la base de données au démarrage
        await initDatabase();
        
        // Vérifier l'utilisateur connecté
        const currentUser = await obtenirUtilisateurActuel();
        setUser(currentUser);
      } catch (error) {
        console.error('Erreur initialisation:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Vérifier périodiquement si l'utilisateur a changé (après connexion/inscription)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const currentUser = await obtenirUtilisateurActuel();
        setUser(prevUser => {
          // Mettre à jour seulement si l'état a changé
          if (currentUser && !prevUser) {
            return currentUser;
          } else if (!currentUser && prevUser) {
            return null;
          }
          return prevUser;
        });
      } catch (error) {
        // Ignorer les erreurs silencieusement
      }
    }, 1000); // Vérifier toutes les secondes
    
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Tabs">
            {() => <TabsNavigation user={user} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Accueil" component={AccueilScreen} />
            <Stack.Screen name="Connexion" component={ConnexionScreen} />
            <Stack.Screen name="Inscription" component={InscriptionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
