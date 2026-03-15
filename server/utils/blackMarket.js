// ============================================
// The-Underworld - Black Market System (Enhanced)
// ============================================
const db = require('../db.js');

class BlackMarket {
  constructor() {
    // تعريف العناصر مع نظام ندرة
    this.items = [
      // === أسلحة (Weapons) ===
      { 
        id: 'weapon_1', 
        name: 'مسدس صغير', 
        type: 'weapon', 
        price: 500, 
        damage: 20, 
        requiredLevel: 1,
        rarity: 'common',
        description: 'سلاح خفيف للدفاع عن النفس'
      },
      { 
        id: 'weapon_2', 
        name: 'بندقية هجومية', 
        type: 'weapon', 
        price: 2000, 
        damage: 50, 
        requiredLevel: 3,
        rarity: 'rare',
        description: 'تستخدم في الهجمات الكبيرة'
      },
      { 
        id: 'weapon_3', 
        name: 'قاذف صواريخ', 
        type: 'weapon', 
        price: 5000, 
        damage: 100, 
        requiredLevel: 5,
        rarity: 'epic',
        description: 'سلاح فتاك للحروب'
      },
      { 
        id: 'weapon_4', 
        name: 'سكين فنائي', 
        type: 'weapon', 
        price: 300, 
        damage: 15, 
        requiredLevel: 1,
        rarity: 'common',
        description: 'للاغتيالات الصامتة'
      },
      { 
        id: 'weapon_5', 
        name: 'رشاش ثقيل', 
        type: 'weapon', 
        price: 3500, 
        damage: 80, 
        requiredLevel: 4,
        rarity: 'rare',
        description: 'يسبب دماراً هائلاً'
      },
      
      // === دروع (Armor) ===
      { 
        id: 'armor_1', 
        name: 'سترة واقية', 
        type: 'armor', 
        price: 300, 
        defense: 15, 
        requiredLevel: 1,
        rarity: 'common',
        description: 'تقلل الضرر بنسبة 15%'
      },
      { 
        id: 'armor_2', 
        name: 'دروع ثقيلة', 
        type: 'armor', 
        price: 1500, 
        defense: 40, 
        requiredLevel: 3,
        rarity: 'rare',
        description: 'تقلل الضرر بنسبة 40%'
      },
      { 
        id: 'armor_3', 
        name: 'بدلة تكتيكية', 
        type: 'armor', 
        price: 3000, 
        defense: 60, 
        requiredLevel: 5,
        rarity: 'epic',
        description: 'تقلل الضرر بنسبة 60%'
      },

      // === مخدرات (Drugs) ===
      { 
        id: 'drug_1', 
        name: 'مخدرات خفيفة', 
        type: 'drug', 
        price: 200, 
        profit: 100, 
        risk: 0.2,
        requiredLevel: 1,
        rarity: 'common',
        description: 'يمكن بيعها بربح 100$'
      },
      { 
        id: 'drug_2', 
        name: 'مخدرات ثقيلة', 
        type: 'drug', 
        price: 800, 
        profit: 400, 
        risk: 0.5,
        requiredLevel: 3,
        rarity: 'rare',
        description: 'ربح كبير مع خطر الاعتقال'
      },
      { 
        id: 'drug_3', 
        name: 'شحنة كوكايين', 
        type: 'drug', 
        price: 2000, 
        profit: 1000, 
        risk: 0.7,
        requiredLevel: 5,
        rarity: 'epic',
        description: 'ربح هائل ولكن خطر كبير'
      },

      // === معلومات (Info) ===
      { 
        id: 'info_1', 
        name: 'معلومات عن خصم', 
        type: 'info', 
        price: 1000, 
        requiredLevel: 2,
        rarity: 'rare',
        description: 'تكشف موقع خصم عشوائي'
      },
      { 
        id: 'info_2', 
        name: 'خطط شرطة', 
        type: 'info', 
        price: 2500, 
        requiredLevel: 4,
        rarity: 'epic',
        description: 'تجنب المداهمات لمدة 24 ساعة'
      },

      // === عقارات (Properties) ===
      { 
        id: 'prop_1', 
        name: 'وكر صغير', 
        type: 'property', 
        price: 5000, 
        income: 200, 
        requiredLevel: 2,
        rarity: 'rare',
        description: 'يولد 200$ كل ساعة'
      },
      { 
        id: 'prop_2', 
        name: 'كازينو', 
        type: 'property', 
        price: 15000, 
        income: 800, 
        requiredLevel: 5,
        rarity: 'epic',
        description: 'يولد 800$ كل ساعة'
      },
    ];

    // أنواع الندرة
    this.rarityColors = {
      common: '#9e9e9e',
      rare: '#2196F3',
      epic: '#9C27B0',
      legendary: '#FFD700'
    };
  }

  // جلب جميع العناصر مع ترتيب حسب الندرة
  getItems() {
    return this.items.sort((a, b) => {
      const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }

  // جلب العناصر حسب النوع
  getItemsByType(type) {
    return this.items.filter(item => item.type === type);
  }

  // شراء عنصر
  async buyItem(playerId, itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) {
      return { success: false, message: 'العنصر غير موجود' };
    }

    try {
      // التحقق من رصيد اللاعب ومستواه
      const player = await db.query('SELECT money, level FROM players WHERE id = $1', [playerId]);
      if (player.rows.length === 0) {
        return { success: false, message: 'اللاعب غير موجود' };
      }
      const { money, level } = player.rows[0];
      
      if (money < item.price) {
        return { success: false, message: 'لا تملك المال الكافي' };
      }
      if (item.requiredLevel && level < item.requiredLevel) {
        return { success: false, message: `يحتاج مستوى ${item.requiredLevel}` };
      }

      // خصم المبلغ
      await db.query('UPDATE players SET money = money - $1 WHERE id = $2', [item.price, playerId]);

      // إضافة العنصر إلى مخزون اللاعب (مع التأثيرات)
      await db.query(
        'INSERT INTO player_items (player_id, item_id, item_data) VALUES ($1, $2, $3)',
        [playerId, itemId, JSON.stringify(item)]
      );

      // تطبيق تأثيرات العنصر فوراً (مثل الدروع تزيد الدفاع)
      if (item.type === 'armor') {
        // يمكن إضافة حقل defense للاعب
        await db.query(
          'UPDATE players SET defense = COALESCE(defense, 0) + $1 WHERE id = $2',
          [item.defense, playerId]
        );
      }

      return {
        success: true,
        message: `تم شراء ${item.name} بنجاح`,
        item
      };
    } catch (err) {
      console.error('Error in buyItem:', err);
      return { success: false, message: 'خطأ في قاعدة البيانات' };
    }
  }

  // بيع عنصر
  async sellItem(playerId, itemId) {
    try {
      // التحقق من أن اللاعب يمتلك العنصر
      const itemResult = await db.query(
        'SELECT item_data FROM player_items WHERE player_id = $1 AND item_id = $2',
        [playerId, itemId]
      );
      if (itemResult.rows.length === 0) {
        return { success: false, message: 'أنت لا تملك هذا العنصر' };
      }

      const item = JSON.parse(itemResult.rows[0].item_data);
      const sellPrice = Math.floor(item.price * 0.6); // يباع بـ 60% من سعر الشراء

      // حذف العنصر من المخزون
      await db.query(
        'DELETE FROM player_items WHERE player_id = $1 AND item_id = $2',
        [playerId, itemId]
      );

      // إلغاء تأثيرات العنصر (مثل خفض الدفاع)
      if (item.type === 'armor') {
        await db.query(
          'UPDATE players SET defense = COALESCE(defense, 0) - $1 WHERE id = $2',
          [item.defense, playerId]
        );
      }

      // إضافة المال للاعب
      await db.query('UPDATE players SET money = money + $1 WHERE id = $2', [sellPrice, playerId]);

      return {
        success: true,
        message: `تم بيع ${item.name} بمبلغ ${sellPrice}$`,
        price: sellPrice
      };
    } catch (err) {
      console.error('Error in sellItem:', err);
      return { success: false, message: 'خطأ في قاعدة البيانات' };
    }
  }

  // الحصول على مخزون اللاعب
  async getPlayerInventory(playerId) {
    try {
      const result = await db.query(
        'SELECT item_id, item_data FROM player_items WHERE player_id = $1',
        [playerId]
      );
      return result.rows.map(row => ({
        id: row.item_id,
        ...JSON.parse(row.item_data)
      }));
    } catch (err) {
      console.error('Error in getPlayerInventory:', err);
      return [];
    }
  }

  // تحديث الدفاع الكلي للاعب (إذا أضفنا عدة أسلحة)
  async recalcPlayerDefense(playerId) {
    try {
      const items = await this.getPlayerInventory(playerId);
      const totalDefense = items
        .filter(item => item.type === 'armor')
        .reduce((sum, item) => sum + (item.defense || 0), 0);
      await db.query('UPDATE players SET defense = $1 WHERE id = $2', [totalDefense, playerId]);
    } catch (err) {
      console.error('Error recalc defense:', err);
    }
  }
}

module.exports = BlackMarket;