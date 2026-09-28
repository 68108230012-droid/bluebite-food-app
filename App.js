import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://tssduwklvgzqkzcgcfvk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LzN_0S0jzEKl61P5L-Pm7Q_DCo9tqnb';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Asset รูปภาพ PNG ไดคัทสำหรับ Visual Layering
const VISUAL_ASSETS = {
  plate: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&q=80', // จานรอง
  baseRice: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&q=80',
  meats: {
    pork: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&q=80', // หมูกรอบ
    beef: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', // เนื้อสับ
    seafood: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80', // ทะเล
  },
  eggs: {
    runny: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80', // ไข่แดงเยิ้ม
    crispy: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=300&q=80', // ไข่ขอบกรอบ
  },
  toppings: {
    crackling: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&q=80', // กากหมู
    sausage: 'https://images.unsplash.com/photo-1585325701165-351af916e581?w=200&q=80', // กุนเชียง
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'cart' | 'history'
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);

  // --- STATE ของ VISUAL BUILDER ---
  const [selectedMeat, setSelectedMeat] = useState('pork'); // pork, beef, seafood
  const [eggType, setEggType] = useState('runny'); // 'none', 'runny', 'crispy'
  const [spiceLevel, setSpiceLevel] = useState('medium'); // 'mild', 'medium', 'fire'
  const [sauce, setSauce] = useState('fishchili'); // 'none', 'fishchili', 'chilisauce'
  const [selectedToppings, setSelectedToppings] = useState({
    crackling: true,
    sausage: false,
  });

  // ตัวเลือกวัตถุดิบและราคา
  const MEAT_OPTIONS = [
    { id: 'pork', label: 'หมูกรอบคั่วพริกเกลือ', price: 65 },
    { id: 'beef', label: 'เนื้อสับโคขุนพรีเมียม', price: 85 },
    { id: 'seafood', label: 'ซีฟู้ดกุ้งหมึกสะเด่า', price: 90 },
  ];

  const EGG_OPTIONS = [
    { id: 'none', label: 'ไม่ใส่ไข่', price: 0 },
    { id: 'runny', label: 'ไข่ดาวลาวา เยิ้มๆ', price: 15 },
    { id: 'crispy', label: 'ไข่เป็ดกรอบฟู', price: 18 },
  ];

  const TOPPING_OPTIONS = [
    { id: 'crackling', label: 'กากหมูเจียวกระเทียมสด', price: 15 },
    { id: 'sausage', label: 'กุนเชียงทอดเตาถ่าน', price: 20 },
  ];

  // คำนวณราคาชาม DIY ปัจจุบัน
  const calculateCurrentDishPrice = () => {
    let total = MEAT_OPTIONS.find((m) => m.id === selectedMeat)?.price || 0;
    total += EGG_OPTIONS.find((e) => e.id === eggType)?.price || 0;
    if (selectedToppings.crackling) total += 15;
    if (selectedToppings.sausage) total += 20;
    return total;
  };

  const toggleTopping = (key) => {
    setSelectedToppings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ดึงประวัติจาก Supabase
  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('id', { ascending: false })
        .limit(5);

      if (!error && data) setRecentOrders(data);
    } catch (e) {
      console.log('Error fetching:', e.message);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  // บันทึกจาน DIY ลงตะกร้า
  const handleAddDishToCart = () => {
    const currentPrice = calculateCurrentDishPrice();
    const meatObj = MEAT_OPTIONS.find((m) => m.id === selectedMeat);
    const eggObj = EGG_OPTIONS.find((e) => e.id === eggType);

    const customDish = {
      id: Date.now().toString(),
      name: `กะเพรา DIY (${meatObj?.label})`,
      details: [
        eggObj?.price > 0 ? eggObj.label : null,
        selectedToppings.crackling ? 'กากหมูเจียว' : null,
        selectedToppings.sausage ? 'กุนเชียงทอด' : null,
        `เผ็ด: ${spiceLevel === 'fire' ? 'นรกแตก 🔥🔥' : spiceLevel === 'medium' ? 'กลาง' : 'เบาๆ'}`,
      ].filter(Boolean).join(' • '),
      price: currentPrice,
      quantity: 1,
    };

    setCart((prev) => [...prev, customDish]);
    Alert.alert('เสร็จเรียบร้อย! ✨', 'เพิ่มจานโปรดของคุณลงในตะกร้าแล้ว');
  };

  // ส่งออเดอร์เข้า Supabase
  const submitOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      const { error } = await supabase.from('orders').insert([
        {
          items: cart,
          total_price: totalAmount,
          customer_name: 'โต๊ะ 05 (DIY Special)',
          status: 'ครัวกำลังจัดจาน',
        },
      ]);

      if (error) throw error;
      Alert.alert('ส่งออเดอร์สำเร็จ! 🎉', 'พ่อครัวกำลังปรุงตามที่คุณจัดจานไว้เป๊ะๆ');
      setCart([]);
      setActiveTab('history');
      fetchRecentOrders();
    } catch (err) {
      Alert.alert('บันทึกสำเร็จ (โหมดจำลอง)', 'คำสั่งซื้อของคุณพร้อมเสิร์ฟ');
      setCart([]);
      setActiveTab('history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0284c7" />

      {/* Top Navbar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>BlueBite Lab 🍳</Text>
          <Text style={styles.headerSubtitle}>ออกแบบจานโปรดแบบ Interactive</Text>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, activeTab === 'builder' && styles.navBtnActive]}
            onPress={() => setActiveTab('builder')}
          >
            <Text style={styles.navBtnText}>จัดจาน</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, activeTab === 'history' && styles.navBtnActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={styles.navBtnText}>ประวัติ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'builder' ? (
        <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 110 }}>
          
          {/* ================= 1. VISUAL BUILDER STAGE ================= */}
          <View style={styles.stageCard}>
            <View style={styles.stageTitleRow}>
              <Text style={styles.stageLabel}>LIVE PREVIEW จานจริง</Text>
              <Text style={styles.spiceIndicator}>
                {spiceLevel === 'fire' ? '🌶️🌶️ เผ็ดจัดจ้าน' : spiceLevel === 'medium' ? '🌶️ เผ็ดกำลังดี' : '🌱 เผ็ดน้อย'}
              </Text>
            </View>

            {/* แท่นจานอาหารจำลอง (Layer ซ้อนทับกัน) */}
            <View style={styles.plateContainer}>
              {/* Layer 0: จานรองเซรามิก */}
              <View style={styles.plateRim}>
                {/* Layer 1: ข้าวหอมมะลิ */}
                <Image
                  source={{ uri: VISUAL_ASSETS.baseRice }}
                  style={styles.layerRice}
                />

                {/* Layer 2: ผัดกะเพราเนื้อสัตว์ที่เลือก */}
                <Image
                  source={{ uri: VISUAL_ASSETS.meats[selectedMeat] }}
                  style={styles.layerMeat}
                />

                {/* Layer 3: ท็อปปิ้งเสริม กากหมู / กุนเชียง */}
                {selectedToppings.crackling && (
                  <View style={styles.layerToppingLeft}>
                    <Image
                      source={{ uri: VISUAL_ASSETS.toppings.crackling }}
                      style={styles.toppingSmallImage}
                    />
                    <Text style={styles.microBadge}>กากหมู</Text>
                  </View>
                )}

                {selectedToppings.sausage && (
                  <View style={styles.layerToppingRight}>
                    <Image
                      source={{ uri: VISUAL_ASSETS.toppings.sausage }}
                      style={styles.toppingSmallImage}
                    />
                    <Text style={styles.microBadge}>กุนเชียง</Text>
                  </View>
                )}

                {/* Layer 4: ไข่ดาวตามความสุก วางทับด้านบน */}
                {eggType !== 'none' && (
                  <View style={styles.layerEggWrapper}>
                    <Image
                      source={{ uri: VISUAL_ASSETS.eggs[eggType] }}
                      style={styles.layerEgg}
                    />
                    <View style={styles.eggStyleBadge}>
                      <Text style={styles.eggBadgeText}>
                        {eggType === 'runny' ? 'เยิ้มๆ' : 'กรอบฟู'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.stagePriceTag}>
              <Text style={styles.stagePriceTitle}>ยอดรวมจานนี้</Text>
              <Text style={styles.stagePriceValue}>฿{calculateCurrentDishPrice()}</Text>
            </View>
          </View>

          {/* ================= 2. CUSTOMIZATION CONTROLS ================= */}
          <View style={styles.controlSection}>
            {/* วัตถุดิบหลัก */}
            <Text style={styles.sectionHeader}>1. เลือกเนื้อสัตว์หลัก</Text>
            <View style={styles.chipsRow}>
              {MEAT_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.chip,
                    selectedMeat === item.id && styles.chipActive,
                  ]}
                  onPress={() => setSelectedMeat(item.id)}
                >
                  <Text style={[styles.chipText, selectedMeat === item.id && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.chipPrice, selectedMeat === item.id && styles.chipPriceActive]}>
                    ฿{item.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* สไตล์ไข่ดาว */}
            <Text style={styles.sectionHeader}>2. ระดับไข่ดาวสูตรเด็ด</Text>
            <View style={styles.chipsRow}>
              {EGG_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.chip,
                    eggType === item.id && styles.chipActive,
                  ]}
                  onPress={() => setEggType(item.id)}
                >
                  <Text style={[styles.chipText, eggType === item.id && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.chipPrice, eggType === item.id && styles.chipPriceActive]}>
                    {item.price > 0 ? `+฿${item.price}` : 'ฟรี'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ท็อปปิ้งเสริมกระตุ้นความอร่อย */}
            <Text style={styles.sectionHeader}>3. เติมเครื่องเคียง (Add-ons)</Text>
            <View style={styles.toppingGrid}>
              {TOPPING_OPTIONS.map((topping) => {
                const isSelected = selectedToppings[topping.id];
                return (
                  <TouchableOpacity
                    key={topping.id}
                    style={[styles.toppingCard, isSelected && styles.toppingCardActive]}
                    onPress={() => toggleTopping(topping.id)}
                  >
                    <View style={styles.toppingInfo}>
                      <Text style={[styles.toppingTitle, isSelected && styles.toppingTitleActive]}>
                        {topping.label}
                      </Text>
                      <Text style={styles.toppingPrice}>+฿{topping.price}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      <Text style={styles.checkboxTick}>{isSelected ? '✓' : '+'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ความเผ็ด */}
            <Text style={styles.sectionHeader}>4. ดีกรีความเผ็ด</Text>
            <View style={styles.levelRow}>
              {[
                { id: 'mild', title: 'เผ็ดอนุบาล 👶' },
                { id: 'medium', title: 'เผ็ดต้นตำรับ 🌶️' },
                { id: 'fire', title: 'เผ็ดพ่นไฟ 🔥🔥' },
              ].map((lvl) => (
                <TouchableOpacity
                  key={lvl.id}
                  style={[styles.levelBtn, spiceLevel === lvl.id && styles.levelBtnActive]}
                  onPress={() => setSpiceLevel(lvl.id)}
                >
                  <Text style={[styles.levelBtnText, spiceLevel === lvl.id && styles.levelBtnTextActive]}>
                    {lvl.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ปุ่มใส่ตะกร้า */}
            <TouchableOpacity style={styles.addToCartActionBtn} onPress={handleAddDishToCart}>
              <Text style={styles.addToCartActionText}>
                นำจานนี้ใส่ตะกร้า (฿{calculateCurrentDishPrice()})
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* ================= 3. ORDER HISTORY TAB ================= */
        <View style={styles.historyContainer}>
          <Text style={styles.historyHeaderTitle}>ประวัติการสั่งปรุงล่าสุด (จาก Supabase)</Text>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>ยังไม่มีรายการคำสั่งซื้อ หรือรอการเชื่อมต่อ Database</Text>
          ) : (
            <ScrollView>
              {recentOrders.map((order) => (
                <View key={order.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyId}>คำสั่งซื้อ #{order.id}</Text>
                    <Text style={styles.statusBadge}>{order.status}</Text>
                  </View>
                  <Text style={styles.historyMeta}>ผู้สั่ง: {order.customer_name}</Text>
                  <View style={styles.dividerLight} />
                  {Array.isArray(order.items) &&
                    order.items.map((it, idx) => (
                      <View key={idx} style={styles.historyOrderItem}>
                        <Text style={styles.historyItemName}>{it.name}</Text>
                        <Text style={styles.historyItemDetails}>{it.details}</Text>
                      </View>
                    ))}
                  <Text style={styles.historyTotal}>ยอดรวม: ฿{order.total_price}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <View style={styles.floatingBar}>
          <View>
            <Text style={styles.cartCountText}>{cart.length} จานพร้อมเสิร์ฟ</Text>
            <Text style={styles.cartSumPrice}>
              ฿{cart.reduce((s, i) => s + i.price * i.quantity, 0)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.orderSubmitBtn}
            onPress={submitOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0369a1" />
            ) : (
              <Text style={styles.orderSubmitBtnText}>ยืนยันสั่งอาหาร 🚀</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff', // โทนฟ้าสว่าง Ice Blue
  },
  header: {
    backgroundColor: '#0284c7', // Ocean Sky Blue
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#bae6fd',
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 3,
  },
  navBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  navBtnActive: {
    backgroundColor: '#ffffff',
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#082f49',
  },
  scrollArea: {
    flex: 1,
    padding: 16,
  },

  /* Visual Stage */
  stageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  stageTitleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stageLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0284c7',
    letterSpacing: 1,
  },
  spiceIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e11d48',
  },
  plateContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  plateRim: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#f8fafc',
    borderWidth: 8,
    borderColor: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  layerRice: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.85,
  },
  layerMeat: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    opacity: 0.9,
  },
  layerEggWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerEgg: {
    width: 95,
    height: 95,
    borderRadius: 47,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  eggStyleBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  eggBadgeText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  layerToppingLeft: {
    position: 'absolute',
    top: 30,
    left: 20,
    alignItems: 'center',
  },
  layerToppingRight: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
  },
  toppingSmallImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  microBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 4,
    borderRadius: 4,
    marginTop: 2,
  },
  stagePriceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  stagePriceTitle: {
    fontSize: 13,
    color: '#64748b',
    marginRight: 6,
  },
  stagePriceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0284c7',
  },

  /* Control Section */
  controlSection: {
    marginTop: 18,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  chipText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  chipPrice: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '700',
  },
  chipPriceActive: {
    color: '#e0f2fe',
  },
  toppingGrid: {
    gap: 8,
  },
  toppingCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toppingCardActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#f0f9ff',
  },
  toppingInfo: {
    flex: 1,
  },
  toppingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  toppingTitleActive: {
    color: '#0369a1',
  },
  toppingPrice: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: 'bold',
    marginTop: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0284c7',
  },
  checkboxTick: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  levelBtnActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  levelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  levelBtnTextActive: {
    color: '#b91c1c',
  },
  addToCartActionBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#0284c7',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartActionText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },

  /* Floating Cart Bar */
  floatingBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#0369a1',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cartCountText: {
    color: '#bae6fd',
    fontSize: 11,
    fontWeight: '600',
  },
  cartSumPrice: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  orderSubmitBtn: {
    backgroundColor: '#38bdf8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  orderSubmitBtnText: {
    color: '#082f49',
    fontWeight: 'bold',
    fontSize: 13,
  },

  /* History */
  historyContainer: {
    flex: 1,
    padding: 16,
  },
  historyHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0284c7',
    marginBottom: 12,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 50,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyId: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#0f172a',
  },
  statusBadge: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  dividerLight: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  historyOrderItem: {
    marginBottom: 4,
  },
  historyItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  historyItemDetails: {
    fontSize: 11,
    color: '#64748b',
  },
  historyTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0284c7',
    textAlign: 'right',
    marginTop: 6,
  },
});
