// ============================================
// The-Underworld - Round System
// ============================================
const db = require('../db.js');

class RoundSystem {
  // إنشاء جولة جديدة
  async createRound(roundNumber = null, durationDays = 14) {
    try {
      // إذا لم يُعطَ رقم، نأخذ آخر رقم +1
      if (!roundNumber) {
        const lastRound = await db.query(
          'SELECT round_number FROM rounds ORDER BY round_number DESC LIMIT 1'
        );
        roundNumber = lastRound.rows.length > 0 ? lastRound.rows[0].round_number + 1 : 1;
      }

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await db.query(
        `INSERT INTO rounds (round_number, start_time, end_time, status)
         VALUES ($1, $2, $3, 'active')`,
        [roundNumber, startTime, endTime]
      );

      console.log(`✅ Round ${roundNumber} created, ends at ${endTime.toLocaleString()}`);
      return { success: true, roundNumber, startTime, endTime };
    } catch (err) {
      console.error('❌ Error creating round:', err);
      return { success: false, error: err.message };
    }
  }

  // الحصول على الجولة الحالية النشطة
  async getCurrentRound() {
    try {
      const result = await db.query(
        'SELECT * FROM rounds WHERE status = $1 ORDER BY round_number DESC LIMIT 1',
        ['active']
      );
      if (result.rows.length === 0) {
        // لا توجد جولة نشطة → ننشئ الأولى
        return await this.createRound(1);
      }
      const round = result.rows[0];
      // التحقق من انتهاء الجولة
      if (new Date(round.end_time) < new Date()) {
        await this.endRound(round.round_number);
        return await this.createRound(round.round_number + 1);
      }
      return { success: true, round };
    } catch (err) {
      console.error('❌ Error getting current round:', err);
      return { success: false, error: err.message };
    }
  }

  // إنهاء جولة (نقل الإحصائيات إلى السجل)
  async endRound(roundNumber) {
    try {
      // تحديث حالة الجولة إلى ended
      await db.query(
        'UPDATE rounds SET status = $1 WHERE round_number = $2',
        ['ended', roundNumber]
      );

      // يمكن إضافة نسخ احتياطي لإحصائيات الجولة إلى جدول round_stats
      // مثلاً: تخزين أغنى اللاعبين، أقوى العصابات، إلخ.
      console.log(`⏹️ Round ${roundNumber} ended.`);
      return { success: true };
    } catch (err) {
      console.error('❌ Error ending round:', err);
      return { success: false, error: err.message };
    }
  }

  // الحصول على إحصائيات الجولة (عدد اللاعبين النشطين، إلخ)
  async getRoundStats(roundNumber) {
    try {
      const playersCount = await db.query(
        'SELECT COUNT(*) FROM players WHERE created_at >= (SELECT start_time FROM rounds WHERE round_number = $1)',
        [roundNumber]
      );
      return {
        playersRegistered: parseInt(playersCount.rows[0].count)
      };
    } catch (err) {
      console.error('❌ Error getting round stats:', err);
      return {};
    }
  }
}

module.exports = RoundSystem;