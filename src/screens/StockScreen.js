import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { 
  getAllStocks, 
  createStock, 
  updateStock, 
  deleteStock,
  initDatabase 
} from '../services/databaseService';

const StockScreen = () => {
  const navigation = useNavigation();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [activeTab, setActiveTab] = useState('entree'); // 'entree' ou 'sortie'
  
  // États du formulaire
  const [typeProduit, setTypeProduit] = useState('');
  const [quantite, setQuantite] = useState('');
  const [dateEntree, setDateEntree] = useState('');
  const [dateSortie, setDateSortie] = useState('');
  const [budget, setBudget] = useState('');
  const [zoneAgricole, setZoneAgricole] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    setLoading(true);
    try {
      await initDatabase();
      const result = await getAllStocks();
      if (result.success) {
        setStocks(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Séparer les stocks en entrée et sortie
  const stocksEntree = stocks.filter(s => !s.dateSortie || s.dateSortie === '');
  const stocksSortie = stocks.filter(s => s.dateSortie && s.dateSortie !== '');

  const resetForm = () => {
    setTypeProduit('');
    setQuantite('');
    setDateEntree('');
    setDateSortie('');
    setBudget('');
    setZoneAgricole('');
    setDescription('');
    setEditingStock(null);
  };

  const openAddModal = (type = 'entree') => {
    resetForm();
    setActiveTab(type);
    setModalVisible(true);
  };

  const openEditModal = (stock) => {
    setEditingStock(stock);
    setTypeProduit(stock.typeProduit || '');
    setQuantite(stock.quantite?.toString() || '');
    setDateEntree(stock.dateEntree || '');
    setDateSortie(stock.dateSortie || '');
    setBudget(stock.budget?.toString() || '');
    setZoneAgricole(stock.zoneAgricole || '');
    setDescription(stock.description || '');
    setActiveTab(stock.dateSortie ? 'sortie' : 'entree');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!typeProduit || !quantite || !dateEntree) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le type de produit, la quantité et la date d\'entrée');
      return;
    }

    const quantiteNum = parseInt(quantite);
    if (isNaN(quantiteNum) || quantiteNum <= 0) {
      Alert.alert('Erreur', 'La quantité doit être un nombre positif');
      return;
    }

    const budgetNum = budget ? parseFloat(budget) : null;
    if (budget && (isNaN(budgetNum) || budgetNum < 0)) {
      Alert.alert('Erreur', 'Le budget doit être un nombre positif');
      return;
    }

    // Si c'est une sortie, la date de sortie est obligatoire
    const dateSortieFinale = activeTab === 'sortie' && !dateSortie ? new Date().toISOString().split('T')[0] : (dateSortie || null);

    setLoading(true);
    try {
      let result;
      if (editingStock) {
        result = await updateStock(
          editingStock.id,
          typeProduit,
          quantiteNum,
          dateEntree,
          dateSortieFinale,
          budgetNum,
          zoneAgricole || null,
          description || null
        );
      } else {
        result = await createStock(
          typeProduit,
          quantiteNum,
          dateEntree,
          dateSortieFinale,
          budgetNum,
          zoneAgricole || null,
          description || null
        );
      }

      if (result.success) {
        Alert.alert('Succès', editingStock ? 'Stock mis à jour avec succès' : 'Stock ajouté avec succès');
        setModalVisible(false);
        resetForm();
        loadStocks();
      } else {
        Alert.alert('Erreur', result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (stock) => {
    Alert.alert(
      'Supprimer le stock',
      `Êtes-vous sûr de vouloir supprimer le stock "${stock.typeProduit}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteStock(stock.id);
              if (result.success) {
                Alert.alert('Succès', 'Stock supprimé avec succès');
                loadStocks();
              } else {
                Alert.alert('Erreur', result.error || 'Une erreur est survenue');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    return dateString;
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Non spécifié';
    return `${amount.toFixed(2)} MAD`;
  };

  const renderStockItem = ({ item }) => (
    <View style={styles.stockCard}>
      <View style={styles.stockHeader}>
        <View style={styles.stockTitleContainer}>
          <View style={[styles.statusBadge, { backgroundColor: item.dateSortie ? '#ff9800' : '#4caf50' }]}>
            <Ionicons 
              name={item.dateSortie ? "arrow-down-circle" : "arrow-up-circle"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.statusText}>{item.dateSortie ? 'SORTIE' : 'ENTRÉE'}</Text>
          </View>
          <Text style={styles.stockTitle}>{item.typeProduit}</Text>
        </View>
        <View style={styles.stockActions}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={20} color="#fcb900" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stockInfo}>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="pricetag-outline" size={18} color="#2c5f2d" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Quantité</Text>
              <Text style={styles.infoValue}>{item.quantite} unités</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={18} color="#2c5f2d" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date entrée</Text>
              <Text style={styles.infoValue}>{formatDate(item.dateEntree)}</Text>
            </View>
          </View>

          {item.dateSortie && (
            <View style={styles.infoItem}>
              <Ionicons name="calendar-clear-outline" size={18} color="#ff9800" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date sortie</Text>
                <Text style={styles.infoValue}>{formatDate(item.dateSortie)}</Text>
              </View>
            </View>
          )}

          {item.budget && (
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={18} color="#2c5f2d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Budget</Text>
                <Text style={styles.infoValue}>{formatCurrency(item.budget)}</Text>
              </View>
            </View>
          )}

          {item.zoneAgricole && (
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={18} color="#2c5f2d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Zone</Text>
                <Text style={styles.infoValue}>{item.zoneAgricole}</Text>
              </View>
            </View>
          )}

          {item.description && (
            <View style={[styles.infoItem, styles.infoItemFull]}>
              <Ionicons name="document-text-outline" size={18} color="#2c5f2d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.infoValue}>{item.description}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderStocksList = (stocksList) => {
    if (loading && stocksList.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      );
    }

    if (stocksList.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            Aucun stock {activeTab === 'entree' ? 'd\'entrée' : 'de sortie'}
          </Text>
          <Text style={styles.emptySubtext}>
            Appuyez sur + pour ajouter un stock
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={stocksList}
        renderItem={renderStockItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec flèche de retour */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion de Stock</Text>
        <TouchableOpacity
          onPress={() => openAddModal(activeTab)}
          style={styles.addButton}
        >
          <Ionicons name="add-circle" size={28} color="#2c5f2d" />
        </TouchableOpacity>
      </View>

      {/* Tabs Entrée/Sortie */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'entree' && styles.tabActive]}
          onPress={() => setActiveTab('entree')}
        >
          <Ionicons 
            name="arrow-down-circle" 
            size={20} 
            color={activeTab === 'entree' ? '#fff' : '#2c5f2d'} 
          />
          <Text style={[styles.tabText, activeTab === 'entree' && styles.tabTextActive]}>
            Entrées ({stocksEntree.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sortie' && styles.tabActive]}
          onPress={() => setActiveTab('sortie')}
        >
          <Ionicons 
            name="arrow-up-circle" 
            size={20} 
            color={activeTab === 'sortie' ? '#fff' : '#ff9800'} 
          />
          <Text style={[styles.tabText, activeTab === 'sortie' && styles.tabTextActive]}>
            Sorties ({stocksSortie.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des stocks selon l'onglet actif */}
      <View style={styles.content}>
        {renderStocksList(activeTab === 'entree' ? stocksEntree : stocksSortie)}
      </View>

      {/* Modal pour ajouter/éditer un stock */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStock ? 'Modifier le stock' : activeTab === 'entree' ? 'Nouveau stock - Entrée' : 'Nouveau stock - Sortie'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Type de produit *</Text>
              <TextInput
                style={styles.input}
                value={typeProduit}
                onChangeText={setTypeProduit}
                placeholder="Ex: Tomates, Pommes, Fruits..."
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Quantité *</Text>
              <TextInput
                style={styles.input}
                value={quantite}
                onChangeText={setQuantite}
                placeholder="Nombre d'unités"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Date d'entrée *</Text>
              <TextInput
                style={styles.input}
                value={dateEntree}
                onChangeText={setDateEntree}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor="#999"
              />

              {activeTab === 'sortie' && (
                <>
                  <Text style={styles.label}>Date de sortie *</Text>
                  <TextInput
                    style={styles.input}
                    value={dateSortie}
                    onChangeText={setDateSortie}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor="#999"
                  />
                </>
              )}

              <Text style={styles.label}>Budget (MAD)</Text>
              <TextInput
                style={styles.input}
                value={budget}
                onChangeText={setBudget}
                placeholder="Montant en dirhams (optionnel)"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Zone agricole</Text>
              <TextInput
                style={styles.input}
                value={zoneAgricole}
                onChangeText={setZoneAgricole}
                placeholder="Nom de la zone (optionnel)"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Notes supplémentaires (optionnel)"
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Enregistrement...' : editingStock ? 'Modifier' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Barre de navigation en bas */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#2c5f2d" />
          <Text style={styles.navText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="cube-outline" size={24} color="#2c5f2d" />
          <Text style={styles.navText}>Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="analytics-outline" size={24} color="#2c5f2d" />
          <Text style={styles.navText}>Rapports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings-outline" size={24} color="#2c5f2d" />
          <Text style={styles.navText}>Paramètres</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d4f0d2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#2c5f2d',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5f2d',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  listContainer: {
    paddingBottom: 10,
  },
  stockCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#2c5f2d',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  stockTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  stockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5f2d',
    flex: 1,
  },
  stockActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 5,
  },
  stockInfo: {
    marginTop: 10,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoItemFull: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#2c5f2d',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 12,
    color: '#2c5f2d',
    fontWeight: '500',
  },
});

export default StockScreen;
